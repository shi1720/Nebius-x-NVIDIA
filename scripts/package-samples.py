"""Rebuild the portable synthetic source pack without stale generated files."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
folder=Path(__file__).resolve().parents[1]/'public/samples'
with ZipFile(folder/'sunward-source-pack.zip','w',ZIP_DEFLATED) as archive:
    for source in sorted(folder.iterdir()):
        if source.suffix in {'.csv','.txt','.pdf'}:
            archive.write(source,source.name)
    archive.writestr('READ-ME.txt','Fictional RecallRoom drill. Upload the numbered text/CSV records to an empty private investigation. The PDF is an optional alternative for practicing text verification; do not upload both clarification formats for the same extraction. Live extraction requires a configured Nebius NVIDIA model. No real company or incident is represented.\n')
print('Synthetic source ZIP rebuilt.')
