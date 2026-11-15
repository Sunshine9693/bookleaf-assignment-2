# Current and historical walkthroughs

**Current reviewer artifact:** [bookleaf-current-ui-walkthrough.mp4](bookleaf-current-ui-walkthrough.mp4), **4:46**, H264/yuv420p, 1280x800, silent with captions. It contains 108 fresh browser screenshots over 285.272 seconds of actual capture time, encoded at 1 fps with last-observed-frame holds across gaps. It shows Admin portfolio/search/detail, a real AI execution with valid output, callback subscription rejection, editor-assisted Priya Author preview and Admin-route redirect. It is low-frame-rate actual UI capture, not full-motion recording or an accepted end-to-end callback demonstration. The full AI output is in [the fresh result](../n8n/fresh-provider-ui-result-2026-11-16.json).

[Current validation](current-ui-video-validation.json) records full bitstream decode, start/middle/end decodes, actual timestamps, capture/output hashes and unchanged historical-video hashes. Reproduction uses scripts/build-current-ui-walkthrough.py with Pillow and imageio-ffmpeg; raw capture frames remain local and excluded from Git. The video samples do not include password entry or secret values.

## Historical narrated saved-evidence walkthrough

**Historical scope:** this video predates the later real provider pass and three user-assisted password-login checks. Its spoken pending-work statements describe its recording checkpoint. Use [current acceptance](../docs/22_CURRENT_ACCEPTANCE.md) for the latest results; the video itself has not been relabeled as new live evidence.

**Primary artifact:** [bookleaf-evidence-walkthrough-final.mp4](bookleaf-evidence-walkthrough-final.mp4) — **3 minutes 46 seconds**, 1280 × 720, H.264 video and AAC audio, approximately 3.2 MB.

This is a narrated slideshow of actual saved screenshots and clearly labeled text panels. It is **not an interactive screen recording, live AI execution, password-login demonstration or claim of completed acceptance**. Narration is generated locally with the installed Microsoft Zira Desktop speech voice. No external speech service or purchase was used.

The presentation explicitly states: original source/data preserved; nine eligible bulk requests failed (two immediate rejections, seven timeouts); original and retry requests remain separate; genuine AI/callback success and actual password login are unverified; Bubble reports a Free-plan workflow limit; private credential replacement/setup remains pending; no real email or paid upgrade occurred.

## Evidence sources

Only these four screenshots are shown, after visual review:

- `admin-detail-metadata-live.png`: Priya's selected admin detail.
- `notification-history-live.png`: a real history excerpt, identified as an excerpt rather than the entire eleven-row capture.
- `n8n-error-handler-attached.png`: selected error-workflow configuration, explicitly not invocation proof.
- `bubble-free-limit-live.png`: actual plan screen; the workflow-limit tooltip remains identified as a builder observation.

Labeled text panels summarize the existing QA ledger and `docs/notification-live-reconciliation.json`. No synthetic app screen or credential screenshot is included. Screenshot SHA-256 values and per-slide narration/durations are in [evidence-video-manifest.json](evidence-video-manifest.json). The full text is in [NARRATION.md](NARRATION.md).

## Validation

[video-validation.json](video-validation.json) records file hashes, both MP4 tracks, full 226-second duration, dimensions and codecs. The final MP4 narration was decoded through installed VLC to PCM: about 225.93 seconds, over four million nonzero samples and RMS approximately 3091. A frame at 120 seconds was decoded and visually inspected; source screenshots and representative generated panels were visually checked. This is artifact validation, not application/integration acceptance or full subjective listening.

VLC conversion initially trimmed final repeated still-frame timing. The finalizer extends the last evidence card and updates MP4 timing/chunk tables; encoded video/audio media bytes are unchanged. Both the final video track and movie report 226 seconds, with complete audio about 225.98 seconds.

## Reproduction and packaging

On the existing Windows machine, with System.Drawing, System.Speech and the already installed VLC:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-evidence-walkthrough.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/convert-evidence-video.ps1
python scripts/verify-evidence-video.py
```

The scripts do not use a browser, network, credentials, paid software or external generation service. Existing source screenshot paths are prerequisites.

For the checkpoint commit, include only the final MP4, this README, NARRATION.md, evidence-video-manifest.json, video-validation.json and the four builder/converter/verifier scripts. The approximately 30 MB AVI, intermediate MP4s, logs, generated JPEG/WAV assets and decoded test files can stay local; do not stage `deliverables/` wholesale. A reviewer-friendly hosted recording link and reviewer access remain separate handoff tasks; this local artifact does not grant access to a private repository.
