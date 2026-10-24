"""Compose the current individual A4 PDFs; never create a second content source.
Authoring dependency (outside this repository): pypdf.
"""
from pathlib import Path
from pypdf import PdfReader, PdfWriter

root = Path(__file__).resolve().parents[1] / 'assets' / 'printables'
ids = ['rodicovsky-navod', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'diplom']
writer = PdfWriter()
for sheet in ids:
    reader = PdfReader(root / f'{sheet}.pdf')
    if len(reader.pages) != 1:
        raise ValueError(f'{sheet}: expected a single A4 page')
    page = reader.pages[0]
    if abs(float(page.mediabox.width) - 595.28) > 1 or abs(float(page.mediabox.height) - 841.89) > 1:
        raise ValueError(f'{sheet}: expected A4 dimensions')
    writer.add_page(page)
writer.add_metadata({'/Title': 'Pixelkovia – všetky aktuálne herné materiály', '/Creator': 'MysteryAtHome / current P1–P6, diploma and parent instructions'})
writer.compress_identical_objects()
with (root / 'vsetky-materialy.pdf').open('wb') as output:
    writer.write(output)
print('Bundled eight current A4 PDFs: parent instructions first, P1–P6 and diploma.')
