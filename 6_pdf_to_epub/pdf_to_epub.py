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
        self.validation_result = None  # Store validation result

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

                    # Extract images (if any) - Enhanced extraction
                    try:
                        if '/Resources' in page:
                            resources = page['/Resources']
                            if resources and '/XObject' in resources:
                                xobjects = resources['/XObject']
                                if xobjects:
                                    xobjects = xobjects.get_object() if hasattr(xobjects, 'get_object') else xobjects

                                    for obj_name in xobjects:
                                        try:
                                            obj = xobjects[obj_name]
                                            if hasattr(obj, 'get_object'):
                                                obj = obj.get_object()

                                            # Check if it's an image
                                            if '/Subtype' in obj and obj['/Subtype'] == '/Image':
                                                # Extract image data with enhanced error handling
                                                image_data = self._extract_image(obj)
                                                if image_data:
                                                    # Generate unique, safe filename
                                                    obj_name_clean = obj_name[1:] if obj_name.startswith('/') else obj_name
                                                    # Remove any invalid filename characters
                                                    obj_name_clean = ''.join(c if c.isalnum() or c in '-_' else '_' for c in obj_name_clean)

                                                    img_filename = f'img_page{page_num:03d}_{obj_name_clean}.png'

                                                    content_blocks.append({
                                                        'type': 'image',
                                                        'data': image_data,
                                                        'page': page_num,
                                                        'name': img_filename
                                                    })
                                                    logger.debug(f"Extracted image: {img_filename} ({len(image_data)} bytes)")
                                        except Exception as obj_error:
                                            logger.warning(f"Error extracting image object '{obj_name}' on page {page_num}: {obj_error}")
                                            continue
                    except Exception as img_error:
                        logger.warning(f"Error accessing images on page {page_num}: {img_error}")

                self.content = content_blocks

                # Log extraction summary
                num_paragraphs = sum(1 for b in content_blocks if b['type'] == 'paragraph')
                num_formulas = sum(1 for b in content_blocks if b['type'] == 'formula')
                num_images = sum(1 for b in content_blocks if b['type'] == 'image')

                logger.info(f"Extracted {len(content_blocks)} content blocks:")
                logger.info(f"  - Paragraphs: {num_paragraphs}")
                logger.info(f"  - Formulas: {num_formulas}")
                logger.info(f"  - Images: {num_images}")

                return content_blocks

        except Exception as e:
            logger.error(f"Error extracting content: {e}")
            raise

    def _extract_image(self, image_obj) -> Optional[bytes]:
        """
        Enhanced image extraction from PDF with support for multiple formats and filters

        Args:
            image_obj: PDF image object

        Returns:
            Image data as bytes (PNG format) or None if extraction fails
        """
        try:
            # Get basic image properties
            width = image_obj.get('/Width', 0)
            height = image_obj.get('/Height', 0)

            if width == 0 or height == 0:
                logger.debug("Skipping image with zero dimensions")
                return None

            # Try to get image data using get_data() method
            try:
                data = image_obj.get_data()
            except Exception as data_error:
                # Fallback: try direct data access
                logger.debug(f"get_data() failed, trying direct access: {data_error}")
                try:
                    data = image_obj._data
                except:
                    logger.warning("Could not access image data")
                    return None

            if not data or len(data) == 0:
                logger.debug("Empty image data")
                return None

            # Try to open and process with PIL
            try:
                img = Image.open(io.BytesIO(data))
            except Exception as pil_error:
                # Fallback: try to determine filter and decode manually
                logger.debug(f"PIL open failed: {pil_error}, trying manual decode")

                filter_type = image_obj.get('/Filter', '')
                color_space = image_obj.get('/ColorSpace', '')

                # Handle different filter types
                if filter_type == '/DCTDecode':
                    # JPEG - try to open directly
                    try:
                        img = Image.open(io.BytesIO(data))
                    except:
                        logger.warning("Failed to decode DCT/JPEG image")
                        return None
                elif filter_type == '/FlateDecode':
                    # Deflate/zlib compressed - PIL should handle this
                    logger.warning("Failed to decode Flate compressed image")
                    return None
                else:
                    logger.warning(f"Unsupported filter type: {filter_type}")
                    return None

            # Validate image dimensions
            if img.width == 0 or img.height == 0:
                logger.debug("Image has zero width or height")
                return None

            # Skip very small images (likely artifacts)
            if img.width < 10 and img.height < 10:
                logger.debug(f"Skipping tiny image: {img.width}x{img.height}")
                return None

            # Convert to appropriate mode
            if img.mode in ('RGBA', 'LA', 'PA'):
                # Has alpha channel - preserve it
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
            elif img.mode in ('RGB', 'L'):
                # Already in supported mode
                pass
            elif img.mode == '1':
                # 1-bit images - convert to grayscale
                img = img.convert('L')
            elif img.mode == 'P':
                # Palette mode - convert to RGB
                img = img.convert('RGB')
            elif img.mode == 'CMYK':
                # CMYK - convert to RGB
                img = img.convert('RGB')
            else:
                # Other modes - try to convert to RGB
                logger.debug(f"Converting image mode {img.mode} to RGB")
                try:
                    img = img.convert('RGB')
                except:
                    img = img.convert('L')

            # Save to PNG bytes with optimization
            output = io.BytesIO()

            # Use appropriate format based on transparency
            if img.mode in ('RGBA', 'LA'):
                img.save(output, format='PNG', optimize=True)
            else:
                # For images without alpha, we can use RGB or L
                img.save(output, format='PNG', optimize=True)

            png_data = output.getvalue()

            logger.debug(f"Successfully extracted image: {img.width}x{img.height}, {img.mode}, {len(png_data)} bytes")
            return png_data

        except Exception as e:
            logger.warning(f"Failed to extract image: {type(e).__name__}: {e}")
            import traceback
            logger.debug(f"Traceback: {traceback.format_exc()}")
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

            # Generate EPUB file with auto-validation and auto-fix
            logger.info("Building EPUB file with auto-validation...")
            validation_result = self.epub_builder.build(
                str(self.output_path),
                auto_validate=True,
                auto_fix=True
            )

            # Store validation result for stats
            self.validation_result = validation_result

            # Summary of validation
            if validation_result:
                if validation_result.is_valid:
                    logger.info("✓ EPUB conversion complete and validated successfully!")
                else:
                    logger.warning(f"⚠ EPUB created but has validation issues:")
                    logger.warning(f"  - Errors: {validation_result.error_count}")
                    logger.warning(f"  - Warnings: {validation_result.warning_count}")
                    logger.warning("ℹ Run with --verbose to see detailed error list")
            else:
                logger.info(f"✓ EPUB file created: {self.output_path}")
                logger.info("ℹ Validation skipped or not available")

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
        stats = {
            'input_file': str(self.pdf_path),
            'output_file': str(self.output_path),
            'num_pages': self.metadata.get('num_pages', 0),
            'num_content_blocks': len(self.content),
            'title': self.metadata.get('title', ''),
            'author': self.metadata.get('author', '')
        }

        # Add validation statistics if available
        if self.validation_result:
            stats['validation'] = {
                'is_valid': self.validation_result.is_valid,
                'errors': self.validation_result.error_count,
                'warnings': self.validation_result.warning_count,
                'info': self.validation_result.info_count,
                'fixable_errors': self.validation_result.fixable_count
            }
        else:
            stats['validation'] = None

        return stats


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
        print("PDF to EPUB Conversion Complete!")
        print("="*50)
        print(f"Input:  {stats['input_file']}")
        print(f"Output: {stats['output_file']}")
        print(f"Pages:  {stats['num_pages']}")
        print(f"Blocks: {stats['num_content_blocks']}")
        print(f"Title:  {stats['title']}")
        print(f"Author: {stats['author']}")

        # Display validation results
        if stats.get('validation'):
            val = stats['validation']
            print("\n" + "-"*50)
            print("EPUB Validation Results:")
            print("-"*50)
            if val['is_valid']:
                print("✓ Status: VALID (No errors)")
            else:
                print(f"⚠ Status: INVALID")
                print(f"  - Errors:   {val['errors']} ({val['fixable_errors']} auto-fixed)")
                print(f"  - Warnings: {val['warnings']}")
                print(f"  - Info:     {val['info']}")

        print("="*50)

        return 0

    except Exception as e:
        logger.error(f"Fatal error: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
