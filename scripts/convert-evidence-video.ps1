param([string]$Workspace = 'S:\bookleaf-assignment-2')
$ErrorActionPreference='Stop'
$vlcPath='C:\Program Files\VideoLAN\VLC\vlc.exe'
if (-not (Test-Path -LiteralPath $vlcPath)) { throw 'Existing VLC required; no software installation is performed.' }
$outDir=Join-Path $Workspace 'deliverables'
$avi=Join-Path $outDir 'bookleaf-evidence-walkthrough.avi'
$mp4=Join-Path $outDir 'bookleaf-evidence-walkthrough-v2.mp4'
$log=Join-Path $outDir 'vlc-mp4-v2.log'
$taskArguments=@('-I','dummy','--no-one-instance','--no-media-library','--no-video-title-show','--sout-mux-caching=15000','--file-logging',"--logfile=$log",$avi,"--sout=#transcode{vcodec=h264,vb=1800,fps=1,venc=x264{bframes=0,lookahead=0},acodec=mp4a,ab=96,channels=1,samplerate=22050}:std{access=file,mux=mp4,dst=$mp4}",'vlc://quit')
$taskProcess=Start-Process -FilePath $vlcPath -ArgumentList $taskArguments -WindowStyle Hidden -PassThru
if (-not $taskProcess.WaitForExit(30000)) { throw 'Conversion is still running; wait for that process before finalizing. No second converter launched.' }
Push-Location -LiteralPath $Workspace
try {
  python scripts/finalize-evidence-mp4.py
  if ($LASTEXITCODE -ne 0) { throw 'MP4 timing finalization failed' }
  python scripts/verify-evidence-video.py
  if ($LASTEXITCODE -ne 0) { throw 'MP4 verification failed' }
} finally { Pop-Location }
