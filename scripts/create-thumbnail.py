"""Render the code-defined product title card, not a simulated app screenshot."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
out=Path('public/demo');out.mkdir(exist_ok=True)
im=Image.new('RGB',(1200,800),'#10252a');d=ImageDraw.Draw(im)
f=lambda n,b=False:ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial'+(' Bold' if b else '')+'.ttf',n)
d.rounded_rectangle((64,58,112,106),12,fill='#c2ef85');d.text((76,63),'R',font=f(32,True),fill='#10252a')
d.text((128,65),'RecallRoom.',font=f(32,True),fill='white')
d.text((64,170),'One recalled lot.',font=f(70,True),fill='white');d.text((64,255),'Every affected shipment.',font=f(70,True),fill='#c2ef85')
d.text((67,367),'Trace the products. Resolve the unknowns. Show the evidence.',font=f(27),fill='#b8cccc')
nodes=[(64,'01 / INGREDIENT','PB-0901-A','One recalled lot'),(447,'02 / PRODUCTION','800 units','Confirmed path'),(830,'03 / SHIPMENTS','3 customers','600 units shipped')]
for x,label,value,sub in nodes:
 d.rounded_rectangle((x,456,x+306,642),18,fill='#1d363b',outline='#3e5e60',width=2)
 d.text((x+22,478),label,font=f(17,True),fill='#a8c6c4');d.text((x+22,521),value,font=f(32,True),fill='white');d.text((x+22,578),sub,font=f(20),fill='#bed2cd')
for x in [376,759]:d.line((x,549,x+64,549),fill='#c2ef85',width=3);d.polygon([(x+64,549),(x+52,542),(x+52,556)],fill='#c2ef85')
d.text((65,711),'FICTIONAL DRILL',font=f(17,True),fill='#c2ef85');d.text((790,709),'Created by Shivam Gupta',font=f(23),fill='#b8cccc')
im.save(out/'RecallRoom-thumbnail.png')
