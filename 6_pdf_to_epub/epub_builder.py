#!/usr/bin/env python3
"""
EPUB Builder - EPUB 3.x Generation Module
Creates EPUB 3.x compliant files with MathML support
"""

import os
import uuid
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
import zipfile
from xml.etree import ElementTree as ET
from xml.dom import minidom

logger = logging.getLogger(__name__)


class EPUBBuilder:
    """Builder for creating EPUB 3.x files"""

    # EPUB 3.x namespaces
    NAMESPACES = {
        'container': 'urn:oasis:names:tc:opendocument:xmlns:container',
        'opf': 'http://www.idpf.org/2007/opf',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'dcterms': 'http://purl.org/dc/terms/',
        'xhtml': 'http://www.w3.org/1999/xhtml',
        'epub': 'http://www.idpf.org/2007/ops',
        'mathml': 'http://www.w3.org/1998/Math/MathML'
    }

    def __init__(self):
        """Initialize the EPUB builder"""
        self.reset()

    def reset(self):
        """Reset the builder state"""
        self.metadata = {
            'title': 'Untitled',
            'author': 'Unknown',
            'language': 'en',
            'identifier': str(uuid.uuid4()),
            'date': datetime.now().strftime('%Y-%m-%d')
        }
        self.chapters: List[Dict[str, Any]] = []
        self.images: List[Dict[str, bytes]] = []
        self.current_chapter: List[str] = []

    def set_metadata(self, title: str, author: str, language: str = 'en',
                     identifier: Optional[str] = None):
        """
        Set EPUB metadata

        Args:
            title: Book title
            author: Author name
            language: Language code (default: 'en')
            identifier: Unique identifier (default: auto-generated UUID)
        """
        self.metadata['title'] = title
        self.metadata['author'] = author
        self.metadata['language'] = language
        if identifier:
            self.metadata['identifier'] = identifier

        logger.info(f"Metadata set: {title} by {author}")

    def add_paragraph(self, text: str):
        """
        Add a text paragraph to the current chapter

        Args:
            text: Paragraph text
        """
        html = f'<p>{self._escape_html(text)}</p>\n'
        self.current_chapter.append(html)

    def add_heading(self, text: str, level: int = 1):
        """
        Add a heading to the current chapter

        Args:
            text: Heading text
            level: Heading level (1-6)
        """
        level = max(1, min(6, level))  # Clamp to 1-6
        html = f'<h{level}>{self._escape_html(text)}</h{level}>\n'
        self.current_chapter.append(html)

    def add_formula(self, mathml: str, display: bool = True):
        """
        Add a mathematical formula in MathML format

        Args:
            mathml: MathML representation of the formula
            display: True for display math, False for inline
        """
        if display:
            html = f'<div class="formula">\n{mathml}\n</div>\n'
        else:
            html = mathml
        self.current_chapter.append(html)

    def add_image(self, image_data: bytes, filename: str,
                  alt_text: str = '', caption: str = ''):
        """
        Add an image to the EPUB

        Args:
            image_data: Image binary data
            filename: Image filename (should include extension)
            alt_text: Alternative text for accessibility
            caption: Optional image caption
        """
        # Store image data
        self.images.append({
            'filename': filename,
            'data': image_data
        })

        # Add image reference to current chapter
        html = f'<div class="image">\n'
        html += f'<img src="../images/{filename}" alt="{self._escape_html(alt_text)}" />\n'
        if caption:
            html += f'<p class="caption">{self._escape_html(caption)}</p>\n'
        html += '</div>\n'
        self.current_chapter.append(html)

    def new_chapter(self, title: str = ''):
        """
        Start a new chapter

        Args:
            title: Chapter title
        """
        # Save current chapter if it has content
        if self.current_chapter:
            self.chapters.append({
                'title': title or f'Chapter {len(self.chapters) + 1}',
                'content': ''.join(self.current_chapter)
            })
            self.current_chapter = []

    def build(self, output_path: str):
        """
        Build the EPUB file

        Args:
            output_path: Path where EPUB file will be created
        """
        logger.info(f"Building EPUB: {output_path}")

        # Finalize current chapter
        if self.current_chapter:
            self.new_chapter()

        # Create EPUB structure
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as epub:
            # Add mimetype (must be first, uncompressed)
            epub.writestr('mimetype', 'application/epub+zip', compress_type=zipfile.ZIP_STORED)

            # Add META-INF/container.xml
            epub.writestr('META-INF/container.xml', self._create_container_xml())

            # Add OEBPS/content.opf
            epub.writestr('OEBPS/content.opf', self._create_content_opf())

            # Add OEBPS/toc.ncx
            epub.writestr('OEBPS/toc.ncx', self._create_toc_ncx())

            # Add OEBPS/nav.xhtml (EPUB 3 navigation)
            epub.writestr('OEBPS/nav.xhtml', self._create_nav_xhtml())

            # Add CSS stylesheet
            epub.writestr('OEBPS/styles/main.css', self._create_css())

            # Add chapter XHTML files
            for i, chapter in enumerate(self.chapters, 1):
                filename = f'OEBPS/text/chapter{i:03d}.xhtml'
                content = self._create_chapter_xhtml(chapter['title'], chapter['content'])
                epub.writestr(filename, content)

            # Add images
            for image in self.images:
                filename = f'OEBPS/images/{image["filename"]}'
                epub.writestr(filename, image['data'])

        logger.info(f"EPUB created successfully: {output_path}")

    def _create_container_xml(self) -> str:
        """Create META-INF/container.xml"""
        return '''<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>'''

    def _create_content_opf(self) -> str:
        """Create OEBPS/content.opf (package document)"""
        root = ET.Element('package',
                          xmlns=self.NAMESPACES['opf'],
                          version='3.0',
                          attrib={'unique-identifier': 'bookid'})

        # Metadata
        metadata = ET.SubElement(root, 'metadata',
                                 attrib={
                                     f"{{{self.NAMESPACES['dc']}}}xmlns:dc": self.NAMESPACES['dc'],
                                     f"{{{self.NAMESPACES['opf']}}}xmlns:opf": self.NAMESPACES['opf']
                                 })

        ET.SubElement(metadata, f"{{{self.NAMESPACES['dc']}}}identifier",
                      id='bookid').text = self.metadata['identifier']
        ET.SubElement(metadata, f"{{{self.NAMESPACES['dc']}}}title").text = self.metadata['title']
        ET.SubElement(metadata, f"{{{self.NAMESPACES['dc']}}}language").text = self.metadata['language']
        ET.SubElement(metadata, f"{{{self.NAMESPACES['dc']}}}creator").text = self.metadata['author']
        ET.SubElement(metadata, f"{{{self.NAMESPACES['dc']}}}date").text = self.metadata['date']

        # Add meta for EPUB 3
        ET.SubElement(metadata, 'meta', property='dcterms:modified').text = \
            datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')

        # Manifest
        manifest = ET.SubElement(root, 'manifest')

        # Add navigation document
        ET.SubElement(manifest, 'item',
                      id='nav',
                      href='nav.xhtml',
                      attrib={'media-type': 'application/xhtml+xml',
                              'properties': 'nav'})

        # Add NCX for EPUB 2 compatibility
        ET.SubElement(manifest, 'item',
                      id='ncx',
                      href='toc.ncx',
                      attrib={'media-type': 'application/x-dtbncx+xml'})

        # Add stylesheet
        ET.SubElement(manifest, 'item',
                      id='css',
                      href='styles/main.css',
                      attrib={'media-type': 'text/css'})

        # Add chapters
        for i in range(1, len(self.chapters) + 1):
            properties = 'mathml' if any('math' in ch['content'].lower()
                                        for ch in self.chapters[:i] if ch == self.chapters[i-1]) else None
            attribs = {
                'id': f'chapter{i:03d}',
                'href': f'text/chapter{i:03d}.xhtml',
                'media-type': 'application/xhtml+xml'
            }
            if properties:
                attribs['properties'] = properties
            ET.SubElement(manifest, 'item', **attribs)

        # Add images
        for i, image in enumerate(self.images, 1):
            ext = image['filename'].split('.')[-1].lower()
            media_type = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'svg': 'image/svg+xml'
            }.get(ext, 'image/png')

            ET.SubElement(manifest, 'item',
                          id=f'img{i:03d}',
                          href=f'images/{image["filename"]}',
                          attrib={'media-type': media_type})

        # Spine
        spine = ET.SubElement(root, 'spine', toc='ncx')
        for i in range(1, len(self.chapters) + 1):
            ET.SubElement(spine, 'itemref', idref=f'chapter{i:03d}')

        return self._prettify_xml(root)

    def _create_toc_ncx(self) -> str:
        """Create OEBPS/toc.ncx (EPUB 2 navigation)"""
        root = ET.Element('ncx',
                          xmlns='http://www.daisy.org/z3986/2005/ncx/',
                          version='2005-1')

        # Head
        head = ET.SubElement(root, 'head')
        ET.SubElement(head, 'meta', name='dtb:uid', content=self.metadata['identifier'])
        ET.SubElement(head, 'meta', name='dtb:depth', content='1')
        ET.SubElement(head, 'meta', name='dtb:totalPageCount', content='0')
        ET.SubElement(head, 'meta', name='dtb:maxPageNumber', content='0')

        # Doc title
        doc_title = ET.SubElement(root, 'docTitle')
        ET.SubElement(doc_title, 'text').text = self.metadata['title']

        # Nav map
        nav_map = ET.SubElement(root, 'navMap')
        for i, chapter in enumerate(self.chapters, 1):
            nav_point = ET.SubElement(nav_map, 'navPoint', id=f'navPoint-{i}', playOrder=str(i))
            nav_label = ET.SubElement(nav_point, 'navLabel')
            ET.SubElement(nav_label, 'text').text = chapter['title']
            ET.SubElement(nav_point, 'content', src=f'text/chapter{i:03d}.xhtml')

        return self._prettify_xml(root)

    def _create_nav_xhtml(self) -> str:
        """Create OEBPS/nav.xhtml (EPUB 3 navigation)"""
        html = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Navigation</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
