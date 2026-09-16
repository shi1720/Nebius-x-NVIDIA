"""Package only public, reviewed deliverables for the Devpost attachment."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).resolve().parents[1]
out=root/'outputs/RecallRoom-judge-pack.zip'
out.parent.mkdir(exist_ok=True)
files=['README.md','LICENSE','docs/STATUS.md','docs/submission/youtube.md','docs/submission/platform-feedback.md','docs/evaluation/youtube-publication.json','docs/submission/devpost-fields.md','docs/submission/submission.md','docs/architecture.md','docs/evaluation/firebase-api.json','docs/evaluation/firebase-operator.json','docs/evaluation/firebase-browser.json','docs/pitch/RecallRoom-pitch.pdf','docs/pitch/RecallRoom-product-brief.pdf','public/demo/RecallRoom-demo.mp4','public/demo/RecallRoom-captions.srt']
with ZipFile(out,'w',ZIP_DEFLATED) as archive:
    for name in files:archive.write(root/name,name)
    for source in (root/'public/samples').iterdir():
        if source.suffix!='.zip':archive.write(source,str(source.relative_to(root)))
print('Packaged public judge deliverables:',out.name,out.stat().st_size,'bytes')
