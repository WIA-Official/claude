#!/usr/bin/env python3
"""
EPUB Checker - Validation Logic
Validates EPUB files using epubcheck and provides detailed reports
"""

import os
import sys
import subprocess
import json
import logging
import tempfile
import zipfile
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any
from dataclasses import dataclass, field

# Add parent directory to path to import from 6_pdf_to_epub
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '6_pdf_to_epub'))

try:
    from validator import ValidationError, ValidationResult, EPUBValidator
except ImportError:
    # Fallback if import fails
    @dataclass
    class ValidationError:
        """Validation error dataclass"""
        code: str
        severity: str
        message: str
        location: Optional[str] = None
        line: Optional[int] = None
        column: Optional[int] = None
        fixable: bool = False

    @dataclass
    class ValidationResult:
        """Validation result dataclass"""
        is_valid: bool
        errors: List[ValidationError] = field(default_factory=list)
        warnings: List[ValidationError] = field(default_factory=list)
        info: List[ValidationError] = field(default_factory=list)

        @property
        def error_count(self) -> int:
            return len(self.errors)

        @property
        def warning_count(self) -> int:
            return len(self.warnings)

        @property
        def info_count(self) -> int:
            return len(self.info)

        @property
        def fixable_count(self) -> int:
            return sum(1 for e in self.errors if e.fixable)

logger = logging.getLogger(__name__)


class EPUBChecker:
    """
    EPUB validation checker for web service
    Wraps EPUBValidator with additional web-friendly features
    """

    def __init__(self, epubcheck_path: Optional[str] = None):
        """
        Initialize EPUB checker

        Args:
            epubcheck_path: Path to epubcheck JAR file (optional)
        """
        # Try to import EPUBValidator
        try:
            from validator import EPUBValidator
            self.validator = EPUBValidator(epubcheck_path)
            self.has_validator = True
        except ImportError:
            logger.warning("Could not import EPUBValidator, using fallback")
            self.validator = None
            self.has_validator = False
            self.epubcheck_path = epubcheck_path or self._find_epubcheck()

    def _find_epubcheck(self) -> Optional[str]:
        """Find epubcheck JAR file in common locations"""
        search_paths = [
            '/usr/local/bin/epubcheck.jar',
            '/usr/bin/epubcheck.jar',
            '/opt/epubcheck/epubcheck.jar',
            os.path.expanduser('~/epubcheck/epubcheck.jar'),
            './epubcheck.jar'
        ]

        for path in search_paths:
            if os.path.exists(path):
                logger.info(f"Found epubcheck at: {path}")
                return path

        logger.warning("epubcheck not found in common locations")
        return None

    def check_epub(self, epub_path: str) -> ValidationResult:
        """
        Validate EPUB file

        Args:
            epub_path: Path to EPUB file

        Returns:
            ValidationResult with detailed errors
        """
        if self.has_validator and self.validator:
            # Use imported validator
            return self.validator.validate(epub_path)
        else:
            # Fallback validation
            return self._validate_fallback(epub_path)

    def _validate_fallback(self, epub_path: str) -> ValidationResult:
        """
        Fallback validation when EPUBValidator not available

        Args:
            epub_path: Path to EPUB file

        Returns:
            ValidationResult
        """
        errors = []
        warnings = []
        info_items = []

        # Basic file structure check
        if not os.path.exists(epub_path):
            errors.append(ValidationError(
                code='FILE-001',
                severity='FATAL',
                message=f'EPUB file not found: {epub_path}',
                fixable=False
            ))
            return ValidationResult(is_valid=False, errors=errors)

        # Check if it's a valid ZIP
        try:
            with zipfile.ZipFile(epub_path, 'r') as zf:
                # Check for mimetype
                if 'mimetype' not in zf.namelist():
                    errors.append(ValidationError(
                        code='PKG-001',
                        severity='ERROR',
                        message='Missing mimetype file',
                        fixable=False
                    ))

                # Check for META-INF/container.xml
                if 'META-INF/container.xml' not in zf.namelist():
                    errors.append(ValidationError(
                        code='PKG-002',
                        severity='ERROR',
                        message='Missing META-INF/container.xml',
                        fixable=False
                    ))

                info_items.append(ValidationError(
                    code='INFO',
                    severity='INFO',
                    message=f'EPUB contains {len(zf.namelist())} files',
                    fixable=False
                ))

        except zipfile.BadZipFile:
            errors.append(ValidationError(
                code='PKG-003',
                severity='FATAL',
                message='File is not a valid ZIP archive',
                fixable=False
            ))

        # Run epubcheck if available
        if self.epubcheck_path and os.path.exists(self.epubcheck_path):
            try:
                result = subprocess.run(
                    ['java', '-jar', self.epubcheck_path, epub_path, '--json', '-'],
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                if result.stdout:
                    try:
                        data = json.loads(result.stdout)
                        messages = data.get('messages', [])

                        for msg in messages:
                            error = ValidationError(
                                code=msg.get('ID', 'UNKNOWN'),
                                severity=msg.get('severity', 'ERROR'),
                                message=msg.get('message', ''),
                                location=msg.get('locations', [{}])[0].get('path'),
                                line=msg.get('locations', [{}])[0].get('line'),
                                column=msg.get('locations', [{}])[0].get('column'),
                                fixable=self._is_fixable(msg.get('ID', ''))
                            )

                            if error.severity == 'ERROR' or error.severity == 'FATAL':
                                errors.append(error)
                            elif error.severity == 'WARNING':
                                warnings.append(error)
                            else:
                                info_items.append(error)

                    except json.JSONDecodeError:
                        logger.warning("Could not parse epubcheck JSON output")

            except subprocess.TimeoutExpired:
                errors.append(ValidationError(
                    code='SYS-001',
                    severity='ERROR',
                    message='Validation timeout',
                    fixable=False
                ))
            except Exception as e:
                logger.error(f"Error running epubcheck: {e}")

        is_valid = len(errors) == 0
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            info=info_items
        )

    def _is_fixable(self, error_code: str) -> bool:
        """Determine if error code is auto-fixable"""
        fixable_codes = ['RSC-005', 'RSC-016', 'PKG-021', 'RSC-007']
        return error_code in fixable_codes

    def get_file_info(self, epub_path: str) -> Dict[str, Any]:
        """
        Get basic EPUB file information

        Args:
            epub_path: Path to EPUB file

        Returns:
            Dictionary with file info
        """
        info = {
            'filename': os.path.basename(epub_path),
            'size': 0,
            'size_mb': 0.0,
            'num_files': 0,
            'has_images': False,
            'has_fonts': False,
            'title': 'Unknown',
            'creator': 'Unknown'
        }

        if not os.path.exists(epub_path):
            return info

        # File size
        size = os.path.getsize(epub_path)
        info['size'] = size
        info['size_mb'] = round(size / (1024 * 1024), 2)

        # Extract info from EPUB
        try:
            with zipfile.ZipFile(epub_path, 'r') as zf:
                filelist = zf.namelist()
                info['num_files'] = len(filelist)

                # Check for images
                info['has_images'] = any('image' in f.lower() or f.endswith(('.jpg', '.png', '.gif', '.svg')) for f in filelist)

                # Check for fonts
                info['has_fonts'] = any('font' in f.lower() or f.endswith(('.woff', '.woff2', '.ttf', '.otf')) for f in filelist)

                # Try to extract metadata from OPF
                for filename in filelist:
                    if filename.endswith('.opf'):
                        try:
                            opf_content = zf.read(filename).decode('utf-8', errors='ignore')
                            # Simple regex extraction (not perfect but works for most cases)
                            import re

                            title_match = re.search(r'<dc:title[^>]*>([^<]+)</dc:title>', opf_content)
                            if title_match:
                                info['title'] = title_match.group(1).strip()

                            creator_match = re.search(r'<dc:creator[^>]*>([^<]+)</dc:creator>', opf_content)
                            if creator_match:
                                info['creator'] = creator_match.group(1).strip()

                            break
                        except:
                            pass

        except Exception as e:
            logger.warning(f"Error extracting EPUB info: {e}")

        return info

    def generate_report(self, result: ValidationResult, epub_path: str, language: str = 'ko') -> Dict[str, Any]:
        """
        Generate detailed validation report

        Args:
            result: ValidationResult
            epub_path: Path to EPUB file
            language: Language for report ('ko' or 'en')

        Returns:
            Report dictionary
        """
        file_info = self.get_file_info(epub_path)

        report = {
            'is_valid': result.is_valid,
            'file_info': file_info,
            'summary': {
                'total_errors': result.error_count,
                'total_warnings': result.warning_count,
                'total_info': result.info_count,
                'fixable_errors': result.fixable_count
            },
            'errors': [],
            'warnings': [],
            'info': [],
            'language': language
        }

        # Convert errors to dict format
        for error in result.errors:
            report['errors'].append({
                'code': error.code,
                'severity': error.severity,
                'message': error.message,
                'location': error.location,
                'line': error.line,
                'column': error.column,
                'fixable': error.fixable
            })

        for warning in result.warnings:
            report['warnings'].append({
                'code': warning.code,
                'severity': warning.severity,
                'message': warning.message,
                'location': warning.location,
                'line': warning.line,
                'fixable': warning.fixable
            })

        for info_item in result.info:
            report['info'].append({
                'code': info_item.code,
                'message': info_item.message
            })

        return report


