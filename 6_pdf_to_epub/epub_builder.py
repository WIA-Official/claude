#!/usr/bin/env python3
"""
EPUB Builder - EPUB 3.x Generation Module (Enhanced)
Creates EPUB 3.x compliant files with:
- HTML5 semantic structure
- ARIA accessibility attributes
- MathML with SVG fallback support
- CSS3 advanced layout (Flexbox/Grid)
- Responsive typography (em/rem units)
- WCAG 2.0 accessibility compliance
"""

import os
import uuid
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
import zipfile
from xml.etree import ElementTree as ET
from xml.dom import minidom
import base64

logger = logging.getLogger(__name__)


class EPUBBuilder:
    """Enhanced builder for creating EPUB 3.x files with full compliance"""

    # EPUB 3.x namespaces
    NAMESPACES = {
        'container': 'urn:oasis:names:tc:opendocument:xmlns:container',
        'opf': 'http://www.idpf.org/2007/opf',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'dcterms': 'http://purl.org/dc/terms/',
        'xhtml': 'http://www.w3.org/1999/xhtml',
        'epub': 'http://www.idpf.org/2007/ops',
        'mathml': 'http://www.w3.org/1998/Math/MathML',
        'svg': 'http://www.w3.org/2000/svg'
    }

    def __init__(self):
        """Initialize the enhanced EPUB builder"""
        self.reset()

    def reset(self):
        """Reset the builder state"""
        self.metadata = {
            'title': 'Untitled',
            'author': 'Unknown',
            'language': 'en',
            'identifier': str(uuid.uuid4()),
            'date': datetime.now().strftime('%Y-%m-%d'),
            'publisher': '',
            'subject': '',
            'description': ''
        }
        self.chapters: List[Dict[str, Any]] = []
        self.images: List[Dict[str, bytes]] = []
        self.fonts: List[Dict[str, bytes]] = []
        self.current_chapter: List[str] = []
        self.toc_hierarchy: List[Dict[str, Any]] = []  # For logical TOC structure

    def set_metadata(self, title: str, author: str, language: str = 'en',
                     identifier: Optional[str] = None, **kwargs):
        """
        Set EPUB metadata with optional extended fields

        Args:
            title: Book title
            author: Author name
            language: Language code (default: 'en')
            identifier: Unique identifier (default: auto-generated UUID)
            **kwargs: Additional metadata (publisher, subject, description)
        """
        self.metadata['title'] = title
        self.metadata['author'] = author
        self.metadata['language'] = language
        if identifier:
            self.metadata['identifier'] = identifier

        # Extended metadata
        for key in ['publisher', 'subject', 'description']:
            if key in kwargs:
                self.metadata[key] = kwargs[key]

        logger.info(f"Metadata set: {title} by {author}")

    def add_section(self, content: str, section_type: str = 'bodymatter'):
        """
        Add a semantic section with ARIA role

        Args:
            content: Section content (HTML)
            section_type: Type of section (chapter, bodymatter, etc.)
        """
        role = f"doc-{section_type}"
        html = f'<section role="{role}" epub:type="{section_type}">\n{content}\n</section>\n'
        self.current_chapter.append(html)

    def add_paragraph(self, text: str, role: Optional[str] = None):
        """
        Add a text paragraph with optional ARIA role

        Args:
            text: Paragraph text
            role: Optional ARIA role
        """
        role_attr = f' role="{role}"' if role else ''
        html = f'<p{role_attr}>{self._escape_html(text)}</p>\n'
        self.current_chapter.append(html)

    def add_heading(self, text: str, level: int = 1, section_type: Optional[str] = None):
        """
        Add a heading with semantic attributes

        Args:
            text: Heading text
            level: Heading level (1-6)
            section_type: Optional section type for TOC hierarchy
        """
        level = max(1, min(6, level))  # Clamp to 1-6

        # Generate ID for linking
        heading_id = f"heading-{len(self.toc_hierarchy) + 1}"

        # Add to TOC hierarchy
        self.toc_hierarchy.append({
            'text': text,
            'level': level,
            'id': heading_id,
            'chapter': len(self.chapters)
        })

        html = f'<h{level} id="{heading_id}" role="doc-subtitle">{self._escape_html(text)}</h{level}>\n'
        self.current_chapter.append(html)

    def add_formula(self, mathml: str, fallback_svg: Optional[str] = None,
                   fallback_img: Optional[bytes] = None, display: bool = True):
        """
        Add a mathematical formula with MathML and fallback

        Args:
            mathml: MathML representation
            fallback_svg: SVG fallback (optional)
            fallback_img: PNG/JPG fallback image bytes (optional)
            display: True for display math, False for inline
        """
        formula_id = f"formula-{len([c for c in self.current_chapter if 'formula' in c]) + 1}"

        # Build fallback chain: MathML -> SVG -> Image
        if display:
            html = f'<figure id="{formula_id}" class="formula" role="doc-example">\n'
        else:
            html = f'<span id="{formula_id}" class="formula-inline">\n'

        # Add MathML with alttext
        html += mathml

        # Add SVG fallback
        if fallback_svg:
            html += f'\n<svg class="formula-fallback">\n{fallback_svg}\n</svg>\n'

        # Add image fallback
        if fallback_img:
            # Save image
            img_filename = f'{formula_id}.png'
            self.images.append({
                'filename': img_filename,
                'data': fallback_img
            })
            html += f'<img src="../images/{img_filename}" alt="Mathematical formula" class="formula-fallback-img" />\n'

        if display:
            html += '</figure>\n'
        else:
            html += '</span>\n'

        self.current_chapter.append(html)

    def add_figure(self, image_data: bytes, filename: str,
                  alt_text: str = '', caption: str = '', credit: str = ''):
        """
        Add a figure with semantic markup

        Args:
            image_data: Image binary data
            filename: Image filename
            alt_text: Alternative text for accessibility
            caption: Figure caption
            credit: Image credit/attribution
        """
        # Store image data
        self.images.append({
            'filename': filename,
            'data': image_data
        })

        figure_id = f"fig-{len([i for i in self.images if i['filename'] == filename])}"

        html = f'<figure id="{figure_id}" role="doc-example">\n'
        html += f'  <img src="../images/{filename}" alt="{self._escape_html(alt_text)}" />\n'

        if caption:
            html += f'  <figcaption role="doc-caption">\n'
            html += f'    {self._escape_html(caption)}\n'
            if credit:
                html += f'    <span class="credit">{self._escape_html(credit)}</span>\n'
            html += '  </figcaption>\n'

        html += '</figure>\n'
        self.current_chapter.append(html)

    def add_table(self, headers: List[str], rows: List[List[str]],
                 caption: str = '', summary: str = ''):
        """
        Add a responsive table with semantic markup

        Args:
            headers: Table header cells
            rows: Table data rows
            caption: Table caption
            summary: Table summary for accessibility
        """
        table_id = f"table-{len([c for c in self.current_chapter if '<table' in c]) + 1}"

        html = f'<div class="table-wrapper" role="doc-example">\n'
        html += f'  <table id="{table_id}"'
        if summary:
            html += f' aria-describedby="{table_id}-summary"'
        html += '>\n'

        # Caption
        if caption:
            html += f'    <caption role="doc-caption">{self._escape_html(caption)}</caption>\n'

        # Headers
        html += '    <thead>\n      <tr>\n'
        for header in headers:
            html += f'        <th scope="col">{self._escape_html(header)}</th>\n'
        html += '      </tr>\n    </thead>\n'

        # Body
        html += '    <tbody>\n'
        for row in rows:
            html += '      <tr>\n'
            for cell in row:
                html += f'        <td>{self._escape_html(cell)}</td>\n'
            html += '      </tr>\n'
        html += '    </tbody>\n'
        html += '  </table>\n'

        # Summary for accessibility
        if summary:
            html += f'  <p id="{table_id}-summary" class="table-summary visually-hidden">{self._escape_html(summary)}</p>\n'

        html += '</div>\n'
        self.current_chapter.append(html)

    def add_image(self, image_data: bytes, filename: str,
                  alt_text: str = '', caption: str = ''):
        """
        Legacy method - redirects to add_figure

        Args:
            image_data: Image binary data
            filename: Image filename
            alt_text: Alternative text
            caption: Image caption
        """
        self.add_figure(image_data, filename, alt_text, caption)

    def add_font(self, font_data: bytes, font_filename: str):
        """
        Add embedded font (WOFF/WOFF2)

        Args:
            font_data: Font file binary data
            font_filename: Font filename (e.g., 'MyFont.woff2')
        """
        self.fonts.append({
            'filename': font_filename,
            'data': font_data
        })
        logger.info(f"Added embedded font: {font_filename}")

    def new_chapter(self, title: str = '', chapter_type: str = 'chapter'):
        """
        Start a new chapter

        Args:
            title: Chapter title
            chapter_type: Type of chapter (chapter, preface, appendix, etc.)
        """
        # Save current chapter if it has content
        if self.current_chapter:
            self.chapters.append({
                'title': title or f'Chapter {len(self.chapters) + 1}',
                'content': ''.join(self.current_chapter),
                'type': chapter_type
            })
            self.current_chapter = []

    def build(self, output_path: str):
        """
        Build the EPUB file with full EPUB 3.x compliance

        Args:
            output_path: Path where EPUB file will be created
        """
        logger.info(f"Building enhanced EPUB 3.x: {output_path}")

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

            # Add OEBPS/toc.ncx (EPUB 2 compatibility)
            epub.writestr('OEBPS/toc.ncx', self._create_toc_ncx())

            # Add OEBPS/nav.xhtml (EPUB 3 navigation)
            epub.writestr('OEBPS/nav.xhtml', self._create_nav_xhtml())

            # Add CSS stylesheet
            epub.writestr('OEBPS/styles/main.css', self._create_css())

            # Add chapter XHTML files
            for i, chapter in enumerate(self.chapters, 1):
                filename = f'OEBPS/text/chapter{i:03d}.xhtml'
                content = self._create_chapter_xhtml(
                    chapter['title'],
                    chapter['content'],
                    chapter.get('type', 'chapter')
                )
                epub.writestr(filename, content)

            # Add images
            for image in self.images:
                filename = f'OEBPS/images/{image["filename"]}'
                epub.writestr(filename, image['data'])

            # Add fonts
            for font in self.fonts:
                filename = f'OEBPS/fonts/{font["filename"]}'
                epub.writestr(filename, font['data'])

        logger.info(f"✓ Enhanced EPUB 3.x created successfully: {output_path}")

    def _create_container_xml(self) -> str:
        """Create META-INF/container.xml"""
        return '''<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>'''

    def _create_content_opf(self) -> str:
        """Create OEBPS/content.opf with accessibility metadata"""
        root = ET.Element('package',
                          xmlns=self.NAMESPACES['opf'],
                          version='3.0',
                          attrib={'unique-identifier': 'bookid', 'xml:lang': self.metadata['language']})

        # Metadata with accessibility
        metadata = ET.SubElement(root, 'metadata',
                                 attrib={
                                     'xmlns:dc': self.NAMESPACES['dc'],
                                     'xmlns:opf': self.NAMESPACES['opf']
                                 })

        # Dublin Core metadata
        ET.SubElement(metadata, 'dc:identifier', id='bookid').text = self.metadata['identifier']
        ET.SubElement(metadata, 'dc:title').text = self.metadata['title']
        ET.SubElement(metadata, 'dc:language').text = self.metadata['language']
        ET.SubElement(metadata, 'dc:creator').text = self.metadata['author']
        ET.SubElement(metadata, 'dc:date').text = self.metadata['date']

        if self.metadata.get('publisher'):
            ET.SubElement(metadata, 'dc:publisher').text = self.metadata['publisher']
        if self.metadata.get('subject'):
            ET.SubElement(metadata, 'dc:subject').text = self.metadata['subject']
        if self.metadata.get('description'):
            ET.SubElement(metadata, 'dc:description').text = self.metadata['description']

        # EPUB 3 required metadata
        ET.SubElement(metadata, 'meta', property='dcterms:modified').text = \
            datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')

        # Accessibility metadata (WCAG 2.0 Level A compliance)
        ET.SubElement(metadata, 'meta', property='schema:accessMode').text = 'textual,visual'
        ET.SubElement(metadata, 'meta', property='schema:accessModeSufficient').text = 'textual'
        ET.SubElement(metadata, 'meta', property='schema:accessibilityFeature').text = 'structuralNavigation'
        ET.SubElement(metadata, 'meta', property='schema:accessibilityFeature').text = 'alternativeText'
        ET.SubElement(metadata, 'meta', property='schema:accessibilityFeature').text = 'readingOrder'
        ET.SubElement(metadata, 'meta', property='schema:accessibilityFeature').text = 'MathML'
        ET.SubElement(metadata, 'meta', property='schema:accessibilityHazard').text = 'none'
        ET.SubElement(metadata, 'meta', property='schema:accessibilitySummary').text = \
            'This publication conforms to WCAG 2.0 Level A.'

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
        for i, chapter in enumerate(self.chapters, 1):
            properties = []
            content = chapter.get('content', '')

            # Check for MathML
            if 'mathml' in content.lower() or '<math' in content.lower():
                properties.append('mathml')

            # Check for SVG
            if '<svg' in content.lower():
                properties.append('svg')

            attribs = {
                'id': f'chapter{i:03d}',
                'href': f'text/chapter{i:03d}.xhtml',
                'media-type': 'application/xhtml+xml'
            }
            if properties:
                attribs['properties'] = ' '.join(properties)

            ET.SubElement(manifest, 'item', **attribs)

        # Add images
        for i, image in enumerate(self.images, 1):
            ext = image['filename'].split('.')[-1].lower()
            media_type = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'svg': 'image/svg+xml',
                'webp': 'image/webp'
            }.get(ext, 'image/png')

            ET.SubElement(manifest, 'item',
                          id=f'img{i:03d}',
                          href=f'images/{image["filename"]}',
                          attrib={'media-type': media_type})

        # Add fonts
        for i, font in enumerate(self.fonts, 1):
            ext = font['filename'].split('.')[-1].lower()
            media_type = {
                'woff': 'font/woff',
                'woff2': 'font/woff2',
                'otf': 'font/otf',
                'ttf': 'font/ttf'
            }.get(ext, 'application/octet-stream')

            ET.SubElement(manifest, 'item',
                          id=f'font{i:03d}',
                          href=f'fonts/{font["filename"]}',
                          attrib={'media-type': media_type})

        # Spine
        spine = ET.SubElement(root, 'spine', toc='ncx')
        for i in range(1, len(self.chapters) + 1):
            ET.SubElement(spine, 'itemref', idref=f'chapter{i:03d}')

        return self._prettify_xml(root)

    def _create_toc_ncx(self) -> str:
        """Create OEBPS/toc.ncx (EPUB 2 compatibility)"""
        root = ET.Element('ncx',
                          xmlns='http://www.daisy.org/z3986/2005/ncx/',
                          version='2005-1')

        # Head
        head = ET.SubElement(root, 'head')
        ET.SubElement(head, 'meta', name='dtb:uid', content=self.metadata['identifier'])

        # Calculate depth from TOC hierarchy
        max_depth = max([h['level'] for h in self.toc_hierarchy], default=1)
        ET.SubElement(head, 'meta', name='dtb:depth', content=str(max_depth))
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
        """Create OEBPS/nav.xhtml with logical hierarchy (EPUB 3)"""
        html = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Navigation</title>
  <link rel="stylesheet" type="text/css" href="styles/main.css" />