'''
        for i, chapter in enumerate(self.chapters, 1):
            html += f'      <li><a href="text/chapter{i:03d}.xhtml">{self._escape_html(chapter["title"])}</a></li>\n'

        html += '''    </ol>
  </nav>
</body>
</html>'''
        return html

    def _create_chapter_xhtml(self, title: str, content: str) -> str:
        """Create chapter XHTML file"""
        return f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>{self._escape_html(title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles/main.css" />
</head>
<body>
  <h1>{self._escape_html(title)}</h1>
  {content}
</body>
</html>'''

    def _create_css(self) -> str:
        """Create CSS stylesheet"""
        return '''/* EPUB 3.x Stylesheet */

body {
  font-family: Georgia, serif;
  line-height: 1.6;
  margin: 1em;
  text-align: justify;
}

h1, h2, h3, h4, h5, h6 {
  font-family: Arial, sans-serif;
  line-height: 1.2;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  text-align: left;
}

h1 { font-size: 2em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.3em; }

p {
  margin: 0.5em 0;
  text-indent: 1.5em;
}

p:first-of-type {
  text-indent: 0;
}

/* Mathematical formulas */
.formula {
  margin: 1em 0;
  text-align: center;
  overflow-x: auto;
}

math {
  display: inline-block;
}

/* Images */
.image {
  margin: 1em 0;
  text-align: center;
}

.image img {
  max-width: 100%;
  height: auto;
}

.caption {
  font-size: 0.9em;
  font-style: italic;
  margin-top: 0.5em;
  text-align: center;
  text-indent: 0;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

th, td {
  border: 1px solid #000;
  padding: 0.5em;
  text-align: left;
}

th {
  background-color: #f0f0f0;
  font-weight: bold;
}
'''

    def _escape_html(self, text: str) -> str:
        """Escape HTML special characters"""
        text = text.replace('&', '&amp;')
        text = text.replace('<', '&lt;')
        text = text.replace('>', '&gt;')
        text = text.replace('"', '&quot;')
        text = text.replace("'", '&#39;')
        return text

    def _prettify_xml(self, elem: ET.Element) -> str:
        """Return a pretty-printed XML string"""
        rough_string = ET.tostring(elem, encoding='unicode')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent='  ', encoding='UTF-8').decode('utf-8')


# Example usage
if __name__ == '__main__':
    # Set up logging
    logging.basicConfig(level=logging.INFO)

    # Create a sample EPUB
    builder = EPUBBuilder()
    builder.set_metadata(
        title='Sample EPUB with MathML',
        author='EPUB Builder',
        language='en'
    )

    builder.add_heading('Chapter 1: Introduction', 1)
    builder.add_paragraph('This is a sample EPUB document with mathematical formulas.')

    # Add a formula
    mathml = '''<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mrow>
    <mi>E</mi>
    <mo>=</mo>
    <mi>m</mi>
    <msup>
      <mi>c</mi>
      <mn>2</mn>
    </msup>
  </mrow>
</math>'''
    builder.add_formula(mathml)

    builder.new_chapter('Chapter 1')

    builder.add_heading('Chapter 2: More Content', 1)
    builder.add_paragraph('This is the second chapter.')

    # Build EPUB
    builder.build('sample.epub')
    print('Sample EPUB created: sample.epub')
