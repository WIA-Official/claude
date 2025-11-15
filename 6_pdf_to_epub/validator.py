#!/usr/bin/env python3
"""
EPUB Validator - Enhanced with Auto-Fix Capabilities
Validates EPUB files and automatically fixes common errors
"""

import os
import re
import subprocess
import logging
import zipfile
import json
import tempfile
import shutil
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
from xml.etree import ElementTree as ET
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class ValidationError:
    """Represents a validation error"""
    code: str
    severity: str  # FATAL, ERROR, WARNING, INFO
    message: str
    location: Optional[str] = None
    line: Optional[int] = None
    column: Optional[int] = None
    fixable: bool = False


@dataclass
class ValidationResult:
    """Validation result with detailed information"""
    is_valid: bool
    errors: List[ValidationError] = field(default_factory=list)
    warnings: List[ValidationError] = field(default_factory=list)
    info: List[ValidationError] = field(default_factory=list)

    @property
    def fatal_count(self) -> int:
        return sum(1 for e in self.errors if e.severity == 'FATAL')

    @property
    def error_count(self) -> int:
        return sum(1 for e in self.errors if e.severity == 'ERROR')

    @property
    def warning_count(self) -> int:
        return len(self.warnings)

    @property
    def fixable_count(self) -> int:
        return sum(1 for e in self.errors if e.fixable)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'is_valid': self.is_valid,
            'fatal_count': self.fatal_count,
            'error_count': self.error_count,
            'warning_count': self.warning_count,
            'fixable_count': self.fixable_count,
            'errors': [
                {
                    'code': e.code,
                    'severity': e.severity,
                    'message': e.message,
                    'location': e.location,
                    'line': e.line,
                    'column': e.column,
                    'fixable': e.fixable
                }
                for e in self.errors + self.warnings + self.info
            ]
        }


