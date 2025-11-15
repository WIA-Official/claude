#!/usr/bin/env python3
"""
EPUB Validator - epubcheck Integration Module
Validates EPUB files for EPUB 3.x compliance using epubcheck
"""

import os
import subprocess
import logging
import zipfile
import json
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
from xml.etree import ElementTree as ET

logger = logging.getLogger(__name__)


class EPUBValidator:
    """Validator for EPUB files using epubcheck and custom validation"""

    def __init__(self, epubcheck_path: Optional[str] = None):
        """
        Initialize the validator

        Args:
            epubcheck_path: Path to epubcheck JAR file (optional)
        """
        self.epubcheck_path = epubcheck_path or self._find_epubcheck()
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def _find_epubcheck(self) -> Optional[str]:
        """
        Try to find epubcheck in common locations

        Returns:
            Path to epubcheck JAR or None if not found
        """
        common_paths = [
            '/usr/local/bin/epubcheck.jar',
            '/usr/bin/epubcheck.jar',
            os.path.expanduser('~/bin/epubcheck.jar'),
            './epubcheck.jar',
            '../tools/epubcheck.jar'
        ]

        for path in common_paths:
            if os.path.exists(path):
                logger.info(f"Found epubcheck at: {path}")
                return path

        logger.warning("epubcheck not found, will use basic validation only")
        return None

    def validate(self, epub_path: str, use_epubcheck: bool = True) -> Tuple[bool, List[str]]:
        """
        Validate an EPUB file

        Args:
            epub_path: Path to EPUB file to validate
            use_epubcheck: Whether to use epubcheck (default: True)

        Returns:
            Tuple of (is_valid, error_list)
        """
        logger.info(f"Validating EPUB: {epub_path}")

        self.errors = []
        self.warnings = []

        # Check if file exists
        if not os.path.exists(epub_path):
            self.errors.append(f"File not found: {epub_path}")
            return False, self.errors

        # Basic structural validation
        basic_valid = self._validate_basic_structure(epub_path)

        # Run epubcheck if available and requested
        epubcheck_valid = True
        if use_epubcheck and self.epubcheck_path:
            epubcheck_valid = self._run_epubcheck(epub_path)
        elif use_epubcheck:
            self.warnings.append("epubcheck not available, skipping advanced validation")

        is_valid = basic_valid and epubcheck_valid
        all_errors = self.errors + self.warnings

        if is_valid:
            logger.info("✓ EPUB validation passed")
        else:
            logger.warning(f"✗ EPUB validation failed with {len(self.errors)} errors")

        return is_valid, all_errors

    def _validate_basic_structure(self, epub_path: str) -> bool:
        """
        Perform basic EPUB structure validation

        Args:
            epub_path: Path to EPUB file

        Returns:
            True if basic validation passes
        """
        logger.info("Performing basic structure validation")

        try:
            with zipfile.ZipFile(epub_path, 'r') as epub:
                # Check mimetype
                if 'mimetype' not in epub.namelist():
                    self.errors.append("Missing mimetype file")
                    return False

                mimetype = epub.read('mimetype').decode('utf-8').strip()
                if mimetype != 'application/epub+zip':
                    self.errors.append(f"Invalid mimetype: {mimetype}")
                    return False

                # Check META-INF/container.xml
                if 'META-INF/container.xml' not in epub.namelist():
                    self.errors.append("Missing META-INF/container.xml")
                    return False

                # Validate container.xml
                container_xml = epub.read('META-INF/container.xml')
                container_valid = self._validate_container_xml(container_xml)
                if not container_valid:
                    return False

                # Find and validate OPF file
                opf_path = self._extract_opf_path(container_xml)
                if not opf_path:
                    self.errors.append("Could not find OPF path in container.xml")
                    return False

                if opf_path not in epub.namelist():
                    self.errors.append(f"OPF file not found: {opf_path}")
                    return False

                # Validate OPF
                opf_content = epub.read(opf_path)
                opf_valid = self._validate_opf(opf_content)
                if not opf_valid:
                    return False

                # Check for navigation document (EPUB 3)
                nav_found = False
                for filename in epub.namelist():
                    if 'nav' in filename.lower() and filename.endswith('.xhtml'):
                        nav_found = True
                        break

                if not nav_found:
                    self.warnings.append("No navigation document found (nav.xhtml)")

                logger.info("Basic structure validation passed")
                return True

        except zipfile.BadZipFile:
            self.errors.append("Invalid ZIP file format")
            return False
        except Exception as e:
            self.errors.append(f"Validation error: {str(e)}")
            return False

    def _validate_container_xml(self, xml_content: bytes) -> bool:
        """
        Validate container.xml

        Args:
            xml_content: XML content as bytes

        Returns:
            True if valid
        """
        try:
            root = ET.fromstring(xml_content)

            # Check namespace
            expected_ns = 'urn:oasis:names:tc:opendocument:xmlns:container'
            if expected_ns not in root.tag:
                self.warnings.append("container.xml has unexpected namespace")

            # Check for rootfiles
            rootfiles = root.findall('.//{*}rootfile')
            if not rootfiles:
                self.errors.append("No rootfiles found in container.xml")
                return False

            return True

        except ET.ParseError as e:
            self.errors.append(f"Invalid container.xml: {e}")
            return False

    def _extract_opf_path(self, container_xml: bytes) -> Optional[str]:
        """
        Extract OPF file path from container.xml

        Args:
            container_xml: Container XML content

        Returns:
            OPF file path or None
        """
        try:
            root = ET.fromstring(container_xml)
            rootfile = root.find('.//{*}rootfile')
            if rootfile is not None:
                return rootfile.get('full-path')
            return None
        except Exception:
            return None

    def _validate_opf(self, opf_content: bytes) -> bool:
        """
        Validate OPF (package document)

        Args:
            opf_content: OPF XML content

        Returns:
            True if valid
        """
        try:
            root = ET.fromstring(opf_content)

            # Check version
            version = root.get('version')
            if version not in ('2.0', '3.0'):
                self.warnings.append(f"Unexpected EPUB version: {version}")

            # Check for required elements
            metadata = root.find('.//{*}metadata')
            manifest = root.find('.//{*}manifest')
            spine = root.find('.//{*}spine')

            if metadata is None:
                self.errors.append("Missing metadata in OPF")
                return False

            if manifest is None:
                self.errors.append("Missing manifest in OPF")
                return False

            if spine is None:
                self.errors.append("Missing spine in OPF")
                return False

            # Check required metadata
            title = metadata.find('.//{*}title')
            if title is None or not title.text:
                self.errors.append("Missing or empty title in metadata")

            language = metadata.find('.//{*}language')
            if language is None or not language.text:
                self.errors.append("Missing or empty language in metadata")

            identifier = metadata.find('.//{*}identifier')
            if identifier is None or not identifier.text:
                self.errors.append("Missing or empty identifier in metadata")

            # Check manifest items
            items = manifest.findall('.//{*}item')
            if not items:
                self.errors.append("No items in manifest")
                return False

            # Check spine itemrefs
            itemrefs = spine.findall('.//{*}itemref')
            if not itemrefs:
                self.errors.append("No itemrefs in spine")
                return False

            return True

        except ET.ParseError as e:
            self.errors.append(f"Invalid OPF: {e}")
            return False

    def _run_epubcheck(self, epub_path: str) -> bool:
        """
        Run epubcheck on the EPUB file

        Args:
            epub_path: Path to EPUB file

        Returns:
            True if epubcheck passes
        """
        if not self.epubcheck_path:
            return True

        logger.info(f"Running epubcheck: {self.epubcheck_path}")

        try:
            # Run epubcheck
            result = subprocess.run(
                ['java', '-jar', self.epubcheck_path, epub_path, '--json', '-'],
                capture_output=True,
                text=True,
                timeout=60
            )

            # Parse JSON output
            if result.stdout:
                try:
                    report = json.loads(result.stdout)

                    # Extract messages
                    if 'messages' in report:
                        for msg in report['messages']:
                            severity = msg.get('severity', 'INFO')
                            message = msg.get('message', '')
                            location = msg.get('locations', [{}])[0]
                            line = location.get('line', '')
                            col = location.get('column', '')

                            error_text = f"{message}"
                            if line:
                                error_text += f" (line {line}"
                                if col:
                                    error_text += f", col {col}"
                                error_text += ")"

                            if severity == 'ERROR' or severity == 'FATAL':
                                self.errors.append(error_text)
                            elif severity == 'WARNING':
                                self.warnings.append(error_text)

                except json.JSONDecodeError:
                    logger.warning("Could not parse epubcheck JSON output")

            # Check return code
            if result.returncode == 0:
                logger.info("epubcheck validation passed")
                return True
            else:
                logger.warning(f"epubcheck failed with return code {result.returncode}")
                if result.stderr:
                    self.errors.append(f"epubcheck error: {result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            self.errors.append("epubcheck timed out")
            return False
        except FileNotFoundError:
            self.warnings.append("Java not found, cannot run epubcheck")
            return True
        except Exception as e:
            self.warnings.append(f"epubcheck error: {str(e)}")
            return True

    def validate_mathml(self, epub_path: str) -> Tuple[bool, List[str]]:
        """
        Specifically validate MathML content in EPUB

        Args:
            epub_path: Path to EPUB file

        Returns:
            Tuple of (is_valid, error_list)
        """
        logger.info("Validating MathML content")

        mathml_errors = []

        try:
            with zipfile.ZipFile(epub_path, 'r') as epub:
                # Find all XHTML files
                xhtml_files = [f for f in epub.namelist()
                              if f.endswith('.xhtml') or f.endswith('.html')]

                for xhtml_file in xhtml_files:
                    content = epub.read(xhtml_file).decode('utf-8')

                    # Check for MathML
                    if '<math' in content.lower():
                        # Validate MathML namespace
                        if 'xmlns="http://www.w3.org/1998/Math/MathML"' not in content:
                            mathml_errors.append(
                                f"{xhtml_file}: MathML missing proper namespace"
                            )

                        # Check for basic MathML structure
                        try:
                            root = ET.fromstring(content.encode('utf-8'))
                            math_elements = root.findall('.//{http://www.w3.org/1998/Math/MathML}math')

                            for math in math_elements:
                                # Check for content
                                if len(list(math)) == 0:
                                    mathml_errors.append(
                                        f"{xhtml_file}: Empty MathML element"
                                    )

                        except ET.ParseError as e:
                            mathml_errors.append(f"{xhtml_file}: XML parse error: {e}")

            is_valid = len(mathml_errors) == 0
            return is_valid, mathml_errors

        except Exception as e:
            mathml_errors.append(f"MathML validation error: {str(e)}")
            return False, mathml_errors

    def get_report(self) -> Dict[str, Any]:
        """
        Get validation report

        Returns:
            Dictionary with validation results
        """
        return {
            'errors': self.errors,
            'warnings': self.warnings,
            'error_count': len(self.errors),
            'warning_count': len(self.warnings),
            'is_valid': len(self.errors) == 0
        }


# Utility function
def validate_epub(epub_path: str, use_epubcheck: bool = True) -> Tuple[bool, List[str]]:
    """
    Convenience function to validate an EPUB file

    Args:
        epub_path: Path to EPUB file
        use_epubcheck: Whether to use epubcheck

    Returns:
        Tuple of (is_valid, error_list)
    """
    validator = EPUBValidator()
    return validator.validate(epub_path, use_epubcheck)


# Example usage
if __name__ == '__main__':
    import sys

    # Set up logging
    logging.basicConfig(level=logging.INFO)

    if len(sys.argv) < 2:
        print("Usage: python validator.py <epub_file>")
        sys.exit(1)

    epub_file = sys.argv[1]

    validator = EPUBValidator()
    is_valid, errors = validator.validate(epub_file)

    print("\n" + "="*50)
    print("EPUB Validation Report")
    print("="*50)
    print(f"File: {epub_file}")
    print(f"Valid: {'✓ YES' if is_valid else '✗ NO'}")
    print(f"Errors: {len(validator.errors)}")
    print(f"Warnings: {len(validator.warnings)}")

    if validator.errors:
        print("\nErrors:")
        for error in validator.errors:
            print(f"  - {error}")

    if validator.warnings:
        print("\nWarnings:")
        for warning in validator.warnings:
            print(f"  - {warning}")

    print("="*50)

    # Also check MathML
    mathml_valid, mathml_errors = validator.validate_mathml(epub_file)
    if not mathml_valid:
        print("\nMathML Validation Errors:")
        for error in mathml_errors:
            print(f"  - {error}")

    sys.exit(0 if is_valid else 1)
