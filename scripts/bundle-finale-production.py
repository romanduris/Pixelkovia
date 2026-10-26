"""Package the start and end frames with the matching prompt and instructions."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
folder = root / 'assets' / 'finale-production'
files = [(folder / name, name) for name in ['start-a.png', 'end-empty-room.png', 'prompt-a.txt', 'README.txt']]
for source, _ in files:
    if not source.is_file():
        raise FileNotFoundError(source)
with ZipFile(folder / 'opengen-balik.zip', 'w', ZIP_DEFLATED) as bundle:
    for source, target in files:
        bundle.write(source, target)
print('Bundled start and end frames, one 10-second prompt and instructions.')