class EPUBValidator:
    """Enhanced validator with automatic error fixing capabilities"""

    # Valid ARIA roles for EPUB 3.x
    VALID_ARIA_ROLES = {
        'doc-abstract', 'doc-acknowledgments', 'doc-afterword', 'doc-appendix',
        'doc-backlink', 'doc-biblioentry', 'doc-bibliography', 'doc-biblioref',
        'doc-chapter', 'doc-colophon', 'doc-conclusion', 'doc-cover',
        'doc-credit', 'doc-credits', 'doc-dedication', 'doc-endnote',
        'doc-endnotes', 'doc-epigraph', 'doc-epilogue', 'doc-errata',
        'doc-example', 'doc-footnote', 'doc-foreword', 'doc-glossary',
        'doc-glossref', 'doc-index', 'doc-introduction', 'doc-noteref',
        'doc-notice', 'doc-pagebreak', 'doc-pagelist', 'doc-part',
        'doc-preface', 'doc-prologue', 'doc-pullquote', 'doc-qna',
        'doc-subtitle', 'doc-tip', 'doc-toc', 'doc-title',
        # Standard roles
        'heading', 'list', 'listitem', 'navigation', 'article', 'main',
        'complementary', 'contentinfo', 'banner', 'search', 'region'
    }

    def __init__(self, epubcheck_path: Optional[str] = None):
        """
        Initialize the enhanced validator

        Args:
            epubcheck_path: Path to epubcheck JAR file (optional)
        """
        self.epubcheck_path = epubcheck_path or self._find_epubcheck()

    def _find_epubcheck(self) -> Optional[str]:
        """
        Try to find epubcheck in common locations

        Returns:
            Path to epubcheck JAR or None if not found
        """
        common_paths = [
            '/usr/local/bin/epubcheck.jar',
            '/usr/bin/epubcheck.jar',
            '/opt/epubcheck/epubcheck.jar',
            os.path.expanduser('~/bin/epubcheck.jar'),
            './epubcheck.jar',
            '../tools/epubcheck.jar',
            '/var/www/wiabooks/tools/epubcheck.jar'
        ]

        for path in common_paths:
            if os.path.exists(path):
                logger.info(f"Found epubcheck at: {path}")
                return path

        logger.warning("epubcheck not found, will use basic validation only")
        return None

    def validate(self, epub_path: str, use_epubcheck: bool = True) -> ValidationResult:
        """
        Validate an EPUB file with detailed error reporting

        Args:
            epub_path: Path to EPUB file to validate
            use_epubcheck: Whether to use epubcheck (default: True)

        Returns:
            ValidationResult object with detailed information
        """
        logger.info(f"Validating EPUB: {epub_path}")

        errors = []
        warnings = []
        info = []

        # Check if file exists
        if not os.path.exists(epub_path):
            errors.append(ValidationError(
                code='FILE_NOT_FOUND',
                severity='FATAL',
                message=f"File not found: {epub_path}"
            ))
            return ValidationResult(is_valid=False, errors=errors)

        # Basic structural validation
        basic_result = self._validate_basic_structure(epub_path)
        errors.extend(basic_result['errors'])
        warnings.extend(basic_result['warnings'])

        # Run epubcheck if available
        if use_epubcheck and self.epubcheck_path:
            epubcheck_result = self._run_epubcheck(epub_path)
            errors.extend(epubcheck_result['errors'])
            warnings.extend(epubcheck_result['warnings'])
            info.extend(epubcheck_result.get('info', []))
        elif use_epubcheck:
            warnings.append(ValidationError(
                code='EPUBCHECK_NOT_FOUND',
                severity='WARNING',
                message="epubcheck not available, using basic validation only"
            ))

        is_valid = len([e for e in errors if e.severity in ('FATAL', 'ERROR')]) == 0

        result = ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            info=info
        )

        if is_valid:
            logger.info("✓ EPUB validation passed")
        else:
            logger.warning(f"✗ EPUB validation failed: {result.fatal_count} fatal, {result.error_count} errors")

        return result

    def _validate_basic_structure(self, epub_path: str) -> Dict[str, List[ValidationError]]:
        """
        Perform basic EPUB structure validation

        Returns:
            Dictionary with 'errors' and 'warnings' lists
        """
        errors = []
        warnings = []

        try:
            with zipfile.ZipFile(epub_path, 'r') as epub:
                # Check mimetype
                if 'mimetype' not in epub.namelist():
                    errors.append(ValidationError(
                        code='MIMETYPE_MISSING',
                        severity='FATAL',
                        message="Missing mimetype file",
                        fixable=True
                    ))
                    return {'errors': errors, 'warnings': warnings}

                mimetype = epub.read('mimetype').decode('utf-8').strip()
                if mimetype != 'application/epub+zip':
                    errors.append(ValidationError(
                        code='MIMETYPE_INVALID',
                        severity='ERROR',
                        message=f"Invalid mimetype: {mimetype}",
                        fixable=True
                    ))

                # Check META-INF/container.xml
                if 'META-INF/container.xml' not in epub.namelist():
                    errors.append(ValidationError(
                        code='CONTAINER_MISSING',
                        severity='FATAL',
                        message="Missing META-INF/container.xml",
                        fixable=True
                    ))
                    return {'errors': errors, 'warnings': warnings}

                # Validate container.xml
                container_xml = epub.read('META-INF/container.xml')
                if not self._validate_xml_syntax(container_xml):
                    errors.append(ValidationError(
                        code='CONTAINER_INVALID_XML',
                        severity='ERROR',
                        message="Invalid XML in container.xml",
                        fixable=True
                    ))

                # Find OPF file
                opf_path = self._extract_opf_path(container_xml)
                if not opf_path:
                    errors.append(ValidationError(
                        code='OPF_PATH_NOT_FOUND',
                        severity='FATAL',
                        message="Could not find OPF path in container.xml"
                    ))
                    return {'errors': errors, 'warnings': warnings}

                if opf_path not in epub.namelist():
                    errors.append(ValidationError(
                        code='OPF_FILE_MISSING',
                        severity='FATAL',
                        message=f"OPF file not found: {opf_path}"
                    ))

                # Check for navigation document
                nav_found = any('nav' in f.lower() and f.endswith('.xhtml')
                               for f in epub.namelist())
                if not nav_found:
                    warnings.append(ValidationError(
                        code='NAV_MISSING',
                        severity='WARNING',
                        message="No navigation document found (nav.xhtml)",
                        fixable=True
                    ))

        except zipfile.BadZipFile:
            errors.append(ValidationError(
                code='INVALID_ZIP',
                severity='FATAL',
                message="Invalid ZIP file format"
            ))
        except Exception as e:
            errors.append(ValidationError(
                code='VALIDATION_ERROR',
                severity='ERROR',
                message=f"Validation error: {str(e)}"
            ))

        return {'errors': errors, 'warnings': warnings}

    def _run_epubcheck(self, epub_path: str) -> Dict[str, List[ValidationError]]:
        """
        Run epubcheck and parse results

        Returns:
            Dictionary with validation errors
        """
        errors = []
        warnings = []
        info = []

        try:
            # Run epubcheck with JSON output
            result = subprocess.run(
                ['java', '-jar', self.epubcheck_path, epub_path, '--json', '-'],
                capture_output=True,
                text=True,
                timeout=120
            )

            # Parse JSON output
            if result.stdout:
                try:
                    report = json.loads(result.stdout)

                    if 'messages' in report:
                        for msg in report['messages']:
                            severity = msg.get('severity', 'INFO')
                            message = msg.get('message', '')
                            message_id = msg.get('ID', 'UNKNOWN')

                            locations = msg.get('locations', [{}])
                            location = locations[0] if locations else {}

                            error = ValidationError(
                                code=message_id,
                                severity=severity,
                                message=message,
                                location=location.get('path'),
                                line=location.get('line'),
                                column=location.get('column'),
                                fixable=self._is_fixable(message_id)
                            )

                            if severity in ('FATAL', 'ERROR'):
                                errors.append(error)
                            elif severity == 'WARNING':
                                warnings.append(error)
                            else:
                                info.append(error)

                except json.JSONDecodeError:
                    logger.warning("Could not parse epubcheck JSON output")
                    errors.append(ValidationError(
                        code='EPUBCHECK_PARSE_ERROR',
                        severity='ERROR',
                        message="Failed to parse epubcheck output"
                    ))

        except subprocess.TimeoutExpired:
            errors.append(ValidationError(
                code='EPUBCHECK_TIMEOUT',
                severity='ERROR',
                message="epubcheck timed out"
            ))
        except Exception as e:
            errors.append(ValidationError(
                code='EPUBCHECK_ERROR',
                severity='ERROR',
                message=f"epubcheck error: {str(e)}"
            ))

        return {'errors': errors, 'warnings': warnings, 'info': info}

    def _is_fixable(self, error_code: str) -> bool:
        """
        Determine if an error is automatically fixable

        Args:
            error_code: Error code from epubcheck

        Returns:
            True if fixable
        """
        fixable_codes = {
            'RSC-005',  # Invalid role attribute
            'RSC-016',  # Invalid XML character
            'PKG-021',  # Missing file in manifest
            'RSC-007',  # Referenced resource missing
            'RSC-012',  # Fragment identifier not found
            'CSS-008',  # Invalid CSS
        }
        return error_code in fixable_codes

    def auto_fix(self, epub_path: str, validation_result: ValidationResult,
                 max_attempts: int = 3) -> Tuple[str, ValidationResult]:
        """
        Automatically fix EPUB errors

        Args:
            epub_path: Path to EPUB file
            validation_result: Validation result with errors
            max_attempts: Maximum fix attempts (default: 3)

        Returns:
            Tuple of (fixed_epub_path, new_validation_result)
        """
        logger.info(f"Attempting automatic fix for {epub_path}")

        # Create working directory
        temp_dir = tempfile.mkdtemp(prefix='epub_fix_')
        work_path = os.path.join(temp_dir, 'work.epub')
        shutil.copy2(epub_path, work_path)

        try:
            for attempt in range(max_attempts):
                logger.info(f"Fix attempt {attempt + 1}/{max_attempts}")

                # Extract EPUB
                extract_dir = os.path.join(temp_dir, f'extracted_{attempt}')
                with zipfile.ZipFile(work_path, 'r') as zf:
                    zf.extractall(extract_dir)

                # Apply fixes based on error codes
                fixed = False

                for error in validation_result.errors:
                    if not error.fixable:
                        continue

                    if error.code == 'RSC-005':  # Invalid ARIA role
                        if self._fix_aria_roles(extract_dir):
                            fixed = True
                            logger.info("Fixed ARIA role errors")

                    elif error.code == 'RSC-016':  # Invalid XML character
                        if self._fix_xml_characters(extract_dir):
                            fixed = True
                            logger.info("Fixed XML character errors")

                    elif error.code == 'PKG-021':  # Missing file
                        if self._fix_missing_files(extract_dir, error):
                            fixed = True
                            logger.info("Fixed missing file errors")

                    elif error.code == 'RSC-007':  # Referenced resource missing
                        if self._fix_missing_resources(extract_dir, error):
                            fixed = True
                            logger.info("Fixed missing resource errors")

                if not fixed:
                    logger.info("No fixable errors found")
                    break

                # Repackage EPUB
                fixed_path = os.path.join(temp_dir, f'fixed_{attempt}.epub')
                self._repackage_epub(extract_dir, fixed_path)
                work_path = fixed_path

                # Re-validate
                validation_result = self.validate(work_path)

                if validation_result.is_valid:
                    logger.info("✓ All errors fixed!")
                    break

            # Copy fixed EPUB to output
            output_path = epub_path.replace('.epub', '_fixed.epub')
            shutil.copy2(work_path, output_path)

            return output_path, validation_result

        finally:
            # Cleanup
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _fix_aria_roles(self, extract_dir: str) -> bool:
        """
        Fix invalid ARIA role attributes

        Args:
            extract_dir: Extracted EPUB directory

        Returns:
            True if any fixes were made
        """
        fixed = False

        # Find all XHTML files
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                if file.endswith(('.xhtml', '.html')):
                    file_path = os.path.join(root, file)

                    try:
                        # Read file
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()

                        original_content = content

                        # Fix invalid role attributes
                        # Pattern: role="anything"
                        def replace_role(match):
                            nonlocal fixed
                            role_value = match.group(1)

                            # If role is numeric or invalid, replace with appropriate value
                            if role_value.isdigit():
                                # Numeric roles - determine context and replace
                                fixed = True
                                return 'role="doc-chapter"'  # Default to chapter

                            # Check if role is valid
                            if role_value not in self.VALID_ARIA_ROLES:
                                # Try to map to valid role
                                mapped_role = self._map_to_valid_role(role_value)
                                if mapped_role:
                                    fixed = True
                                    return f'role="{mapped_role}"'
                                else:
                                    # Remove invalid role
                                    fixed = True
                                    return ''

                            return match.group(0)

                        # Replace role attributes
                        content = re.sub(r'role="([^"]+)"', replace_role, content)

                        # Write back if changed
                        if content != original_content:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(content)
                            logger.debug(f"Fixed ARIA roles in {file}")

                    except Exception as e:
                        logger.warning(f"Error fixing roles in {file}: {e}")

        return fixed

    def _map_to_valid_role(self, invalid_role: str) -> Optional[str]:
        """
        Map invalid role to valid ARIA role

        Args:
            invalid_role: Invalid role value

        Returns:
            Valid role or None
        """
        # Common mappings
        mappings = {
            'chapter': 'doc-chapter',
            'section': 'doc-chapter',
            'title': 'doc-title',
            'subtitle': 'doc-subtitle',
            'toc': 'doc-toc',
            'index': 'doc-index',
            'glossary': 'doc-glossary',
            'bibliography': 'doc-bibliography',
            'preface': 'doc-preface',
            'introduction': 'doc-introduction',
            'conclusion': 'doc-conclusion',
            'appendix': 'doc-appendix',
            'abstract': 'doc-abstract',
            'footnote': 'doc-footnote',
            'endnote': 'doc-endnote',
        }

        return mappings.get(invalid_role.lower())

    def _fix_xml_characters(self, extract_dir: str) -> bool:
        """
        Fix invalid XML characters

        Args:
            extract_dir: Extracted EPUB directory

        Returns:
            True if any fixes were made
        """
        fixed = False

        # Invalid XML characters regex
        # Unicode: 0x0-0x8, 0xB-0xC, 0xE-0x1F (except 0x9, 0xA, 0xD)
        invalid_chars = re.compile(r'[\x00-\x08\x0B\x0C\x0E-\x1F]')

        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                if file.endswith(('.xhtml', '.html', '.xml', '.opf', '.ncx')):
                    file_path = os.path.join(root, file)

                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()

                        # Remove invalid characters
                        new_content = invalid_chars.sub('', content)

                        if new_content != content:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(new_content)
                            fixed = True
                            logger.debug(f"Fixed XML characters in {file}")

                    except Exception as e:
                        logger.warning(f"Error fixing XML in {file}: {e}")

        return fixed

    def _fix_missing_files(self, extract_dir: str, error: ValidationError) -> bool:
        """
        Fix missing file errors (PKG-021) by removing references

        Args:
            extract_dir: Extracted EPUB directory
            error: Validation error

        Returns:
            True if fixed
        """
        # PKG-021 errors are similar to RSC-007, use the same logic
        return self._fix_missing_resources(extract_dir, error)

    def _fix_missing_resources(self, extract_dir: str, error: ValidationError) -> bool:
        """
        Fix missing resource errors (fonts, images, etc.)

        Args:
            extract_dir: Extracted EPUB directory
            error: Validation error

        Returns:
            True if fixed
        """
        fixed = False

        try:
            # Determine resource type from error message
            error_msg = error.message.lower()

            # Fix missing fonts
            if 'font' in error_msg or error.location and 'fonts/' in error.location:
                logger.info("Fixing missing font resources...")
                fixed = self._fix_missing_fonts(extract_dir, error)

            # Fix missing images
            elif 'image' in error_msg or error.location and 'images/' in error.location:
                logger.info("Fixing missing image references...")
                fixed = self._fix_missing_images(extract_dir, error)

            # Generic missing file
            else:
                logger.debug(f"Attempting to fix missing resource: {error.location}")
                # Try to remove references to missing file
                fixed = self._remove_resource_references(extract_dir, error.location)

        except Exception as e:
            logger.warning(f"Error fixing missing resources: {e}")

        return fixed

    def _fix_missing_fonts(self, extract_dir: str, error: ValidationError) -> bool:
        """
        Fix missing font errors by removing @font-face rules or replacing with generic fonts

        Args:
            extract_dir: Extracted EPUB directory
            error: Validation error

        Returns:
            True if fixed
        """
        fixed = False

        # Find CSS files
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                if file.endswith('.css'):
                    file_path = os.path.join(root, file)

                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()

                        original_content = content

                        # Remove @font-face rules that reference missing fonts
                        # Pattern: @font-face { ... src: url(...) ... }
                        import re
                        font_face_pattern = re.compile(
                            r'@font-face\s*\{[^}]*?\}',
                            re.DOTALL | re.IGNORECASE
                        )

                        def check_and_remove_font_face(match):
                            nonlocal fixed
                            font_face_rule = match.group(0)

                            # Extract font file references
                            url_pattern = re.compile(r'url\([\'"]?\.\./(fonts/[^\'")\s]+)[\'"]?\)')
                            urls = url_pattern.findall(font_face_rule)

                            for url in urls:
                                # Check if font file exists
                                font_path = os.path.join(extract_dir, 'OEBPS', url)
                                if not os.path.exists(font_path):
                                    logger.debug(f"Removing @font-face rule for missing font: {url}")
                                    fixed = True
                                    return ''  # Remove the entire @font-face rule

                            return match.group(0)  # Keep if font exists

                        content = font_face_pattern.sub(check_and_remove_font_face, content)

                        # Also replace font-family references to custom fonts with generic ones
                        if fixed:
                            # Replace CustomFont with generic serif
                            content = re.sub(
                                r'font-family:\s*[\'"]?CustomFont[\'"]?',
                                'font-family: serif',
                                content,
                                flags=re.IGNORECASE
                            )

                        # Write back if changed
                        if content != original_content:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(content)
                            logger.debug(f"Fixed font references in {file}")

                    except Exception as e:
                        logger.warning(f"Error fixing fonts in {file}: {e}")

        return fixed

    def _fix_missing_images(self, extract_dir: str, error: ValidationError) -> bool:
        """
        Fix missing image references by removing img tags or creating placeholder

        Args:
            extract_dir: Extracted EPUB directory
            error: Validation error

        Returns:
            True if fixed
        """
        fixed = False

        # Extract missing image path from error
        missing_image = None
        if error.location:
            import re
            match = re.search(r'images/([^\s\'"]+)', error.location)
            if match:
                missing_image = match.group(1)

        if not missing_image:
            return False

        # Find XHTML files and remove references
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                if file.endswith('.xhtml') or file.endswith('.html'):
                    file_path = os.path.join(root, file)

                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()

                        original_content = content

                        # Remove img tags referencing missing image
                        import re
                        pattern = re.compile(
                            rf'<img[^>]*src=[\'"]?[^\'"]*{re.escape(missing_image)}[\'"]?[^>]*/?>',
                            re.IGNORECASE
                        )
                        content = pattern.sub('<!-- Image removed: missing file -->', content)

                        # Remove figure tags containing missing images
                        figure_pattern = re.compile(
                            rf'<figure[^>]*>.*?{re.escape(missing_image)}.*?</figure>',
                            re.DOTALL | re.IGNORECASE
                        )
                        content = figure_pattern.sub('', content)

                        if content != original_content:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(content)
                            logger.debug(f"Removed missing image references in {file}")
                            fixed = True

                    except Exception as e:
                        logger.warning(f"Error fixing images in {file}: {e}")

        return fixed

    def _remove_resource_references(self, extract_dir: str, resource_path: Optional[str]) -> bool:
        """
        Remove references to missing resources from manifest

        Args:
            extract_dir: Extracted EPUB directory
            resource_path: Path to missing resource

        Returns:
            True if fixed
        """
        if not resource_path:
            return False

        fixed = False

        # Find and update content.opf
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                if file == 'content.opf' or file.endswith('.opf'):
                    file_path = os.path.join(root, file)

                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()

                        original_content = content

                        # Remove manifest item referencing missing resource
                        import re
                        # Extract just the filename from the path
                        filename = os.path.basename(resource_path)
                        pattern = re.compile(
                            rf'<item[^>]*href=[\'"]?[^\'"]*{re.escape(filename)}[\'"]?[^>]*/?>',
                            re.IGNORECASE
                        )
                        content = pattern.sub('', content)

                        if content != original_content:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(content)
                            logger.debug(f"Removed manifest entry for missing resource: {filename}")
                            fixed = True

                    except Exception as e:
                        logger.warning(f"Error updating manifest: {e}")

        return fixed

    def _repackage_epub(self, extract_dir: str, output_path: str):
        """
        Repackage extracted EPUB directory

        Args:
            extract_dir: Extracted directory
            output_path: Output EPUB path
        """
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Add mimetype first (uncompressed)
            mimetype_path = os.path.join(extract_dir, 'mimetype')
            if os.path.exists(mimetype_path):
                zf.write(mimetype_path, 'mimetype', compress_type=zipfile.ZIP_STORED)

            # Add all other files
            for root, dirs, files in os.walk(extract_dir):
                for file in files:
                    if file == 'mimetype':
                        continue

                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, extract_dir)
                    zf.write(file_path, arcname)

    def _validate_xml_syntax(self, xml_content: bytes) -> bool:
        """Validate XML syntax"""
        try:
            ET.fromstring(xml_content)
            return True
        except ET.ParseError:
            return False

    def _extract_opf_path(self, container_xml: bytes) -> Optional[str]:
        """Extract OPF file path from container.xml"""
        try:
            root = ET.fromstring(container_xml)
            rootfile = root.find('.//{*}rootfile')
            if rootfile is not None:
                return rootfile.get('full-path')
        except Exception:
            pass
        return None