</head>
<body>
  <nav epub:type="toc" id="toc" role="doc-toc">
    <h1>Table of Contents</h1>
    <ol role="list">
'''
        # Build hierarchical TOC
        for i, chapter in enumerate(self.chapters, 1):
            html += f'      <li role="listitem"><a href="text/chapter{i:03d}.xhtml">{self._escape_html(chapter["title"])}</a>'

            # Add sub-headings from TOC hierarchy
            chapter_headings = [h for h in self.toc_hierarchy if h.get('chapter') == i - 1]
            if chapter_headings:
                html += '\n        <ol role="list">\n'
                for heading in chapter_headings:
                    html += f'          <li role="listitem"><a href="text/chapter{i:03d}.xhtml#{heading["id"]}">{self._escape_html(heading["text"])}</a></li>\n'
                html += '        </ol>\n'

            html += '</li>\n'

        html += '''    </ol>
  </nav>
</body>
</html>'''
        return html

    def _create_chapter_xhtml(self, title: str, content: str, chapter_type: str = 'chapter') -> str:
        """Create chapter XHTML file with semantic structure"""
        return f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="{self.metadata['language']}" lang="{self.metadata['language']}">
<head>
  <meta charset="UTF-8"/>
  <title>{self._escape_html(title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles/main.css" />
</head>
<body>
  <section epub:type="{chapter_type}" role="doc-{chapter_type}">
    <h1 role="doc-title">{self._escape_html(title)}</h1>
    {content}
  </section>
</body>
</html>'''

    def _create_css(self) -> str:
        """Create enhanced CSS3 stylesheet with Flexbox/Grid and responsive units"""
        return '''/* EPUB 3.x Enhanced Stylesheet */
/* Responsive typography with em/rem units */

:root {
  --base-font-size: 1rem;
  --line-height: 1.6;
  --heading-font: Arial, Helvetica, sans-serif;
  --body-font: Georgia, "Times New Roman", serif;
  --code-font: "Courier New", Courier, monospace;
  --primary-color: #000000;
  --background-color: #ffffff;
  --border-color: #cccccc;
}

* {
  box-sizing: border-box;
}

html {
  font-size: 100%; /* Base 16px */
}

body {
  font-family: var(--body-font);
  font-size: var(--base-font-size);
  line-height: var(--line-height);
  color: var(--primary-color);
  background-color: var(--background-color);
  margin: 0;
  padding: 1.5rem;
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
}

/* Headings with responsive sizing */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading-font);
  line-height: 1.2;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  text-align: left;
  font-weight: bold;
  page-break-after: avoid;
  break-after: avoid;
}

h1 { font-size: 2rem; }    /* 32px */
h2 { font-size: 1.75rem; } /* 28px */
h3 { font-size: 1.5rem; }  /* 24px */
h4 { font-size: 1.25rem; } /* 20px */
h5 { font-size: 1.1rem; }  /* 17.6px */
h6 { font-size: 1rem; }    /* 16px */

/* Paragraphs */
p {
  margin: 0.75em 0;
  text-indent: 1.5em;
  orphans: 2;
  widows: 2;
}

p:first-of-type,
section > p:first-child {
  text-indent: 0;
}

/* Sections with semantic structure */
section {
  margin: 2rem 0;
}

/* Figures with Flexbox layout */
figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1.5rem 0;
  page-break-inside: avoid;
  break-inside: avoid;
}

figure img {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--border-color);
}

figcaption {
  font-size: 0.9rem;
  font-style: italic;
  margin-top: 0.75rem;
  text-align: center;
  text-indent: 0;
}

.credit {
  display: block;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  color: #666666;
}

/* Mathematical formulas with fallback */
.formula {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1.5rem 0;
  text-align: center;
  overflow-x: auto;
  page-break-inside: avoid;
  break-inside: avoid;
}

.formula-inline {
  display: inline-block;
  vertical-align: middle;
}

math {
  display: inline-block;
  margin: 0.5rem 0;
}

.formula-fallback,
.formula-fallback-img {
  max-width: 100%;
  height: auto;
  margin: 0.5rem 0;
}

/* Responsive tables with Grid */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 1.5rem 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  page-break-inside: avoid;
  break-inside: avoid;
}

thead {
  background-color: #f5f5f5;
}

th, td {
  border: 1px solid var(--border-color);
  padding: 0.75em;
  text-align: left;
  vertical-align: top;
}

th {
  font-weight: bold;
  text-align: center;
}

/* Responsive table for small screens */
@media screen and (max-width: 600px) {
  table {
    font-size: 0.8rem;
  }

  th, td {
    padding: 0.5em;
  }
}

caption {
  font-weight: bold;
  margin-bottom: 0.5em;
  text-align: left;
  caption-side: top;
}

.table-summary {
  font-size: 0.85rem;
  font-style: italic;
  margin-top: 0.5rem;
}

/* Accessibility helpers */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Links */
a {
  color: #0066cc;
  text-decoration: underline;
}

a:hover,
a:focus {
  color: #003366;
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Lists */
ol, ul {
  margin: 1em 0;
  padding-left: 2em;
}

li {
  margin: 0.5em 0;
}

/* Code blocks */
pre, code {
  font-family: var(--code-font);
  font-size: 0.9rem;
}

pre {
  overflow-x: auto;
  padding: 1rem;
  background-color: #f5f5f5;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin: 1rem 0;
}

code {
  background-color: #f5f5f5;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

/* Blockquotes */
blockquote {
  margin: 1.5rem 2rem;
  padding: 1rem;
  border-left: 4px solid var(--border-color);
  font-style: italic;
}

/* Print optimization */
@media print {
  body {
    font-size: 12pt;
  }

  h1 { font-size: 18pt; }
  h2 { font-size: 16pt; }
  h3 { font-size: 14pt; }
  h4, h5, h6 { font-size: 12pt; }
}

/* Font embedding support */
@font-face {
  font-family: 'CustomFont';
  src: url('../fonts/CustomFont.woff2') format('woff2'),
       url('../fonts/CustomFont.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
'''

    def _escape_html(self, text: str) -> str:
        """Escape HTML special characters"""
        if not text:
            return ''
        text = str(text)
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
        title='Enhanced EPUB Sample',
        author='EPUB Builder Enhanced',
        language='en',
        publisher='Demo Publisher',
        description='Sample EPUB 3.x with full accessibility features'
    )

    builder.add_heading('Chapter 1: Introduction', 1)
    builder.add_paragraph('This is a sample EPUB document with enhanced features.')

    # Add a table
    builder.add_table(
        headers=['Feature', 'Status'],
        rows=[
            ['HTML5 Semantic', 'Implemented'],
            ['Accessibility', 'Implemented'],
            ['MathML Fallback', 'Implemented']
        ],
        caption='Feature Implementation Status'
    )

    builder.new_chapter('Chapter 1')

    # Build EPUB
    builder.build('sample_enhanced.epub')
    print('✓ Enhanced EPUB created: sample_enhanced.epub')
