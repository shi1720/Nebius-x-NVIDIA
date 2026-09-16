"""Align each narration segment separately so ASR does not skip short sentences."""
import concurrent.futures, hashlib, json, pathlib, urllib.request, uuid
root = pathlib.Path(__file__).resolve().parents[1]
out = root / 'outputs/video'
key = next(line.split('=', 1)[1] for line in (root / '.env.local').read_text().splitlines() if line.startswith('OPENAI_API_KEY='))
durations = json.loads((out / 'durations.json').read_text())
def align(i):
    audio_path = out / f'audio-{i:02}.wav'
    result_path = out / f'aligned-{i:02}.json'
    hash_path = out / f'aligned-{i:02}.sha256'
    digest = hashlib.sha256(audio_path.read_bytes()).hexdigest()
    if result_path.exists() and hash_path.exists() and hash_path.read_text().strip() == digest:
        return json.loads(result_path.read_text())
    boundary = uuid.uuid4().hex
    parts = []
    for name, value in [('model', 'whisper-1'), ('response_format', 'verbose_json'), ('timestamp_granularities[]', 'word'), ('language', 'en'), ('prompt', 'RecallRoom. Shivam Gupta. NVIDIA Nemotron. Nebius Token Factory. PB-0901-A. PB-0901-B. Sunward Foods.')]:
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="segment.wav"\r\nContent-Type: audio/wav\r\n\r\n'.encode() + (out / f'audio-{i:02}.wav').read_bytes() + b'\r\n')
    parts.append(f'--{boundary}--\r\n'.encode())
    req = urllib.request.Request('https://api.openai.com/v1/audio/transcriptions', data=b''.join(parts), headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'multipart/form-data; boundary=' + boundary})
    with urllib.request.urlopen(req, timeout=120) as response:
        result = json.load(response)
    result_path.write_text(json.dumps(result, indent=2))
    hash_path.write_text(digest)
    return result
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    results = list(pool.map(align, range(len(durations))))
combined = {'duration': sum(durations), 'text': ' '.join(r['text'] for r in results), 'words': []}
offset = 0
for result, duration in zip(results, durations):
    for w in result['words']:
        combined['words'].append({**w, 'start': offset + w['start'], 'end': offset + min(duration, w['end'])})
    offset += duration
(out / 'transcription.json').write_text(json.dumps(combined, indent=2))
print('Aligned all segments:', len(combined['words']), 'words')
