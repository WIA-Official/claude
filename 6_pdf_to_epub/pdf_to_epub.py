#!/usr/bin/env python3
"""
PDF to EPUB 3.x Converter - Main Orchestrator
Converts PDF files to EPUB 3.x format with MathML support and epubcheck validation
"""

import os
import sys
import logging
import argparse
from pathlib import Path
from typing import Optional, Dict, Any
import PyPDF2
from PIL import Image
import io

from formula_parser import FormulaParser
from epub_builder import EPUBBuilder
from validator import EPUBValidator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PDFToEPUBConverter:
    """Main converter class orchestrating the PDF to EPUB conversion process"""

    def __init__(self, pdf_path: str, output_path: Optional[str] = None):
        """
        Initialize the converter

        Args:
            pdf_path: Path to input PDF file
            output_path: Path for output EPUB file (optional)
        """
        self.pdf_path = Path(pdf_path)
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        # Set output path
        if output_path:
            self.output_path = Path(output_path)
        else:
            self.output_path = self.pdf_path.with_suffix('.epub')

        # Initialize components
        self.formula_parser = FormulaParser()
        self.epub_builder = EPUBBuilder()
        self.validator = EPUBValidator()

        # Metadata storage
        self.metadata: Dict[str, Any] = {}
        self.content: list = []

    def extract_metadata(self) -> Dict[str, Any]:
        """
        Extract metadata from PDF file

        Returns:
            Dictionary containing PDF metadata
        """
        logger.info(f"Extracting metadata from {self.pdf_path}")

        try:
            with open(self.pdf_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)

                # Extract basic metadata
                metadata = {
                    'title': '',
                    'author': '',
                    'subject': '',
                    'creator': '',
                    'producer': '',
                    'num_pages': len(pdf_reader.pages)
                }

                # Get PDF info if available
                if pdf_reader.metadata:
                    info = pdf_reader.metadata
                    metadata['title'] = info.get('/Title', '') or self.pdf_path.stem
                    metadata['author'] = info.get('/Author', '') or 'Unknown'
                    metadata['subject'] = info.get('/Subject', '')
                    metadata['creator'] = info.get('/Creator', '')
                    metadata['producer'] = info.get('/Producer', '')
                else:
                    metadata['title'] = self.pdf_path.stem
                    metadata['author'] = 'Unknown'

                self.metadata = metadata
                logger.info(f"Extracted metadata: {metadata}")
                return metadata

        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")
            raise

    def extract_content(self) -> list:
        """
        Extract text content and structure from PDF

        Returns:
            List of content blocks with text, images, and formulas
        """
        logger.info("Extracting content from PDF")

        try:
            with open(self.pdf_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                content_blocks = []

                for page_num, page in enumerate(pdf_reader.pages, 1):
                    logger.info(f"Processing page {page_num}/{len(pdf_reader.pages)}")

                    # Extract text
                    text = page.extract_text()

                    if text.strip():
                        # Split into paragraphs
                        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]

                        for para in paragraphs:
                            # Check for mathematical formulas
                            if self.formula_parser.contains_formula(para):
                                # Parse and convert formulas to MathML
                                formula_blocks = self.formula_parser.extract_formulas(para)
                                content_blocks.extend(formula_blocks)
                            else:
                                # Regular text paragraph
                                content_blocks.append({
                                    'type': 'paragraph',
                                    'content': para,
                                    'page': page_num
                                })

                    # Extract images (if any)
                    try:
                        if '/XObject' in page['/Resources']:
                            xobjects = page['/Resources']['/XObject'].get_object()

                            for obj_name in xobjects:
                                obj = xobjects[obj_name]

                                if obj['/Subtype'] == '/Image':
                                    # Extract image data
                                    image_data = self._extract_image(obj)
                                    if image_data:
                                        content_blocks.append({
                                            'type': 'image',
                                            'data': image_data,
                                            'page': page_num,
                                            'name': f'image_p{page_num}_{obj_name[1:]}'
                                        })
                    except Exception as img_error:
                        logger.warning(f"Error extracting images from page {page_num}: {img_error}")

                self.content = content_blocks
                logger.info(f"Extracted {len(content_blocks)} content blocks")
                return content_blocks

        except Exception as e:
            logger.error(f"Error extracting content: {e}")
            raise

    def _extract_image(self, image_obj) -> Optional[bytes]:
        """
        Extract image data from PDF image object

        Args:
            image_obj: PDF image object

        Returns:
            Image data as bytes or None if extraction fails
        """
        try:
            # Get image data
            data = image_obj.get_data()

            # Try to open with PIL to verify it's valid
            img = Image.open(io.BytesIO(data))

            # Convert to RGB if necessary
            if img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')

            # Save to bytes
            output = io.BytesIO()
            img.save(output, format='PNG')
            return output.getvalue()

        except Exception as e:
            logger.warning(f"Failed to extract image: {e}")
            return None

    def convert(self) -> Path:
        """
        Perform the complete PDF to EPUB conversion

        Returns:
            Path to the generated EPUB file
        """
        logger.info(f"Starting conversion: {self.pdf_path} -> {self.output_path}")

        try:
            # Step 1: Extract metadata
            self.extract_metadata()

            # Step 2: Extract content
            self.extract_content()

            # Step 3: Build EPUB
            logger.info("Building EPUB file")
            self.epub_builder.set_metadata(
                title=self.metadata.get('title', 'Untitled'),
                author=self.metadata.get('author', 'Unknown'),
                language='en'
            )

            # Add content blocks to EPUB with enhanced API
            for block in self.content:
                if block['type'] == 'paragraph':
                    self.epub_builder.add_paragraph(block['content'])
                elif block['type'] == 'formula':
                    # Use enhanced add_formula with fallbacks
                    self.epub_builder.add_formula(
                        block['mathml'],
                        fallback_svg=block.get('svg'),
                        fallback_img=block.get('png'),
                        display=block.get('display', True)
                    )
                elif block['type'] == 'image':
                    # Use enhanced add_figure
                    self.epub_builder.add_figure(
                        block['data'],
                        block['name'],
                        alt_text=f"Image from page {block.get('page', 'unknown')}"
                    )

            # Generate EPUB file
            self.epub_builder.build(str(self.output_path))
            logger.info(f"EPUB file created: {self.output_path}")

            # Step 4: Validate EPUB
            logger.info("Validating EPUB file")
            is_valid, errors = self.validator.validate(str(self.output_path))

            if is_valid:
                logger.info("✓ EPUB validation passed!")
            else:
                logger.warning(f"✗ EPUB validation failed with {len(errors)} errors:")
                for error in errors[:10]:  # Show first 10 errors
                    logger.warning(f"  - {error}")

            return self.output_path

        except Exception as e:
            logger.error(f"Conversion failed: {e}")
            raise

    def get_conversion_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the conversion

        Returns:
            Dictionary with conversion statistics
        """
        return {
            'input_file': str(self.pdf_path),
            'output_file': str(self.output_path),
            'num_pages': self.metadata.get('num_pages', 0),
            'num_content_blocks': len(self.content),
            'title': self.metadata.get('title', ''),
            'author': self.metadata.get('author', '')
        }


def main():
    """Command-line interface for PDF to EPUB conversion"""
    parser = argparse.ArgumentParser(
        description='Convert PDF files to EPUB 3.x format with MathML support'
    )
    parser.add_argument(
        'input',
        help='Input PDF file path'
    )
    parser.add_argument(
        '-o', '--output',
        help='Output EPUB file path (default: same as input with .epub extension)'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    parser.add_argument(
        '--no-validate',
        action='store_true',
        help='Skip EPUB validation'
    )

    args = parser.parse_args()

    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    try:
        # Create converter instance
        converter = PDFToEPUBConverter(args.input, args.output)

        # Perform conversion
        output_path = converter.convert()

        # Display statistics
        stats = converter.get_conversion_stats()
        print("\n" + "="*50)
        print("Conversion Complete!")
        print("="*50)
        print(f"Input:  {stats['input_file']}")
        print(f"Output: {stats['output_file']}")
        print(f"Pages:  {stats['num_pages']}")
        print(f"Blocks: {stats['num_content_blocks']}")
        print(f"Title:  {stats['title']}")
        print(f"Author: {stats['author']}")
        print("="*50)

        return 0

    except Exception as e:
        logger.error(f"Fatal error: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
