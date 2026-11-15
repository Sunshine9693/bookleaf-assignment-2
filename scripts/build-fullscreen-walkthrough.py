"""Encode actual timestamped fullscreen UI captures at5fps; no synthetic UI."""
from __future__ import annotations

import argparse
from bisect import bisect_right
from datetime import datetime
import hashlib
import io
import json
import math
from pathlib import Path
import re
import subprocess

from PIL import Image, ImageDraw, ImageFont, ImageOps
import imageio_ffmpeg

WIDTH, HEIGHT, FPS = 1600, 900, 5


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1048576), b""):
            digest.update(chunk)
    return digest.hexdigest()


def font(size):
    for path in (Path("C:/Windows/Fonts/segoeui.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")):
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def ffmpeg_run(executable, args):
    result = subprocess.run([executable, "-hide_banner", "-nostdin", *args], capture_output=True, timeout=240)
    if result.returncode:
        raise RuntimeError("ffmpeg failed: " + result.stderr.decode("utf-8", errors="replace")[-1600:])
    return result


def encode(workspace):
    assets = workspace / "deliverables/fullscreen-capture-assets"
    manifest_path = assets / "manifest.json"
    output = workspace / "deliverables/bookleaf-fullscreen-walkthrough.mp4"
    report_path = workspace / "deliverables/fullscreen-video-validation.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8-sig"))
    start = datetime.fromisoformat(manifest["started_at_utc"].replace("Z", "+00:00"))
    if start.tzinfo is None or start.utcoffset().total_seconds() != 0:
        raise ValueError("started_at_utc must be UTC")
    ended = manifest["ended_elapsed_ms"]
    if isinstance(ended, bool) or not isinstance(ended, (int, float)) or not math.isfinite(ended) or ended < 0:
        raise ValueError("Actual capture duration must be finite nonnegative milliseconds")
    frames = manifest["frames"]
    if not isinstance(frames, list) or not frames:
        raise ValueError("No actual screenshots")
    previous, metadata, edited_times, shortened_gaps = -1, [], [], []
    for item in frames:
        elapsed = item["elapsed_ms"]
        if isinstance(elapsed, bool) or not isinstance(elapsed, (int, float)) or not math.isfinite(elapsed) or not 0 <= elapsed <= ended or elapsed < previous:
            raise ValueError("Screenshot timestamps must be ordered finite milliseconds within capture")
        source_delta = elapsed - previous if previous >= 0 else 0
        edited_delta = min(source_delta, 1000)
        edited_times.append((edited_times[-1] if edited_times else 0) + edited_delta)
        if source_delta > 1000:
            shortened_gaps.append({"before_frame_index": len(edited_times) - 1,
                                   "source_gap_ms": source_delta, "edited_gap_ms": 1000})
        previous = elapsed
        path = (assets / item["file"]).resolve()
        if Path(item["file"]).is_absolute() or not path.is_relative_to(assets.resolve()) or path.suffix.lower() != ".png" or not path.is_file():
            raise ValueError("Screenshot must be an existing PNG inside fullscreen assets")
        if not all(isinstance(item.get(key), str) for key in ("chapter", "note")):
            raise ValueError("Screenshot chapter/note must be strings")
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            width, height = image.size
        # Preserve the entire source screenshot, with only aspect-ratio bars.
        fitted_scale = min(WIDTH / width, HEIGHT / height)
        fitted_size = [round(width * fitted_scale), round(height * fitted_scale)]
        metadata.append({"file": item["file"], "elapsed_ms": elapsed, "chapter": item["chapter"],
                         "note": item["note"], "pixels": [width, height], "sha256": sha256(path),
                         "source_elapsed_ms": elapsed, "edited_elapsed_ms": edited_times[-1],
                         "fitted_pixels": fitted_size, "cropped_pixels": 0})

    edited_end_ms = edited_times[-1] + 200
    if not 180000 <= edited_end_ms <= 300000:
        raise ValueError("Edited actual-capture walkthrough must last180–300seconds; do not pad")
    if ended < edited_end_ms:
        raise ValueError("Source duration cannot be shorter than edited duration")

    historical = {str(p.relative_to(workspace)): sha256(p) for p in output.parent.glob("*.mp4") if p.resolve() != output.resolve()}
    times = edited_times
    total_frames = math.ceil(edited_end_ms * FPS / 1000)
    # Keep every actual capture visible at least once, quantizing forwards only.
    # Fail rather than silently drop screenshots or extend the declared timeline.
    sample_slots = []
    for index, timestamp in enumerate(times):
        slot = max(math.ceil(timestamp * FPS / 1000), sample_slots[-1] + 1 if sample_slots else 0)
        sample_slots.append(slot)
        metadata[index]["encoded_frame_index"] = slot
        metadata[index]["encoded_elapsed_ms"] = slot * 1000 / FPS
    if sample_slots[-1] >= total_frames:
        raise ValueError("Every source capture cannot fit the5fps edited timeline; do not silently drop or pad")
    executable = imageio_ffmpeg.get_ffmpeg_exe()
    writer = imageio_ffmpeg.write_frames(str(output), (WIDTH, HEIGHT), fps=FPS, codec="libx264",
                                         pix_fmt_in="rgb24", pix_fmt_out="yuv420p", macro_block_size=1,
                                         output_params=["-movflags", "+faststart", "-crf", "18", "-preset", "medium"],
                                         ffmpeg_log_level="error")
    overlay_font = font(19)
    cached_index, cached_image = None, None
    writer.send(None)
    try:
        for index in range(total_frames):
            elapsed = index * 1000 / FPS
            selected = bisect_right(sample_slots, index) - 1
            if selected < 0:
                canvas = Image.new("RGB", (WIDTH, HEIGHT), "#101820")
                ImageDraw.Draw(canvas).text((30, 430), "Capture started; first screenshot pending.", fill="white", font=overlay_font)
                chapter = "First actual capture pending"
            else:
                if cached_index != selected:
                    with Image.open(assets / frames[selected]["file"]) as image:
                        fitted = ImageOps.contain(image.convert("RGB"), (WIDTH, HEIGHT), method=Image.Resampling.LANCZOS)
                        cached_image = Image.new("RGB", (WIDTH, HEIGHT), "#101820")
                        cached_image.paste(fitted, ((WIDTH - fitted.width) // 2, (HEIGHT - fitted.height) // 2))
                    cached_index = selected
                canvas = cached_image.copy()
                chapter = frames[selected]["chapter"]
                if "generated summary" in chapter.lower():
                    chapter += " | Draft: automated check only"
            # Small36px overlay; no slideshow frame, giant notes, or invented state.
            overlay = Image.new("RGBA", (WIDTH, 36), (0, 0, 0, 175))
            draw = ImageDraw.Draw(overlay)
            label = chapter.replace("\n", " ")
            while draw.textbbox((0, 0), label, font=overlay_font)[2] > WIDTH - 190:
                label = label[:-4] + "..." if len(label) > 4 else "..."
            draw.text((15, 6), label, fill="white", font=overlay_font)
            draw.text((WIDTH - 160, 6), "Actual UI |5fps", fill=(220, 220, 220), font=overlay_font)
            canvas.paste(overlay, (0, HEIGHT - 36), overlay)
            writer.send(canvas.tobytes())
    finally:
        writer.close()

    ffmpeg_run(executable, ["-v", "error", "-xerror", "-i", str(output), "-f", "null", "-"])
    probe = subprocess.run([executable, "-hide_banner", "-i", str(output)], capture_output=True)
    info = probe.stderr.decode("utf-8", errors="replace")
    found = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", info)
    if not found or "h264" not in info or "yuv420p" not in info:
        raise RuntimeError("Expected H264/yuv420p duration metadata missing")
    duration = int(found[1]) * 3600 + int(found[2]) * 60 + float(found[3])
    if not 180 <= duration <= 300 or abs(duration - edited_end_ms / 1000) > 0.21:
        raise RuntimeError("Video duration does not preserve declared edited capture timeline")
    samples = []
    for timestamp in (0, duration / 2, max(0, duration - 0.2)):
        result = ffmpeg_run(executable, ["-v", "error", "-ss", str(timestamp), "-i", str(output), "-frames:v", "1", "-vf", "scale=320:-2", "-f", "image2pipe", "-vcodec", "png", "-"])
        with Image.open(io.BytesIO(result.stdout)) as sample:
            sample.load()
            samples.append({"seconds": timestamp, "decoded_pixels": list(sample.size), "passed": True})
    for relative, original_hash in historical.items():
        if sha256(workspace / relative) != original_hash:
            raise RuntimeError("Another historical video changed")
    report = {"source_manifest": str(manifest_path.relative_to(workspace)), "manifest_sha256": sha256(manifest_path),
              "started_at_utc": manifest["started_at_utc"], "actual_capture_seconds": ended / 1000,
              "edited_capture_seconds": edited_end_ms / 1000,
              "video_duration_seconds": duration, "fps": FPS, "encoded_frames": total_frames,
              "source_screenshot_count": len(frames), "canvas_pixels": [WIDTH, HEIGHT], "codec": "h264",
              "pixel_format": "yuv420p", "audio": "none", "output": str(output.relative_to(workspace)),
              "output_sha256": sha256(output), "screenshots": metadata,
              "rendering": "Full screenshot proportionally contained in1600x900, no crop; minimal aspect-ratio bars;36px bottom chapter/5fps overlay.",
              "timeline": "Edited UI walkthrough: first capture starts at0; only inter-capture gaps longer than1000ms are shortened to1000ms; final capture held200ms. Every source screenshot appears in order at least once, quantized forwards into5fps output slots; per-frame source/edited/encoded times are disclosed. Final duration rounded by less than200ms.",
              "source_frames_order_preserved": True, "source_to_edited_mapping": metadata,
              "shortened_idle_gaps": shortened_gaps,
              "full_ffmpeg_error_decode_passed": True, "start_mid_end_decode": samples,
              "other_mp4_sha256": historical, "historical_videos_untouched": True,
              "limitations": ["Silent edited actual screenshot UI walkthrough, not continuous full-motion recording; unrecorded idle gaps over1second shortened to1second.",
                              "Frame timing quantized to5fps; close source frames may be delayed to retain every capture; overlay covers bottom36pixels.",
                              "Automated validator success does not establish full human policy acceptance. The generated-summary scene is an automated-check-only draft, not confirmation of a scheduled payout.",
                              "No synthetic UI or simulated success; video alone does not prove full callback/email success."]}
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Fullscreen video validated: {duration:.2f}s,{total_frames}frames,{len(frames)}actual screenshots.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parents[1])
    encode(parser.parse_args().workspace.resolve())
