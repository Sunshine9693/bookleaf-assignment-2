"""Check local AVI structure and MP4 A/V metadata without network or a player UI."""
import hashlib
import json
import math
import pathlib
import struct
import wave

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'deliverables'
manifest = json.loads((OUT / 'evidence-video-manifest.json').read_text(encoding='utf-8-sig'))
expected = manifest['validation']['duration_seconds']


def boxes(data):
    offset = 0
    while offset + 8 <= len(data):
        size, kind = struct.unpack_from('>I4s', data, offset)
        header = 8
        if size == 1:
            size = struct.unpack_from('>Q', data, offset + 8)[0]
            header = 16
        if size == 0:
            size = len(data) - offset
        assert size >= header and offset + size <= len(data), 'Valid MP4 box bounds'
        yield kind, data[offset + header:offset + size]
        offset += size


def parse_mp4(path):
    result = {'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'tracks': []}
    for kind, payload in boxes(path.read_bytes()):
        if kind != b'moov':
            continue
        for kind2, payload2 in boxes(payload):
            if kind2 == b'mvhd':
                assert payload2[0] == 0
                scale, duration = struct.unpack_from('>II', payload2, 12)
                result['duration_seconds'] = duration / scale
            if kind2 != b'trak':
                continue
            track = {}
            for kind3, payload3 in boxes(payload2):
                if kind3 == b'tkhd':
                    track['width'] = struct.unpack_from('>I', payload3, len(payload3) - 8)[0] / 65536
                    track['height'] = struct.unpack_from('>I', payload3, len(payload3) - 4)[0] / 65536
                if kind3 != b'mdia':
                    continue
                for kind4, payload4 in boxes(payload3):
                    if kind4 == b'hdlr':
                        track['handler'] = payload4[8:12].decode('ascii')
                    if kind4 == b'mdhd':
                        assert payload4[0] == 0
                        scale, duration = struct.unpack_from('>II', payload4, 12)
                        track['duration_seconds'] = duration / scale
                    if kind4 == b'minf':
                        for kind5, payload5 in boxes(payload4):
                            if kind5 != b'stbl':
                                continue
                            for kind6, payload6 in boxes(payload5):
                                if kind6 == b'stsd':
                                    track['codecs'] = [code.decode('ascii') for code, _ in boxes(payload6[8:])]
                                if kind6 == b'stsz':
                                    track['sample_count'] = struct.unpack_from('>I', payload6, 8)[0]
            result['tracks'].append(track)
    assert abs(result['duration_seconds'] - expected) < 1, 'Expected full duration'
    assert {t['handler'] for t in result['tracks']} == {'vide', 'soun'}, 'Both video and audio tracks'
    video = next(t for t in result['tracks'] if t['handler'] == 'vide')
    audio = next(t for t in result['tracks'] if t['handler'] == 'soun')
    assert video['codecs'] == ['avc1'] and audio['codecs'] == ['mp4a'], 'H264 + AAC'
    assert video['width'] == 1280 and video['height'] == 720
    assert video['sample_count'] >= expected - 3 and audio['sample_count'] > 0, repr(result)
    assert abs(video['duration_seconds'] - expected) < 0.1
    assert abs(audio['duration_seconds'] - expected) < 1
    return result


avi_path = OUT / 'bookleaf-evidence-walkthrough.avi'
avi = avi_path.read_bytes()
assert avi[:4] == b'RIFF' and avi[8:12] == b'AVI '
assert struct.unpack_from('<I', avi, 4)[0] + 8 == len(avi)
assert b'MJPG' in avi and b'idx1' in avi
assert 180 <= expected <= 240, 'Requested three-to-four-minute duration'
assert manifest['validation']['audio_nonzero_samples'] > 100000
report = {
    'status': 'passed',
    'kind': manifest['kind'],
    'avi': {'file': avi_path.name, 'sha256': hashlib.sha256(avi).hexdigest(), **manifest['validation']},
    'mp4': parse_mp4(OUT / 'bookleaf-evidence-walkthrough-final.mp4'),
    'limits': ['Metadata/structure and nonzero source narration checked; no live browser or integration test.', 'Final MP4 extends the last still-card sample by three seconds to match the complete narration; underlying encoded media bytes are unchanged.', 'Source screenshots were visually inspected; generated panel spot-checks are separate from decoder validation.'],
}
decoded_path = OUT / 'evidence-video-assets/decoded-narration.wav'
if decoded_path.exists():
    with wave.open(str(decoded_path), 'rb') as reader:
        assert reader.getsampwidth() == 2 and reader.getnchannels() == 1
        samples_raw = reader.readframes(reader.getnframes())
        samples = struct.unpack('<' + 'h' * (len(samples_raw) // 2), samples_raw)
        decoded = {'decoded_audio_seconds': len(samples) / reader.getframerate(), 'decoded_audio_rate': reader.getframerate(), 'decoded_audio_rms': math.sqrt(sum(x*x for x in samples) / len(samples)), 'nonzero_samples': sum(x != 0 for x in samples)}
        assert 225 < decoded['decoded_audio_seconds'] < 227 and decoded['decoded_audio_rms'] > 100
        report['decoded_mp4_audio'] = decoded
decoded_frame = OUT / 'evidence-video-assets/decoded-frame.png'
if decoded_frame.exists():
    assert decoded_frame.read_bytes()[:8] == b'\x89PNG\r\n\x1a\n'
    report['decoded_video_frame'] = {'time_seconds': 120, 'file': 'evidence-video-assets/decoded-frame.png', 'result': 'Decoded through VLC; spot frame visually inspected by QA agent'}
(OUT / 'video-validation.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))
