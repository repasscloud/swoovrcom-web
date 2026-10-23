#!/usr/bin/env python3
"""Rebuild portable tagline outlines using local Avenir Next and Inkscape."""
import json, shutil, subprocess, tempfile
from pathlib import Path
from defusedxml import ElementTree as ET
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path
ROOT=Path(__file__).resolve().parents[1]
TEXT='Your kind of connection.'

def main():
    exe=shutil.which('inkscape')
    if not exe:raise RuntimeError('Inkscape and the Avenir Next font must be installed.')
    matcher=shutil.which('fc-match')
    if matcher:
        family=subprocess.check_output([matcher,'-f','%{family}','Avenir Next'],text=True)
        if 'Avenir Next' not in family.split(','):raise RuntimeError('Avenir Next is missing; refusing a substitute font.')
    elif not Path('/System/Library/Fonts/Avenir Next.ttc').is_file():
        raise RuntimeError('Install Avenir Next and Fontconfig to verify the font before rebuilding outlines.')
    with tempfile.TemporaryDirectory(prefix='swoovr-tagline-') as temp:
        src=Path(temp)/'text.svg'; dst=Path(temp)/'outlined.svg'
        src.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="150" viewBox="0 0 1400 150"><text x="0" y="110" font-family="Avenir Next" font-weight="650" font-size="100" letter-spacing="-7">{TEXT}</text></svg>')
        subprocess.run([exe,str(src),'--export-text-to-path','--export-plain-svg','--export-type=svg',f'--export-filename={dst}'],check=True,stdout=subprocess.DEVNULL)
        paths=ET.parse(dst).findall('.//{http://www.w3.org/2000/svg}path')
        if len(paths)!=1 or paths[0].get('transform'):raise RuntimeError('Unexpected outline structure; inspect renderer output.')
        path=paths[0].get('d');pen=BoundsPen(None);parse_path(path,pen)
        x0,y0,x1,y1=pen.bounds
        data={'text':TEXT,'font_family':'Avenir Next','font_weight':650,'letter_spacing_em':-0.07,'reference_font_size':100,'viewBox':[x0,y0,x1-x0,y1-y0],'path':path,'rendering_note':'CSS weight 650 uses the installed Avenir Next face selected by Inkscape. macOS static Avenir Next resolves this to Bold (700), as CSS font matching does for 650 when only 600 and 700 are available.'}
        (ROOT/'source/tagline.json').write_text(json.dumps(data,indent=2)+'\n')
        print('Tagline outlines rebuilt:',TEXT)
if __name__=='__main__':main()
