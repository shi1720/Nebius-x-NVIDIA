"""Align generated narration to word timestamps through the OpenAI transcription API."""
import pathlib,json,urllib.request,uuid
root=pathlib.Path(__file__).resolve().parent.parent;out=root/'outputs/video'
key=next(x.split('=',1)[1] for x in (root/'.env.local').read_text().splitlines() if x.startswith('OPENAI_API_KEY='))
boundary=uuid.uuid4().hex;parts=[]
for name,value in [('model','whisper-1'),('response_format','verbose_json'),('timestamp_granularities[]','word'),('language','en'),('prompt','RecallRoom. Shivam Gupta. NVIDIA Nemotron. Nebius Token Factory. PB-0901-A. PB-0901-B. Sunward Foods.')]:
 parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="narration.wav"\r\nContent-Type: audio/wav\r\n\r\n'.encode()+(out/'narration.wav').read_bytes()+b'\r\n')
parts.append(f'--{boundary}--\r\n'.encode())
req=urllib.request.Request('https://api.openai.com/v1/audio/transcriptions',data=b''.join(parts),headers={'Authorization':'Bearer '+key,'Content-Type':'multipart/form-data; boundary='+boundary})
with urllib.request.urlopen(req,timeout=120) as r:result=json.load(r)
(out/'transcription.json').write_text(json.dumps(result,indent=2));print('Caption words aligned:',len(result.get('words',[])))
