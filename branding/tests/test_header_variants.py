"""Header pairs keep the base artwork and ship portable, correctly placed taglines."""
import json, sys, tempfile, unittest, re
from pathlib import Path
from types import SimpleNamespace
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import build
HEADERS=('open-graph','x-header','facebook-cover','linkedin-cover','youtube-banner','wallpaper','reddit-banner','reddit-mobile-banner')
NS='{http://www.w3.org/2000/svg}'
class HeaderVariantTests(unittest.TestCase):
    def test_taglines_are_outlined_bottom_right_and_leave_base_artwork_intact(self):
        theme=json.loads((ROOT/'source/themes.json').read_text())['primary']
        for kind in HEADERS:
            with self.subTest(kind=kind):
                base=ET.fromstring(build.svg(kind,theme))
                tagged=ET.fromstring(build.svg(kind+'-tagline',theme))
                self.assertEqual(base.get('viewBox'),tagged.get('viewBox'))
                self.assertIsNone(tagged.find('.//'+NS+'text'))
                group=tagged.find(NS+"g[@aria-label='Your kind of connection.']")
                self.assertIsNotNone(group)
                self.assertIsNotNone(group.find(NS+'path'))
                tx,ty,scale=map(float,re.findall(r'-?\d+(?:\.\d+)?',group.get('transform')))
                bx,by,bw,bh=build.TAGLINE['viewBox']
                width,height=map(float,[tagged.get('width'),tagged.get('height')])
                left,top=tx+bx*scale,ty+by*scale
                right,bottom=left+bw*scale,top+bh*scale
                self.assertGreater(left,width*.6)
                self.assertGreater(top,height*.75)
                self.assertLess(right,width)
                self.assertLess(bottom,height)
                tagged.remove(group)
                # Adding a tagline must not change existing logo shapes or their placement.
                self.assertEqual(ET.tostring(base),ET.tostring(tagged))
    def test_link_preview_rasters_are_owned_by_build_metadata(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp)/'preview';folder.mkdir()
            for name in ['open-graph-1200.png','open-graph-tagline-1200.png']:
                Image.new('RGB',(1200,630)).save(folder/name)
            build.record_build(folder,{},None)
            files=json.loads((folder/'build.json').read_text())['files']
            self.assertIn('open-graph-1200.png',files)
            self.assertIn('open-graph-tagline-1200.png',files)
    def test_full_svg_build_records_both_versions_and_core_omits_both(self):
        theme=json.loads((ROOT/'source/themes.json').read_text())['primary']
        for core in [False,True]:
            with tempfile.TemporaryDirectory() as temp:
                build.build('test',theme,Path(temp),SimpleNamespace(svg_only=True,core_only=core,angle=None))
                folder=Path(temp)/'test'
                files=json.loads((folder/'build.json').read_text())['files']
                for kind in HEADERS:
                    for name in [kind+'.svg',kind+'-tagline.svg']:
                        self.assertEqual(name in files,not core)
                        self.assertEqual((folder/name).exists(),not core)
if __name__=='__main__':unittest.main()
