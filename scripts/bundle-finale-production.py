"""Package the reviewed start frames, prompts and original character references."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
folder = root / 'assets' / 'finale-production'
files = [(folder / name, name) for name in ['start-a.png', 'start-b.png', 'prompt-a.txt', 'prompt-b.txt', 'README.txt']]
files += [(root / 'assets' / 'characters' / f'{name}.png', f'references/{name}.png') for name in ['piko', 'miky', 'pixi', 'plugy', 'pingy', 'cipko', 'guardy']]
for source, _ in files:
    if not source.is_file():
        raise FileNotFoundError(source)
with ZipFile(folder / 'opengen-balik.zip', 'w', ZIP_DEFLATED) as bundle:
    for source, target in files:
        bundle.write(source, target)
print('Bundled two start frames, two prompts, instructions and seven character references.')
