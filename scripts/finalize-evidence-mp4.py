"""Extend the last still frame to the full narration; no image/audio changes."""
import pathlib
import struct

root = pathlib.Path(__file__).resolve().parent.parent / 'deliverables'
source = root / 'bookleaf-evidence-walkthrough-v2.mp4'
target = root / 'bookleaf-evidence-walkthrough-final.mp4'
duration = 226


def parse(data):
    offset = 0
    while offset + 8 <= len(data):
        size, kind = struct.unpack_from('>I4s', data, offset)
        assert size >= 8 and offset + size <= len(data)
        yield kind, data[offset + 8:offset + size]
        offset += size
    assert offset == len(data)


def pack(kind, payload):
    return struct.pack('>I4s', len(payload) + 8, kind) + payload


def is_video_track(payload):
    for kind, child in parse(payload):
        if kind == b'mdia':
            for kind2, child2 in parse(child):
                if kind2 == b'hdlr' and child2[8:12] == b'vide':
                    return True
    return False


def rewrite(data, video=False, movie_scale=90000):
    output = bytearray()
    for kind, payload in parse(data):
        if kind == b'mvhd':
            assert payload[0] == 0
            movie_scale = struct.unpack_from('>I', payload, 12)[0]
            payload = bytearray(payload)
            struct.pack_into('>I', payload, 16, duration * movie_scale)
        if kind == b'trak':
            payload = rewrite(payload, is_video_track(payload), movie_scale)
        elif kind in (b'moov', b'mdia', b'minf', b'stbl', b'edts'):
            payload = rewrite(payload, video, movie_scale)
        elif video and kind == b'mdhd':
            assert payload[0] == 0
            payload = bytearray(payload)
            scale = struct.unpack_from('>I', payload, 12)[0]
            assert scale == 90000
            struct.pack_into('>I', payload, 16, duration * scale)
        elif video and kind == b'tkhd':
            assert payload[0] == 0
            payload = bytearray(payload)
            struct.pack_into('>I', payload, 20, duration * movie_scale)
        elif video and kind == b'stts':
            count = struct.unpack_from('>I', payload, 4)[0]
            entries = [struct.unpack_from('>II', payload, 8 + i * 8) for i in range(count)]
            assert entries == [(1, 0), (223, 90000)], 'Expected known VLC still-frame output'
            payload = payload[:4] + struct.pack('>I', 3) + struct.pack('>IIIIII', 1, 0, 222, 90000, 1, 360000)
        elif video and kind == b'elst':
            assert payload[0] == 0
            payload = bytearray(payload)
            count = struct.unpack_from('>I', payload, 4)[0]
            assert count == 2 and struct.unpack_from('>i', payload, 12)[0] == -1
            assert struct.unpack_from('>i', payload, 24)[0] == 0
            lead = struct.unpack_from('>I', payload, 8)[0]
            struct.pack_into('>I', payload, 20, duration * movie_scale - lead)
        elif kind == b'stco':
            payload = bytearray(payload)
            count = struct.unpack_from('>I', payload, 4)[0]
            for index in range(count):
                offset = struct.unpack_from('>I', payload, 8 + 4 * index)[0]
                struct.pack_into('>I', payload, 8 + 4 * index, offset + 8)
        elif kind == b'co64':
            raise AssertionError('Unexpected 64-bit chunk table')
        output += pack(kind, payload)
    return bytes(output)


data = source.read_bytes()
assert [kind for kind, _ in parse(data)].index(b'moov') < [kind for kind, _ in parse(data)].index(b'mdat'), 'Expected VLC fast-start layout'
rewritten = rewrite(data)
assert len(rewritten) - len(data) == 8, 'One extra timing entry; chunk offsets adjusted by eight bytes'
assert next(payload for kind, payload in parse(data) if kind == b'mdat') == next(payload for kind, payload in parse(rewritten) if kind == b'mdat'), 'No encoded media changes'
target.write_bytes(rewritten)
print('Final MP4 preserves media bytes and extends the last evidence card to 226 seconds.')
