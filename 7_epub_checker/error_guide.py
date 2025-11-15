#!/usr/bin/env python3
"""
EPUB Error Guide - Bilingual (Korean/English)
Provides detailed error explanations and fix recommendations
"""

from typing import Dict, Any, Optional


class ErrorGuide:
    """Bilingual error guide for EPUB validation errors"""

    # Error code database with Korean and English descriptions
    ERROR_DATABASE = {
        'RSC-005': {
            'ko': {
                'title': '잘못된 ARIA role 속성',
                'description': 'HTML 요소에 유효하지 않은 ARIA role 값이 사용되었습니다.',
                'severity': '오류',
                'impact': '접근성 문제 - 스크린 리더가 문서 구조를 올바르게 읽지 못할 수 있습니다.',
                'fix': [
                    '유효한 ARIA role 값으로 변경하세요',
                    '예: role="doc-chapter", role="doc-subtitle", role="doc-toc"',
                    '숫자나 특수문자는 role 값으로 사용할 수 없습니다',
                    'EPUB 3.x 표준 ARIA role 목록을 참조하세요'
                ],
                'example': '<section role="doc-chapter"> (올바름)\n<section role="01"> (잘못됨)',
                'auto_fixable': True
            },
            'en': {
                'title': 'Invalid ARIA Role Attribute',
                'description': 'HTML elements contain invalid ARIA role values.',
                'severity': 'Error',
                'impact': 'Accessibility issue - Screen readers may not correctly interpret document structure.',
                'fix': [
                    'Change to valid ARIA role values',
                    'Examples: role="doc-chapter", role="doc-subtitle", role="doc-toc"',
                    'Numbers and special characters cannot be used as role values',
                    'Refer to EPUB 3.x standard ARIA roles'
                ],
                'example': '<section role="doc-chapter"> (correct)\n<section role="01"> (incorrect)',
                'auto_fixable': True
            }
        },

        'RSC-016': {
            'ko': {
                'title': '잘못된 XML 문자',
                'description': 'XML에서 허용되지 않는 제어 문자가 포함되어 있습니다.',
                'severity': '오류',
                'impact': 'EPUB 파일이 손상되어 일부 리더에서 열리지 않을 수 있습니다.',
                'fix': [
                    '잘못된 Unicode 문자 제거 (0x00-0x1F 범위)',
                    'NULL 문자(0x0) 및 기타 제어 문자 삭제',
                    'UTF-8 인코딩 확인',
                    '텍스트 편집기에서 특수 문자 검색 및 제거'
                ],
                'example': '유효한 텍스트만 포함\nNULL 문자 제거 필요',
                'auto_fixable': True
            },
            'en': {
                'title': 'Invalid XML Characters',
                'description': 'Contains control characters not allowed in XML.',
                'severity': 'Error',
                'impact': 'EPUB file may be corrupted and fail to open in some readers.',
                'fix': [
                    'Remove invalid Unicode characters (0x00-0x1F range)',
                    'Delete NULL characters (0x0) and other control characters',
                    'Verify UTF-8 encoding',
                    'Search and remove special characters in text editor'
                ],
                'example': 'Only valid text allowed\nNULL characters must be removed',
                'auto_fixable': True
            }
        },

        'PKG-021': {
            'ko': {
                'title': '누락된 파일',
                'description': 'manifest에 선언되었으나 실제로 존재하지 않는 파일이 있습니다.',
                'severity': '치명적 오류',
                'impact': 'EPUB 파일이 유효하지 않아 대부분의 리더에서 열리지 않습니다.',
                'fix': [
                    '누락된 이미지 파일을 EPUB에 추가',
                    '또는 manifest에서 해당 항목 제거',
                    '모든 리소스 파일 경로가 정확한지 확인',
                    'content.opf에서 <item> 태그 검토'
                ],
                'example': '<item id="img1" href="images/missing.png"/> ← 파일 추가 또는 항목 삭제',
                'auto_fixable': True
            },
            'en': {
                'title': 'Missing File',
                'description': 'File declared in manifest but does not actually exist.',
                'severity': 'Fatal Error',
                'impact': 'EPUB file is invalid and will not open in most readers.',
                'fix': [
                    'Add missing image file to EPUB',
                    'Or remove the entry from manifest',
                    'Verify all resource file paths are correct',
                    'Review <item> tags in content.opf'
                ],
                'example': '<item id="img1" href="images/missing.png"/> ← Add file or remove entry',
                'auto_fixable': True
            }
        },

        'RSC-007': {
            'ko': {
                'title': '참조된 리소스 누락',
                'description': 'CSS, XHTML 등에서 참조하는 파일이 존재하지 않습니다.',
                'severity': '오류',
                'impact': '이미지/폰트가 표시되지 않거나 스타일이 깨질 수 있습니다.',
                'fix': [
                    '누락된 폰트 파일을 fonts/ 폴더에 추가',
                    '또는 CSS에서 @font-face 규칙 제거',
                    '누락된 이미지를 images/ 폴더에 추가',
                    '또는 HTML에서 <img> 태그 제거',
                    '파일 경로 및 이름 대소문자 확인'
                ],
                'example': '@font-face { src: url("../fonts/missing.woff2"); } ← 폰트 추가 또는 규칙 삭제',
                'auto_fixable': True
            },
            'en': {
                'title': 'Referenced Resource Missing',
                'description': 'File referenced in CSS, XHTML, etc. does not exist.',
                'severity': 'Error',
                'impact': 'Images/fonts may not display or styles may be broken.',
                'fix': [
                    'Add missing font files to fonts/ folder',
                    'Or remove @font-face rule from CSS',
                    'Add missing images to images/ folder',
                    'Or remove <img> tag from HTML',
                    'Check file paths and case sensitivity'
                ],
                'example': '@font-face { src: url("../fonts/missing.woff2"); } ← Add font or remove rule',
                'auto_fixable': True
            }
        },

        'RSC-012': {
            'ko': {
                'title': 'Fragment Identifier 오류',
                'description': '앵커 링크가 존재하지 않는 ID를 참조합니다.',
                'severity': '오류',
                'impact': '목차나 내부 링크가 작동하지 않습니다.',
                'fix': [
                    '참조하는 ID가 실제로 존재하는지 확인',
                    'nav.xhtml의 TOC 링크 검토',
                    '대상 요소에 id 속성 추가',
                    '또는 잘못된 링크 제거'
                ],
                'example': '<a href="chapter1.xhtml#section1"> ← id="section1" 요소 필요',
                'auto_fixable': False
            },
            'en': {
                'title': 'Fragment Identifier Error',
                'description': 'Anchor link references non-existent ID.',
                'severity': 'Error',
                'impact': 'Table of contents or internal links will not work.',
                'fix': [
                    'Verify referenced ID actually exists',
                    'Review TOC links in nav.xhtml',
                    'Add id attribute to target element',
                    'Or remove invalid link'
                ],
                'example': '<a href="chapter1.xhtml#section1"> ← requires element with id="section1"',
                'auto_fixable': False
            }
        },

        'OPF-003': {
            'ko': {
                'title': 'OPF 파일 구조 오류',
                'description': 'content.opf 파일의 XML 구조가 올바르지 않습니다.',
                'severity': '치명적 오류',
                'impact': 'EPUB 파일이 완전히 손상되어 열리지 않습니다.',
                'fix': [
                    'content.opf의 XML 문법 검사',
                    '모든 태그가 올바르게 닫혔는지 확인',
                    'namespace 선언 확인',
                    'EPUB 3.x OPF 스키마 준수'
                ],
                'example': '<metadata>...</metadata> ← 모든 태그 올바르게 닫기',
                'auto_fixable': False
            },
            'en': {
                'title': 'OPF File Structure Error',
                'description': 'content.opf file has invalid XML structure.',
                'severity': 'Fatal Error',
                'impact': 'EPUB file is completely corrupted and will not open.',
                'fix': [
                    'Check XML syntax in content.opf',
                    'Verify all tags are properly closed',
                    'Check namespace declarations',
                    'Follow EPUB 3.x OPF schema'
                ],
                'example': '<metadata>...</metadata> ← Close all tags properly',
                'auto_fixable': False
            }
        },

        'HTM-014': {
            'ko': {
                'title': 'HTML 유효성 오류',
                'description': 'XHTML 파일에 HTML5 문법 오류가 있습니다.',
                'severity': '오류',
                'impact': '일부 EPUB 리더에서 표시가 깨지거나 오류가 발생합니다.',
                'fix': [
                    'HTML5 validator로 XHTML 파일 검증',
                    '닫히지 않은 태그 수정',
                    '중첩 오류 수정',
                    '필수 속성 추가'
                ],
                'example': '<img src="..." alt="..."/> ← img 태그는 alt 속성 필수',
                'auto_fixable': False
            },
            'en': {
                'title': 'HTML Validity Error',
                'description': 'XHTML file contains HTML5 syntax errors.',
                'severity': 'Error',
                'impact': 'Display may be broken or errors in some EPUB readers.',
                'fix': [
                    'Validate XHTML files with HTML5 validator',
                    'Fix unclosed tags',
                    'Fix nesting errors',
                    'Add required attributes'
                ],
                'example': '<img src="..." alt="..."/> ← img tag requires alt attribute',
                'auto_fixable': False
            }
        },

        'CSS-008': {
            'ko': {
                'title': 'CSS 구문 오류',
                'description': 'CSS 파일에 문법 오류가 있습니다.',
                'severity': '경고',
                'impact': '스타일이 적용되지 않거나 레이아웃이 깨질 수 있습니다.',
                'fix': [
                    'CSS validator로 문법 검사',
                    '세미콜론(;) 누락 확인',
                    '중괄호 { } 짝 맞추기',
                    '속성 이름/값 오타 수정'
                ],
                'example': 'p { color: blue; } ← 세미콜론 필수',
                'auto_fixable': False
            },
            'en': {
                'title': 'CSS Syntax Error',
                'description': 'CSS file contains syntax errors.',
                'severity': 'Warning',
                'impact': 'Styles may not apply or layout may be broken.',
                'fix': [
                    'Check syntax with CSS validator',
                    'Verify semicolons (;) not missing',
                    'Match curly braces { }',
                    'Fix property name/value typos'
                ],
                'example': 'p { color: blue; } ← semicolon required',
                'auto_fixable': False
            }
        }
    }

    def __init__(self, language: str = 'ko'):
        """
        Initialize error guide

        Args:
            language: Language code ('ko' or 'en')
        """
        self.language = language if language in ['ko', 'en'] else 'ko'

    def get_error_info(self, error_code: str) -> Optional[Dict[str, Any]]:
        """
        Get error information for given code

        Args:
            error_code: Error code (e.g., 'RSC-005')

        Returns:
            Error information dictionary or None if not found
        """
        if error_code in self.ERROR_DATABASE:
            return self.ERROR_DATABASE[error_code][self.language]
        return None

    def get_all_errors(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all error codes with current language

        Returns:
            Dictionary of all error codes and their info
        """
        return {
            code: info[self.language]
            for code, info in self.ERROR_DATABASE.items()
        }

    def format_error_message(self, error_code: str, location: Optional[str] = None) -> str:
        """
        Format a detailed error message

        Args:
            error_code: Error code
            location: File location (optional)

        Returns:
            Formatted error message
        """
        info = self.get_error_info(error_code)
        if not info:
            if self.language == 'ko':
                return f"알 수 없는 오류: {error_code}"
            else:
                return f"Unknown error: {error_code}"

        # Build message
        message = f"[{error_code}] {info['title']}\n"
        if location:
            loc_label = "위치" if self.language == 'ko' else "Location"
            message += f"{loc_label}: {location}\n"

        message += f"\n{info['description']}\n"

        # Add fix instructions
        fix_label = "수정 방법" if self.language == 'ko' else "How to Fix"
        message += f"\n{fix_label}:\n"
        for i, fix_step in enumerate(info['fix'], 1):
            message += f"  {i}. {fix_step}\n"

        # Add example
        if info.get('example'):
            example_label = "예시" if self.language == 'ko' else "Example"
            message += f"\n{example_label}:\n{info['example']}\n"

        return message

    def is_auto_fixable(self, error_code: str) -> bool:
        """
        Check if error is automatically fixable

        Args:
            error_code: Error code

        Returns:
            True if auto-fixable
        """
        info = self.get_error_info(error_code)
        if info:
            return info.get('auto_fixable', False)
        return False

    def get_severity_label(self, severity: str) -> str:
        """
        Get localized severity label

        Args:
            severity: Severity level (FATAL, ERROR, WARNING, INFO)

        Returns:
            Localized severity label
        """
        severity_map = {
            'ko': {
                'FATAL': '치명적',
                'ERROR': '오류',
                'WARNING': '경고',
                'INFO': '정보'
            },
            'en': {
                'FATAL': 'Fatal',
                'ERROR': 'Error',
                'WARNING': 'Warning',
                'INFO': 'Info'
            }
        }
        return severity_map[self.language].get(severity.upper(), severity)


# Utility function
def get_error_guide(language: str = 'ko') -> ErrorGuide:
    """
    Create an ErrorGuide instance

    Args:
        language: Language code ('ko' or 'en')

    Returns:
        ErrorGuide instance
    """
    return ErrorGuide(language)


# Example usage
if __name__ == '__main__':
    # Test Korean
    guide_ko = ErrorGuide('ko')
    print("=== 한국어 테스트 ===")
    print(guide_ko.format_error_message('RSC-005', 'chapter001.xhtml:42'))
    print("\n" + "="*60 + "\n")

    # Test English
    guide_en = ErrorGuide('en')
    print("=== English Test ===")
    print(guide_en.format_error_message('RSC-005', 'chapter001.xhtml:42'))
    print("\n" + "="*60 + "\n")

    # Test auto-fixable check
    print(f"RSC-005 auto-fixable: {guide_ko.is_auto_fixable('RSC-005')}")
    print(f"RSC-012 auto-fixable: {guide_ko.is_auto_fixable('RSC-012')}")