# Utility function
def check_epub_file(epub_path: str, language: str = 'ko') -> Dict[str, Any]:
    """
    Convenience function to check EPUB file

    Args:
        epub_path: Path to EPUB file
        language: Language for report

    Returns:
        Validation report dictionary
    """
    checker = EPUBChecker()
    result = checker.check_epub(epub_path)
    return checker.generate_report(result, epub_path, language)


# Example usage
if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print("Usage: python checker.py <epub_file>")
        sys.exit(1)

    epub_file = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else 'ko'

    # Configure logging
    logging.basicConfig(level=logging.INFO)

    # Check EPUB
    checker = EPUBChecker()
    result = checker.check_epub(epub_file)
    report = checker.generate_report(result, epub_file, language)

    # Print report
    print("\n" + "="*60)
    print(f"EPUB Validation Report: {report['file_info']['filename']}")
    print("="*60)
    print(f"Valid: {report['is_valid']}")
    print(f"Errors: {report['summary']['total_errors']}")
    print(f"Warnings: {report['summary']['total_warnings']}")
    print(f"Fixable: {report['summary']['fixable_errors']}")
    print("="*60)

    if report['errors']:
        print("\nErrors:")
        for i, error in enumerate(report['errors'][:10], 1):
            print(f"{i}. [{error['code']}] {error['message']}")
            if error['location']:
                print(f"   Location: {error['location']}")