# Utility functions
def validate_epub(epub_path: str) -> ValidationResult:
    """
    Convenience function to validate EPUB

    Args:
        epub_path: Path to EPUB file

    Returns:
        ValidationResult
    """
    validator = EPUBValidator()
    return validator.validate(epub_path)


def auto_fix_epub(epub_path: str) -> Tuple[str, ValidationResult]:
    """
    Convenience function to auto-fix EPUB

    Args:
        epub_path: Path to EPUB file

    Returns:
        Tuple of (fixed_path, validation_result)
    """
    validator = EPUBValidator()
    result = validator.validate(epub_path)

    if not result.is_valid and result.fixable_count > 0:
        return validator.auto_fix(epub_path, result)

    return epub_path, result


# CLI
if __name__ == '__main__':
    import sys

    logging.basicConfig(level=logging.INFO)

    if len(sys.argv) < 2:
        print("Usage: python validator.py <epub_file> [--fix]")
        sys.exit(1)

    epub_file = sys.argv[1]
    auto_fix_flag = '--fix' in sys.argv

    validator = EPUBValidator()
    result = validator.validate(epub_file)

    # Print results
    print("\n" + "="*60)
    print("EPUB Validation Report")
    print("="*60)
    print(f"File: {epub_file}")
    print(f"Valid: {'✓ YES' if result.is_valid else '✗ NO'}")
    print(f"Fatal: {result.fatal_count}")
    print(f"Errors: {result.error_count}")
    print(f"Warnings: {result.warning_count}")
    print(f"Fixable: {result.fixable_count}")
    print("="*60)

    if not result.is_valid:
        print("\nErrors:")
        for error in result.errors[:10]:  # Show first 10
            print(f"  [{error.severity}] {error.code}: {error.message}")
            if error.location:
                print(f"      Location: {error.location}:{error.line or '?'}")
            if error.fixable:
                print(f"      ✓ Fixable")

    if auto_fix_flag and not result.is_valid and result.fixable_count > 0:
        print("\n" + "="*60)
        print("Attempting automatic fix...")
        print("="*60)

        fixed_path, new_result = validator.auto_fix(epub_file, result)

        print(f"\nFixed EPUB: {fixed_path}")
        print(f"New validation: {'✓ PASS' if new_result.is_valid else '✗ FAIL'}")
        print(f"Remaining errors: {new_result.error_count}")

    sys.exit(0 if result.is_valid else 1)
