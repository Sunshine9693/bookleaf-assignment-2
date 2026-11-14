param([string]$Workspace = 'S:\bookleaf-assignment-2')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Speech
$outDir = Join-Path $Workspace 'deliverables'
$assetDir = Join-Path $outDir 'evidence-video-assets'
New-Item -ItemType Directory -Path $assetDir -Force | Out-Null

# A narrated saved-evidence slideshow, not a browser recording or fabricated UI.
$slides = @(
    @{
        title='BookLeaf Assignment 2'; subtitle='Saved-evidence walkthrough | 14 November 2026'; image=$null
        lines=@('Existing Bubble app + n8n workflow artifacts','Screenshots and labeled reconciliation facts only','No interactive recording or live AI success claimed')
        narration='This is a narrated walkthrough of saved evidence for BookLeaf Assignment Two. It is a screenshot and text-panel presentation, not an interactive browser recording. The work uses the existing Bubble application and n8n workspace. The portal and failed-request lifecycle have recorded evidence. Successful live AI generation, authenticated callback acceptance, and actual password logins remain unverified. This presentation states those limits explicitly rather than treating a saved workflow or local test as a completed integration.'
    },
    @{
        title='Original data preserved'; subtitle='TEXT PANEL | local source and saved-capture reconciliation'; image=$null
        lines=@('10 Authors | 18 Books | 7,205 copies','Earned INR 243,382 | Paid INR 202,543 | Pending INR 40,839','Original SHA-256 and eight data files unchanged','Two isolated converter runs: 686 / 686 checks each')
        narration='The supplied source remains preserved: ten authors, eighteen books, and seven thousand two hundred and five copies sold. Earned royalties total two hundred forty-three thousand three hundred eighty-two rupees; paid royalties total two hundred two thousand five hundred forty-three; pending royalties total forty thousand eight hundred thirty-nine. Source hashes and eight local data files remain unchanged. The real converter passed six hundred eighty-six checks at both the original and current assessment dates in an isolated temporary directory. These are local data checks, not new live application tests.'
    },
    @{
        title='Selected-author detail'; subtitle='ACTUAL SAVED SCREENSHOT | Priya admin detail'; image='admin-detail-metadata-live.png'
        lines=@('Two source books | 14 / 14 metadata checks','Totals: INR 19,908 earned | 16,338 paid | 3,570 pending')
        narration='This actual saved screenshot shows Priya Sharma selected in the admin author detail. Her two books reconcile to nineteen thousand nine hundred eight rupees earned, sixteen thousand three hundred thirty-eight paid, and three thousand five hundred seventy pending. Fourteen metadata checks match the two original book records, including the exact publication status. The page explains that payout figures are aggregate values and last payout dates. The supplied dataset contains no transaction-level payout history, so no transaction events or payment references have been invented.'
    },
    @{
        title='Roles and portfolio checks'; subtitle='TEXT PANEL | captured Run as sessions, not password logins'; image=$null
        lines=@('All 10 admin rows and four payout-filter counts reconcile','AUTH001 and AUTH002: own two books and correct totals','Six protected admin-route destinations redirect','Author logout + logged-out dashboard redirects captured','Actual password login remains UNVERIFIED')
        narration='Captured admin rows reconcile all ten authors and the four payout-filter counts. Two editor Run as author sessions show their own two books and correct totals. Six attempts to reach protected admin routes return to the author dashboard. Author logout and subsequent logged-out dashboard requests land on login. These observations support the captured session and route cases. They do not establish actual password login, arbitrary database-query isolation, or the absence of transient content during navigation. Those boundaries are documented in the test ledger.'
    },
    @{
        title='Visible failed-request history'; subtitle='ACTUAL SAVED SCREENSHOT | history excerpt'; image='notification-history-live.png'
        lines=@('All-history text capture: 11 distinct request IDs','Nine eligible bulk authors once each; AUTH008 absent','2 immediate rejections + 7 timeout failures; NO Success')
        narration='This saved history screenshot shows part of the failure log. The complete text capture independently reconciles eleven distinct request IDs. Nine requests in the reported bulk click window cover each author with positive pending royalties exactly once. The fully paid author, AUTH zero zero eight, is absent. Two requests failed immediately with a safe service-rejection message. Seven show timeout errors and completion five displayed minutes later. These are real request-coverage and recovery outcomes. They are not successful AI summaries. All eleven rows are Failed, with empty generated-content fields and email delivery disabled.'
    },
    @{
        title='Retry and error configuration'; subtitle='ACTUAL SAVED SCREENSHOT | error-workflow selection'; image='n8n-error-handler-attached.png'
        lines=@('Priya original 09:57 + retry 10:28: separate request IDs','Previously captured original fields preserved','Error-workflow selection is configuration, not invocation proof')
        narration='Priya original request at nine fifty-seven and the subsequent request at ten twenty-eight remain separate Failed rows with different IDs. The original displayed status, error and timestamps are preserved after the bulk run. The builder identifies the second action as Retry; the saved history independently establishes the distinct coexisting records. This screenshot shows error-workflow selection in n8n settings. Configuration is not proof that the error workflow was invoked. Local n8n checks pass forty-nine cases, but no real provider execution or authenticated callback success is established. Search-based duplicate guards remain non-atomic.'
    },
    @{
        title='Current platform restriction'; subtitle='ACTUAL SAVED SCREENSHOT | Bubble Free plan'; image='bubble-free-limit-live.png'
        lines=@('Builder observed: Free-plan workflow testing limit','No paid upgrade or trial authorized or taken','Private credential replacement/setup still pending')
        narration='Bubble now reports a workflow limit on the Free plan and asks for an upgrade to continue testing. This is the actual saved plan screen; the exact workflow-limit tooltip is recorded as a builder observation in the handoff. The displayed monthly workload allowance does not prove the separate workflow restriction is cleared. No paid upgrade or trial was authorized or taken. Private credential replacement and setup also remain pending. No secret values appear in this presentation, and no authentication requirement was weakened to bypass the blocker.'
    },
    @{
        title='Delivered evidence and remaining gates'; subtitle='TEXT PANEL | honest checkpoint, not completed acceptance'; image=$null
        lines=@('Private repository: source tools, workflows, QA and handoff','AI + callback success: UNVERIFIED | Password login: UNVERIFIED','Successful bulk summaries and final reviewer access pending','No real email sent | No invented payouts | No plan purchase')
        narration='The private repository contains workflow artifacts, prompt and validation logic, source-preserving tools, saved evidence, and the latest implementation checkpoint. The remaining gates are a real AI response updating its original log through the authenticated callback, successful bulk summaries, password-login acceptance, security replay checks, and reviewer access. The platform restriction and credential setup must be resolved through an authorized path before those tests can pass. No real author email was sent. This video documents the verified work and the incomplete areas without presenting a simulated success as a live result.'
    }
)

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.IO;
using System.Text;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
public static class EvidenceVideo {
  public sealed class Wave { public byte[] Format, Data; public int Rate, Average, Align; }
  public static Wave ReadWave(string file) {
    using(var r=new BinaryReader(File.OpenRead(file))) {
      if(new string(r.ReadChars(4))!="RIFF") throw new Exception("Not RIFF"); r.ReadInt32();
      if(new string(r.ReadChars(4))!="WAVE") throw new Exception("Not WAVE");
      var w=new Wave();
      while(r.BaseStream.Position+8<=r.BaseStream.Length) {
        string id=new string(r.ReadChars(4)); int n=r.ReadInt32(); byte[] b=r.ReadBytes(n); if((n&1)!=0)r.ReadByte();
        if(id=="fmt ")w.Format=b; if(id=="data")w.Data=b;
      }
      if(w.Format==null||w.Data==null||BitConverter.ToInt16(w.Format,0)!=1)throw new Exception("Need PCM WAV");
      w.Rate=BitConverter.ToInt32(w.Format,4);w.Average=BitConverter.ToInt32(w.Format,8);w.Align=BitConverter.ToInt16(w.Format,12);return w;
    }
  }
  static void FCC(BinaryWriter w,string s){w.Write(Encoding.ASCII.GetBytes(s));}
  static long List(BinaryWriter w,string type){long p=w.BaseStream.Position;FCC(w,"LIST");w.Write(0);FCC(w,type);return p;}
  static void End(BinaryWriter w,long start){long end=w.BaseStream.Position;w.BaseStream.Position=start+4;w.Write((int)(end-start-8));w.BaseStream.Position=end;}
  static void Chunk(BinaryWriter w,string name,byte[] bytes){FCC(w,name);w.Write(bytes.Length);w.Write(bytes);if((bytes.Length&1)!=0)w.Write((byte)0);}
  static byte[] Bytes(Action<BinaryWriter> fill){using(var m=new MemoryStream()){using(var w=new BinaryWriter(m,Encoding.UTF8,true))fill(w);return m.ToArray();}}
  static byte[] StreamHeader(string type,string handler,int scale,int rate,int length,int sample,int width,int height){return Bytes(w=>{FCC(w,type);FCC(w,handler);w.Write(0);w.Write((short)0);w.Write((short)0);w.Write(0);w.Write(scale);w.Write(rate);w.Write(0);w.Write(length);w.Write(4000000);w.Write(-1);w.Write(sample);w.Write((short)0);w.Write((short)0);w.Write((short)width);w.Write((short)height);});}
  public static string Build(string[] images,string[] audio,string output){
    var waves=new List<Wave>();var counts=new List<int>();var frames=new List<byte[]>();int total=0;
    for(int i=0;i<audio.Length;i++){var wave=ReadWave(audio[i]);waves.Add(wave);int n=(int)Math.Ceiling((double)wave.Data.Length/wave.Average)+1;counts.Add(n);total+=n;frames.Add(File.ReadAllBytes(images[i]));}
    Wave format=waves[0];foreach(var v in waves)if(v.Rate!=format.Rate||v.Align!=format.Align)throw new Exception("Audio formats differ");
    int audioLength=total*format.Average;long nonzero=0;double sum=0;foreach(var v in waves)for(int j=0;j+1<v.Data.Length;j+=2){short value=BitConverter.ToInt16(v.Data,j);if(value!=0)nonzero++;sum+=(double)value*value;}
    using(var w=new BinaryWriter(File.Create(output))){
      FCC(w,"RIFF");w.Write(0);FCC(w,"AVI ");long header=List(w,"hdrl");
      Chunk(w,"avih",Bytes(x=>{x.Write(1000000);x.Write(4000000);x.Write(0);x.Write(0x10);x.Write(total);x.Write(0);x.Write(2);x.Write(4000000);x.Write(1280);x.Write(720);for(int z=0;z<4;z++)x.Write(0);}));
      long vs=List(w,"strl");Chunk(w,"strh",StreamHeader("vids","MJPG",1,1,total,0,1280,720));
      Chunk(w,"strf",Bytes(x=>{x.Write(40);x.Write(1280);x.Write(720);x.Write((short)1);x.Write((short)24);FCC(x,"MJPG");x.Write(1280*720*3);for(int z=0;z<4;z++)x.Write(0);}));End(w,vs);
      long aud=List(w,"strl");Chunk(w,"strh",StreamHeader("auds","\0\0\0\0",format.Align,format.Average,audioLength/format.Align,format.Align,0,0));Chunk(w,"strf",format.Format);End(w,aud);End(w,header);
      long movi=List(w,"movi");var index=new List<byte[]>();
      for(int s=0;s<images.Length;s++)for(int f=0;f<counts[s];f++){
        long p=w.BaseStream.Position;byte[] jpeg=frames[s];Chunk(w,"00dc",jpeg);index.Add(Bytes(x=>{FCC(x,"00dc");x.Write(0x10);x.Write((int)(p-movi-8));x.Write(jpeg.Length);}));
        byte[] pcm=new byte[format.Average];int offset=f*format.Average;int take=Math.Min(pcm.Length,Math.Max(0,waves[s].Data.Length-offset));if(take>0)Array.Copy(waves[s].Data,offset,pcm,0,take);
        p=w.BaseStream.Position;Chunk(w,"01wb",pcm);index.Add(Bytes(x=>{FCC(x,"01wb");x.Write(0);x.Write((int)(p-movi-8));x.Write(pcm.Length);}));
      }
      End(w,movi);Chunk(w,"idx1",Bytes(x=>{foreach(var entry in index)x.Write(entry);}));long size=w.BaseStream.Length;w.BaseStream.Position=4;w.Write((int)(size-8));
    }
    return "{\"duration_seconds\":"+total+",\"frames\":"+total+",\"frame_rate\":1,\"width\":1280,\"height\":720,\"video_codec\":\"MJPEG\",\"audio_codec\":\"PCM\",\"audio_rate\":"+format.Rate+",\"audio_nonzero_samples\":"+nonzero+",\"audio_rms\":"+Math.Sqrt(sum/(audioLength/format.Align)).ToString(System.Globalization.CultureInfo.InvariantCulture)+"}";
  }
}
'@

