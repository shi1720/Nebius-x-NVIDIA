"""Normalize narration segments, add brief pauses, and concatenate the soundtrack."""
import hashlib, json, pathlib, subprocess

root = pathlib.Path(__file__).resolve().parents[1]
out = root / 'outputs/video'
segments = json.loads((root / 'docs/video/narration-segments.json').read_text())
manifest_path = out / 'audio-hashes.json'
manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
durations = []
for i in range(len(segments)):
    source = out / f'voice-{i:02}.mp3'
    target = out / f'audio-{i:02}.wav'
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if not target.exists() or manifest.get(str(i)) != digest:
        subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
                        '-i', str(source), '-af', 'atempo=0.9,apad=pad_dur=0.4',
                        '-ar', '24000', '-ac', '1', str(target)], check=True)
        manifest[str(i)] = digest
    duration = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
                                       'format=duration', '-of', 'csv=p=0', str(target)], text=True)
    durations.append(float(duration))
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
(out / 'durations.json').write_text(json.dumps(durations) + '\n')
(out / 'audio-list.txt').write_text(''.join(f"file 'audio-{i:02}.wav'\n" for i in range(len(segments))))
subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat',
                '-safe', '0', '-i', str(out / 'audio-list.txt'), '-c', 'copy',
                str(out / 'narration.wav')], check=True)
print(f'Assembled {len(segments)} segments, {sum(durations):.2f} seconds')
