"""Encode actual timestamped browser captures; never synthesize application UI."""

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
import textwrap

from PIL import Image, ImageDraw, ImageFont, ImageOps
import imageio_ffmpeg


WIDTH, HEIGHT, FPS = 1280, 800, 1


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def font(size: int):
    for path in (Path("C:/Windows/Fonts/segoeui.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")):
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def run_ffmpeg(executable: str, arguments: list[str], timeout: int = 180):
    result = subprocess.run(
        [executable, "-hide_banner", "-nostdin", *arguments],
        capture_output=True, timeout=timeout, check=False,
    )
    if result.returncode:
        raise RuntimeError("ffmpeg validation failed: " + result.stderr.decode("utf-8", errors="replace")[-1800:])
    return result


def encode(workspace: Path) -> None:
    assets = workspace / "deliverables/current-ui-capture-assets"
    manifest_path = assets / "manifest.json"
    output = workspace / "deliverables/bookleaf-current-ui-walkthrough.mp4"
    validation_path = workspace / "deliverables/current-ui-video-validation.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8-sig"))
    start = datetime.fromisoformat(manifest["started_at_utc"].replace("Z", "+00:00"))
    if start.tzinfo is None or start.utcoffset().total_seconds() != 0:
        raise ValueError("started_at_utc must include UTC timezone")
    end_ms = manifest["ended_elapsed_ms"]
    if isinstance(end_ms, bool) or not isinstance(end_ms, (int, float)) or not math.isfinite(end_ms):
        raise ValueError("ended_elapsed_ms must be finite milliseconds")
    if not 180000 <= end_ms <= 300000:
        raise ValueError("Actual capture must last180–300seconds; do not pad a shorter capture")
    frames = manifest["frames"]
    if not isinstance(frames, list) or not frames:
        raise ValueError("At least one actual screenshot is required")
    previous = -1
    metadata = []
    for item in frames:
        elapsed = item["elapsed_ms"]
        if isinstance(elapsed, bool) or not isinstance(elapsed, (int, float)) or not math.isfinite(elapsed):
            raise ValueError("Every elapsed_ms must be finite milliseconds")
        if not previous <= elapsed <= end_ms or elapsed < 0:
            raise ValueError("Capture timestamps must be ordered and within actual duration")
        previous = elapsed
        relative = Path(item["file"])
        path = (assets / relative).resolve()
        if relative.is_absolute() or not path.is_relative_to(assets.resolve()) or path.suffix.lower() != ".png":
            raise ValueError("Screenshot paths must be PNG files inside capture assets")
        if not path.is_file():
            raise FileNotFoundError(path)
        for key in ("chapter", "note"):
            if not isinstance(item.get(key), str):
                raise ValueError("Each capture needs text chapter and note")
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            dimensions = list(image.size)
        metadata.append({"file": item["file"], "elapsed_ms": elapsed,
                         "chapter": item["chapter"], "note": item["note"],
                         "size_pixels": dimensions, "sha256": sha256(path)})

    # Read-only hashes establish that any older MP4 in this directory stays untouched.
    historical = {str(path.relative_to(workspace)): sha256(path)
                  for path in output.parent.glob("*.mp4") if path.resolve() != output.resolve()}
    times = [item["elapsed_ms"] for item in frames]
    frame_count = math.ceil(end_ms / 1000)
    title_font, small_font = font(21), font(16)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    writer = imageio_ffmpeg.write_frames(
        str(output), (WIDTH, HEIGHT), fps=FPS, codec="libx264",
        pix_fmt_in="rgb24", pix_fmt_out="yuv420p", macro_block_size=16,
        output_params=["-movflags", "+faststart", "-crf", "20", "-preset", "medium"],
        ffmpeg_log_level="error",
    )
    cached_index, cached_image = None, None
    writer.send(None)
    try:
        for second in range(frame_count):
            index = bisect_right(times, second * 1000) - 1
            canvas = Image.new("RGB", (WIDTH, HEIGHT), "#101820")
            draw = ImageDraw.Draw(canvas)
            draw.text((22, 10), "BookLeaf | Actual UI capture | 1 fps | Silent walkthrough", font=title_font, fill="white")
            draw.text((22, 38), "Screenshots retain actual capture timing; gaps hold the last observed frame.", font=small_font, fill="#c6d5df")
            if index >= 0:
                if cached_index != index:
                    with Image.open(assets / frames[index]["file"]) as screenshot:
                        cached_image = ImageOps.contain(screenshot.convert("RGB"), (WIDTH - 24, 660), Image.Resampling.LANCZOS)
                    cached_index = index
                canvas.paste(cached_image, ((WIDTH - cached_image.width) // 2, 67 + (660 - cached_image.height) // 2))
                label = f"{second // 60:02d}:{second % 60:02d} elapsed | Observed at {times[index] / 1000:.1f}s | {frames[index]['chapter']}"
                note = frames[index]["note"]
            else:
                draw.text((35, 350), "Capture started; first actual screenshot pending.", font=title_font, fill="white")
                label, note = f"00:{second:02d} elapsed | No screenshot observed yet", "No application state is inferred before the first capture."
            draw.text((22, 735), textwrap.shorten(label, 138, placeholder="..."), font=small_font, fill="white")
            draw.text((22, 758), textwrap.shorten(note.replace("\n", " "), 145, placeholder="..."), font=small_font, fill="#c6d5df")
            writer.send(canvas.tobytes())
    finally:
        writer.close()

    # Validate the whole bitstream and independently decode beginning/middle/end.
    run_ffmpeg(ffmpeg, ["-v", "error", "-xerror", "-i", str(output), "-f", "null", "-"])
    probe = subprocess.run([ffmpeg, "-hide_banner", "-i", str(output)], capture_output=True, check=False)
    info = probe.stderr.decode("utf-8", errors="replace")
    match = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", info)
    if not match or "h264" not in info or "yuv420p" not in info:
        raise RuntimeError("Missing verified H264/yuv420p duration metadata")
    duration = int(match[1]) * 3600 + int(match[2]) * 60 + float(match[3])
    if not 180 <= duration <= 300 or abs(duration - end_ms / 1000) >= 1.01:
        raise RuntimeError("Encoded duration diverges from actual timeline")
    decoded = []
    for timestamp in (0, duration / 2, max(0, duration - 1)):
        result = run_ffmpeg(ffmpeg, ["-v", "error", "-ss", str(timestamp), "-i", str(output),
                                      "-frames:v", "1", "-vf", "scale=320:-2", "-f", "image2pipe", "-vcodec", "png", "-"])
        with Image.open(io.BytesIO(result.stdout)) as sample:
            sample.load()
            decoded.append({"timestamp_seconds": timestamp, "decoded_size": list(sample.size), "passed": True})
    for relative, digest in historical.items():
        if sha256(workspace / relative) != digest:
            raise RuntimeError("Historical video changed unexpectedly")
    report = {
        "source_manifest": str(manifest_path.relative_to(workspace)),
        "manifest_sha256": sha256(manifest_path), "started_at_utc": manifest["started_at_utc"],
        "actual_capture_duration_seconds": end_ms / 1000, "encoded_duration_seconds": duration,
        "fps": FPS, "encoded_frame_count": frame_count, "screenshot_count": len(frames),
        "canvas_pixels": [WIDTH, HEIGHT], "codec": "h264", "pixel_format": "yuv420p", "audio": "none",
        "output": str(output.relative_to(workspace)), "output_sha256": sha256(output),
        "screenshots": metadata, "full_bitstream_error_decode_passed": True,
        "start_mid_end_decode": decoded, "historical_mp4_sha256": historical,
        "historical_videos_untouched": True,
        "timeline_rule": "1fps wall-clock timeline; most recent actually observed capture is held between timestamps; initial gap is a labelled slate. At most subsecond rounding to complete the final1fps frame.",
        "limitations": ["Low-fps actual screenshot UI capture, not full-motion screen recording.",
                        "Subsecond UI changes can fall between the1fps sampling instants.",
                        "Silent captions; no generated UI or simulated successful state.",
                        "Shows only the observed UI; video alone does not establish full authenticated callback or email success."],
    }
    validation_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Encoded and validated {frame_count} actual-timeline frames from {len(frames)} screenshots; duration {duration:.1f}s.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parents[1])
    encode(parser.parse_args().workspace.resolve())