$speech = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speech.SelectVoice('Microsoft Zira Desktop')
$speech.Rate = 3
$imagePaths = @(); $audioPaths = @(); $manifestSlides = @(); $narrationText = @()
try {
  for ($i=0; $i -lt $slides.Count; $i++) {
    $slide = $slides[$i]
    $stem = '{0:D2}' -f ($i+1)
    $wav = Join-Path $assetDir ($stem + '.wav')
    $jpg = Join-Path $assetDir ($stem + '.jpg')
    $speech.SetOutputToWaveFile($wav)
    $speech.Speak($slide.narration)
    $speech.SetOutputToNull()
    $bitmap = New-Object System.Drawing.Bitmap(1280,720)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::FromArgb(13,25,48))
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $white = [System.Drawing.Brushes]::White
    $pale = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180,206,235))
    $titleFont = New-Object System.Drawing.Font('Segoe UI',30,[System.Drawing.FontStyle]::Bold)
    $subtitleFont = New-Object System.Drawing.Font('Segoe UI',15)
    $bodyFont = New-Object System.Drawing.Font('Segoe UI',24)
    $smallFont = New-Object System.Drawing.Font('Segoe UI',14)
    $graphics.DrawString($slide.title,$titleFont,$white,40,22)
    $graphics.DrawString($slide.subtitle,$subtitleFont,$pale,42,78)
    if ($slide.image) {
      $sourceImage = [System.Drawing.Image]::FromFile((Join-Path $Workspace $slide.image))
      $scale = [Math]::Min(1192.0/$sourceImage.Width,470.0/$sourceImage.Height)
      $scaledW = [int]($sourceImage.Width*$scale); $scaledH = [int]($sourceImage.Height*$scale)
      $graphics.DrawImage($sourceImage,[int]((1280-$scaledW)/2),[int](110+(470-$scaledH)/2),$scaledW,$scaledH)
      $sourceImage.Dispose()
      $lineY=590
      foreach ($line in $slide.lines) { $graphics.DrawString($line,$smallFont,$white,44,$lineY); $lineY+=27 }
    } else {
      $lineY=165
      foreach ($line in $slide.lines) { $graphics.DrawString($line,$bodyFont,$white,55,$lineY); $lineY+=81 }
    }
    $graphics.DrawString(('Saved evidence | Not an interactive/live-success recording                         {0} / {1}' -f ($i+1),$slides.Count),$smallFont,$pale,43,683)
    $bitmap.Save($jpg,[System.Drawing.Imaging.ImageFormat]::Jpeg)
    $graphics.Dispose(); $bitmap.Dispose(); $pale.Dispose(); $titleFont.Dispose(); $subtitleFont.Dispose(); $bodyFont.Dispose(); $smallFont.Dispose()
    $waveInfo=[EvidenceVideo]::ReadWave($wav)
    $manifestSlides += [pscustomobject]@{ number=$i+1; title=$slide.title; source_screenshot=$slide.image; narration=$slide.narration; duration_seconds=[Math]::Ceiling($waveInfo.Data.Length/$waveInfo.Average)+1 }
    $narrationText += ('## {0}. {1}' -f ($i+1),$slide.title), '', $slide.narration, ''
    $imagePaths += $jpg; $audioPaths += $wav
  }
} finally { $speech.Dispose() }
$video = Join-Path $outDir 'bookleaf-evidence-walkthrough.avi'
$result = [EvidenceVideo]::Build([string[]]$imagePaths,[string[]]$audioPaths,$video) | ConvertFrom-Json
$manifest=[pscustomobject]@{ generated_at_utc=[DateTime]::UtcNow.ToString('o'); kind='Narrated saved-evidence slideshow, not interactive screen recording'; tts_voice='Microsoft Zira Desktop'; video_file='bookleaf-evidence-walkthrough.avi'; validation=$result; slides=$manifestSlides; source_sha256=@{} }
foreach($file in @('admin-detail-metadata-live.png','notification-history-live.png','bubble-free-limit-live.png','n8n-error-handler-attached.png')) { $manifest.source_sha256[$file]=(Get-FileHash -LiteralPath (Join-Path $Workspace $file) -Algorithm SHA256).Hash.ToLowerInvariant() }
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $outDir 'evidence-video-manifest.json') -Encoding utf8
(@('# Narration — saved-evidence walkthrough','','This is synthetic local narration over actual safe screenshots and labeled text panels. It is not an interactive screen recording.','')+$narrationText) | Set-Content -LiteralPath (Join-Path $outDir 'NARRATION.md') -Encoding utf8
$result | ConvertTo-Json
Get-Item -LiteralPath $video | Select-Object Name,Length
