"""Compose an honest, captioned walkthrough from captured application screens."""
import json, pathlib, subprocess, re, difflib
from PIL import Image, ImageDraw, ImageFont
R=pathlib.Path(__file__).resolve().parents[1]; O=R/'outputs/video'; F=O/'frames'; C=O/'caption-frames'; C.mkdir(exist_ok=True)
durations=json.loads((O/'durations.json').read_text()); total=sum(durations)
transcript=json.loads((O/'transcription.json').read_text())
words=transcript['words']
text_words=transcript['text'].split()
norm=lambda w:re.sub(r'[^a-z0-9]', '', w.lower())
for block in difflib.SequenceMatcher(None,[norm(w['word']) for w in words],[norm(w) for w in text_words]).get_matching_blocks():
 for n in range(block.size):words[block.a+n]['word']=text_words[block.b+n]
for w in words:
 w['word']=w['word'].replace('Nemetron','Nemotron')
font=lambda s,b=False:ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial'+(' Bold' if b else '')+'.ttf',s)
chapters=['The recall question','One evidence workspace','Follow the ingredient','Inspect the source','Keep uncertainty visible','Review the evidence','A traceable decision','NVIDIA + Nebius integration','Prepare the response','Built for smaller teams','Every lot has a story']
shots=['00-opening','07a-live-sources','02-graph','03-source','04-uncertainty','05-review','06b-balance','07a-live-sources','08b-packet','02-graph','10-resolved']
bounds=[0]
for d in durations: bounds.append(bounds[-1]+d)
def stage(t): return min(10,next((i for i in range(11) if t<bounds[i+1]),10))
groups=[]
g=[]
for i,w in enumerate(words):
 g.append(w)
 if len(g)>=7 or w['word'].endswith(('.', '?', '!')) or i==len(words)-1 or stage(w['end'])!=stage(words[i+1]['start']):
  groups.append((max(0,g[0]['start']), ' '.join(v['word'] for v in g)));g=[]
# Keep all actual screen transitions, even during a longer caption.
shot_changes=[bounds[5]+durations[5]*.54,bounds[7]+durations[7]*.20,
              bounds[7]+durations[7]*.72,bounds[8]+durations[8]*.35]
times=sorted(set([0,total]+[a for a,b in groups]+bounds+shot_changes))
def caption(t):
 return next((txt for st,txt in reversed(groups) if st<=t),'')
def draw_frame(t):
 k=stage(t); im=Image.new('RGB',(1920,1080),'#101f23'); d=ImageDraw.Draw(im)
 d.rounded_rectangle((48,26,84,62),9,fill='#bef266');d.text((58,29),'R',font=font(25,True),fill='#102127')
 d.text((98,29),'RecallRoom',font=font(26,True),fill='white');d.text((315,34),chapters[k],font=font(22),fill='#bcccd0')
 d.text((1370,33),'SYNTHETIC DRILL  /  AI VOICE',font=font(19),fill='#b8ccca')
 shot=shots[k]
 if k==5 and t-bounds[k]>durations[k]*.54:shot='05b-confirm'
 if k==7:
  progress=(t-bounds[k])/durations[k]
  if progress>=.72:shot='07c-live-trace'
  elif progress>=.20:shot='07b-live-proposal'
 if k==8 and t-bounds[k]<durations[k]*.35:shot='08-export'
 src=Image.open(F/(shot+'.png')).convert('RGB');scale=min(1760/src.width,850/src.height);src=src.resize((round(src.width*scale),round(src.height*scale)),Image.Resampling.LANCZOS)
 im.paste(src,((1920-src.width)//2,88+(850-src.height)//2))
 txt=caption(t); lines=[];line=''
 for w in txt.split():
  nxt=(line+' '+w).strip()
  if d.textlength(nxt,font=font(36,True))>1690:lines.append(line);line=w
  else:line=nxt
 if line:lines.append(line)
 for n,line in enumerate(lines):d.text(((1920-d.textlength(line,font=font(36,True)))//2,965+n*43),line,font=font(36,True),fill='white')
 d.rectangle((48,1061,1872,1065),fill='#304549');d.rectangle((48,1061,48+1824*t/total,1065),fill='#bef266')
 return im
concat=[]
for i,(a,b) in enumerate(zip(times,times[1:])):
 if b-a<.001:continue
 path=C/f'{i:04}.png';draw_frame(a+.0001).save(path);concat.extend([f"file '{path}'",f'duration {b-a:.6f}'])
concat.append(concat[-2]);(O/'video-list.txt').write_text('\n'.join(concat)+'\n')
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
srt=[]
for i,(t,txt) in enumerate(groups):srt.append(f'{i+1}\n{stamp(t)} --> {stamp(groups[i+1][0] if i+1<len(groups) else total)}\n{txt}\n')
(O/'RecallRoom-captions.srt').write_text('\n'.join(srt))
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(O/'video-list.txt'),'-i',str(O/'narration.wav'),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r','24','-c:a','aac','-b:a','192k','-t',str(total),'-movflags','+faststart',str(O/'RecallRoom-demo.mp4')],check=True)
print(f'Rendered {total:.2f}s captioned 1080p demo')
