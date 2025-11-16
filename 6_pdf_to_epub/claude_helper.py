#!/usr/bin/env python3
"""
Claude API Helper for EPUB Auto-Fix
Uses Claude API to automatically fix EPUB validation errors
Achieves 648 errors → 0 errors goal with AI-powered fixes
"""

import anthropic
import os
import json
import re
import logging
from typing import Dict, List, Optional, Any, Tuple

logger = logging.getLogger(__name__)


class ClaudeEPUBFixer:
    """Claude API를 사용한 EPUB 자동 수정"""

    def __init__(self, api_key: str):
        """
        Initialize Claude EPUB Fixer

        Args:
            api_key: Claude API key
        """
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"
        self.total_tokens_used = 0
        self.total_cost_usd = 0.0

        # Pricing (per 1M tokens) - Claude Sonnet 4
        self.input_price_per_1m = 3.0  # $3 per 1M input tokens
        self.output_price_per_1m = 15.0  # $15 per 1M output tokens

        logger.info(f"ClaudeEPUBFixer initialized with model: {self.model}")

    def fix_aria_roles(self, xhtml_content: str, errors: List[Dict]) -> Tuple[str, Dict[str, Any]]:
        """
        ARIA role 오류 자동 수정

        Args:
            xhtml_content: 원본 XHTML
            errors: role 관련 오류 목록

        Returns:
            Tuple of (수정된 XHTML, 통계)
        """
        try:
            prompt = f"""You are an EPUB 3.x expert. Fix the ARIA role attributes in the following EPUB XHTML to comply with EPUB 3.x standards.

Validation Errors:
{json.dumps(errors, indent=2, ensure_ascii=False)}

Original XHTML:
```xml
{xhtml_content}
```

Requirements:
1. Replace invalid role values with standard EPUB 3.x roles (doc-chapter, doc-subtitle, heading, etc.)
2. Convert numeric roles (role="01", role="02") to appropriate semantic roles
3. Preserve XML structure exactly
4. Output ONLY the fixed XHTML with no comments or explanations

Fixed XHTML:"""

            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[{"role": "user", "content": prompt}]
            )

            # Track usage
            usage = self._track_usage(message.usage)

            fixed_content = self._extract_code(message.content)

            return fixed_content, usage

        except Exception as e:
            logger.error(f"Error in fix_aria_roles: {e}")
            return xhtml_content, {'error': str(e)}

    def fix_xml_characters(self, xhtml_content: str) -> Tuple[str, Dict[str, Any]]:
        """
        잘못된 XML 문자 제거/수정

        Args:
            xhtml_content: 원본 XHTML

        Returns:
            Tuple of (수정된 XHTML, 통계)
        """
        try:
            prompt = f"""You are an EPUB 3.x expert. Remove/fix invalid XML characters from the following EPUB XHTML.

Original XHTML:
```xml
{xhtml_content}
```

Requirements:
1. Remove Unicode control characters (0x00-0x1F except 0x09, 0x0A, 0x0D)
2. Fix invalid entities
3. Preserve XML structure
4. Output ONLY the cleaned XHTML with no comments or explanations

Cleaned XHTML:"""

            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[{"role": "user", "content": prompt}]
            )

            usage = self._track_usage(message.usage)
            fixed_content = self._extract_code(message.content)

            return fixed_content, usage

        except Exception as e:
            logger.error(f"Error in fix_xml_characters: {e}")
            return xhtml_content, {'error': str(e)}

    def optimize_content_opf(self, content_opf: str, validation_errors: List[Dict]) -> Tuple[str, Dict[str, Any]]:
        """
        content.opf 최적화

        Args:
            content_opf: 원본 content.opf
            validation_errors: 검증 오류 목록

        Returns:
            Tuple of (최적화된 content.opf, 통계)
        """
        try:
            # Limit errors to first 30 for context
            errors_summary = validation_errors[:30]

            prompt = f"""You are an EPUB 3.x expert. Optimize the following EPUB content.opf to comply with EPUB 3.x standards.

Validation Errors (first 30):
{json.dumps(errors_summary, indent=2, ensure_ascii=False)}

Original content.opf:
```xml
{content_opf}
```

Requirements:
1. Ensure all resources are properly registered in manifest
2. Remove manifest entries for missing files
3. Comply with EPUB 3.x metadata standards
4. Optimize spine order
5. Fix any structural issues
6. Output ONLY the optimized content.opf with no comments or explanations

Optimized content.opf:"""

            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[{"role": "user", "content": prompt}]
            )

            usage = self._track_usage(message.usage)
            fixed_content = self._extract_code(message.content)

            return fixed_content, usage

        except Exception as e:
            logger.error(f"Error in optimize_content_opf: {e}")
            return content_opf, {'error': str(e)}

    def analyze_errors(self, errors: List[Dict]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        오류 분석 및 수정 전략 제안

        Args:
            errors: 검증 오류 목록

        Returns:
            Tuple of (수정 전략 JSON, 통계)
        """
        try:
            # Limit to first 50 errors for analysis
            errors_sample = errors[:50]

            prompt = f"""You are an EPUB 3.x expert. Analyze the following EPUB validation errors and provide a fix strategy.

Validation Errors (first 50):
{json.dumps(errors_sample, indent=2, ensure_ascii=False)}

Provide your analysis in JSON format:
{{
  "summary": {{
    "total_errors": number,
    "fixable_errors": number,
    "critical_errors": number,
    "priority_fixes": ["RSC-005", "RSC-016", ...]
  }},
  "strategies": [
    {{
      "error_code": "RSC-005",
      "description": "Description in Korean and English",
      "fix_method": "automatic/manual",
      "estimated_difficulty": "easy/medium/hard",
      "steps": ["Step 1", "Step 2"]
    }}
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}}

Analysis Result:"""

            message = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )

            usage = self._track_usage(message.usage)
            analysis = self._extract_json(message.content)

            return analysis, usage

        except Exception as e:
            logger.error(f"Error in analyze_errors: {e}")
            return {'error': str(e)}, {}

    def convert_latex_to_mathml(self, latex: str) -> Tuple[str, Dict[str, Any]]:
        """
        LaTeX 수식을 EPUB 3.x 호환 MathML로 변환

        Args:
            latex: LaTeX 수식

        Returns:
            Tuple of (MathML, 통계)
        """
        try:
            prompt = f"""You are a mathematical typesetting expert. Convert the following LaTeX formula to EPUB 3.x compatible MathML.

LaTeX:
{latex}

Requirements:
1. Comply with MathML 3.0 standard
2. EPUB reader compatibility
3. Properly distinguish display/inline math
4. Include alttext attribute for accessibility
5. Output ONLY the MathML with no comments or explanations

MathML:"""

            message = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            usage = self._track_usage(message.usage)
            mathml = self._extract_code(message.content)

            return mathml, usage

        except Exception as e:
            logger.error(f"Error in convert_latex_to_mathml: {e}")
            return f"<math><mtext>Error: {str(e)}</mtext></math>", {'error': str(e)}

    def fix_file_comprehensive(self, filename: str, content: str, errors: List[Dict]) -> Tuple[str, Dict[str, Any]]:
        """
        파일 종합 수정 (모든 오류 한번에 처리)

        Args:
            filename: 파일명
            content: 파일 내용
            errors: 이 파일과 관련된 오류들

        Returns:
            Tuple of (수정된 내용, 통계)
        """
        try:
            error_summary = [
                {
                    'code': e.get('code'),
                    'message': e.get('message'),
                    'line': e.get('line'),
                    'severity': e.get('severity')
                }
                for e in errors[:20]  # First 20 errors per file
            ]

            file_type = 'XHTML' if filename.endswith(('.xhtml', '.html')) else \
                       'OPF' if filename.endswith('.opf') else \
                       'XML'

            prompt = f"""You are an EPUB 3.x expert. Fix ALL validation errors in the following {file_type} file.

Filename: {filename}

Validation Errors:
{json.dumps(error_summary, indent=2, ensure_ascii=False)}

Original Content:
```xml
{content}
```

Requirements:
1. Fix ALL reported errors
2. Maintain EPUB 3.x compliance
3. Preserve content and structure
4. Use proper semantic markup
5. Ensure accessibility (ARIA roles, alt text)
6. Output ONLY the fixed content with no comments or explanations

Fixed Content:"""

            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[{"role": "user", "content": prompt}]
            )

            usage = self._track_usage(message.usage)
            fixed_content = self._extract_code(message.content)

            return fixed_content, usage

        except Exception as e:
            logger.error(f"Error in fix_file_comprehensive: {e}")
            return content, {'error': str(e)}

    def _extract_code(self, content: List) -> str:
        """Claude 응답에서 코드 블록 추출"""
        text = content[0].text if content else ""

        # Remove markdown code blocks
        if "```" in text:
            code_blocks = re.findall(r'```(?:xml|html|xhtml)?\s*\n(.*?)\n```', text, re.DOTALL)
            if code_blocks:
                return code_blocks[0].strip()

        # If no code blocks, return as-is (might be plain XML)
        return text.strip()

    def _extract_json(self, content: List) -> Dict:
        """Claude 응답에서 JSON 추출"""
        text = content[0].text if content else "{}"

        # Remove markdown code blocks
        if "```" in text:
            json_blocks = re.findall(r'```json\s*\n(.*?)\n```', text, re.DOTALL)
            if json_blocks:
                text = json_blocks[0]

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON: {e}")
            return {'error': 'JSON parse error', 'raw': text}

    def _track_usage(self, usage) -> Dict[str, Any]:
        """API 사용량 추적"""
        input_tokens = usage.input_tokens
        output_tokens = usage.output_tokens

        # Calculate cost
        input_cost = (input_tokens / 1_000_000) * self.input_price_per_1m
        output_cost = (output_tokens / 1_000_000) * self.output_price_per_1m
        total_cost = input_cost + output_cost

        # Update totals
        self.total_tokens_used += (input_tokens + output_tokens)
        self.total_cost_usd += total_cost

        return {
            'input_tokens': input_tokens,
            'output_tokens': output_tokens,
            'total_tokens': input_tokens + output_tokens,
            'cost_usd': round(total_cost, 4),
            'cumulative_tokens': self.total_tokens_used,
            'cumulative_cost_usd': round(self.total_cost_usd, 4)
        }

    def get_usage_stats(self) -> Dict[str, Any]:
        """전체 사용 통계 반환"""
        return {
            'total_tokens': self.total_tokens_used,
            'total_cost_usd': round(self.total_cost_usd, 4),
            'model': self.model
        }


# Convenience function
def get_claude_fixer(api_key: Optional[str] = None) -> ClaudeEPUBFixer:
    """
    Get ClaudeEPUBFixer instance

    Args:
        api_key: API key (또는 환경변수 ANTHROPIC_API_KEY)

    Returns:
        ClaudeEPUBFixer instance
    """
    if not api_key:
        api_key = os.environ.get('ANTHROPIC_API_KEY')

    if not api_key:
        raise ValueError("API key required. Set ANTHROPIC_API_KEY environment variable or pass api_key parameter.")

    return ClaudeEPUBFixer(api_key)


# Example usage
if __name__ == '__main__':
    import sys

    # Test with sample XHTML
    sample_xhtml = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Test Chapter</title>
</head>
<body>
  <section role="01">
    <h1 role="02">Chapter 1</h1>
    <p>This is a test paragraph with invalid role attributes.</p>
  </section>
</body>
</html>'''

    errors = [
        {'code': 'RSC-005', 'message': 'Invalid role value "01"', 'line': 8},
        {'code': 'RSC-005', 'message': 'Invalid role value "02"', 'line': 9}
    ]

    # Initialize fixer
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        sys.exit(1)

    fixer = ClaudeEPUBFixer(api_key)

    # Test ARIA role fixing
    print("Testing ARIA role fixing...")
    fixed_xhtml, usage = fixer.fix_aria_roles(sample_xhtml, errors)

    print("\nOriginal XHTML:")
    print(sample_xhtml)
    print("\nFixed XHTML:")
    print(fixed_xhtml)
    print("\nUsage:")
    print(json.dumps(usage, indent=2))

    print("\nTotal Usage Stats:")
    print(json.dumps(fixer.get_usage_stats(), indent=2))
