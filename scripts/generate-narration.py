"""Generate disclosed AI narration using the key in an ignored local env file."""
import json, os, pathlib, urllib.request
root=pathlib.Path(__file__).resolve().parent.parent
for line in (root/'.env.local').read_text().splitlines():
 if line.startswith('OPENAI_API_KEY='): os.environ.setdefault('OPENAI_API_KEY',line.split('=',1)[1])
segments=json.loads((root/'docs/video/narration-segments.json').read_text())
out=root/'outputs/video';out.mkdir(parents=True,exist_ok=True)
for i,segment in enumerate(segments):
 path=out/f'voice-{i:02}.mp3'
 if path.exists(): continue
 body={'model':'gpt-4o-mini-tts','voice':'cedar','input':segment,'instructions':'Speak in clear, warm, neutral English. This is an honest product demonstration for quality professionals. Use a calm, engaged pace of about 135 words per minute, with natural pauses. Do not imitate a real person. Pronounce Nebius as NEB-ee-us and NVIDIA as en-VID-ee-uh.','response_format':'mp3'}
 req=urllib.request.Request('https://api.openai.com/v1/audio/speech',data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+os.environ['OPENAI_API_KEY'],'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=120) as r:path.write_bytes(r.read())
 print(f'Generated narration segment {i+1}/{len(segments)}',flush=True)
