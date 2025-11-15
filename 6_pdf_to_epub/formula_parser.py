#!/usr/bin/env python3
"""
Formula Parser - MathML Conversion Module
Detects and converts mathematical formulas to MathML format for EPUB 3.x
"""

import re
import logging
from typing import List, Dict, Any, Optional
import sympy
from sympy.parsing.latex import parse_latex
from sympy.printing.mathml import mathml

logger = logging.getLogger(__name__)


class FormulaParser:
    """Parser for mathematical formulas with MathML conversion"""

    # Patterns to detect mathematical expressions
    MATH_PATTERNS = [
        r'\$\$(.+?)\$\$',  # LaTeX display math
        r'\$(.+?)\$',  # LaTeX inline math
        r'\\begin\{equation\}(.+?)\\end\{equation\}',  # LaTeX equation environment
        r'\\begin\{align\}(.+?)\\end\{align\}',  # LaTeX align environment
        r'\\begin\{math\}(.+?)\\end\{math\}',  # LaTeX math environment
        r'\\[(.*?)\\]',  # LaTeX display math alternative
        r'\\((.*?)\\)',  # LaTeX inline math alternative
    ]

    # Common mathematical operators and symbols
    MATH_INDICATORS = [
        r'[∫∑∏√∂∇∆±×÷≠≈≤≥∞]',  # Unicode math symbols
        r'\\frac\{',  # Fractions
        r'\\int',  # Integrals
        r'\\sum',  # Summations
        r'\\prod',  # Products
        r'\\sqrt',  # Square roots
        r'\\alpha|\\beta|\\gamma|\\delta|\\epsilon',  # Greek letters
        r'\^[0-9\{]',  # Superscripts
        r'_[0-9\{]',  # Subscripts
    ]

    def __init__(self):
        """Initialize the formula parser"""
        self.compiled_patterns = [re.compile(p, re.DOTALL) for p in self.MATH_PATTERNS]
        self.math_indicators = re.compile('|'.join(self.MATH_INDICATORS))

    def contains_formula(self, text: str) -> bool:
        """
        Check if text contains mathematical formulas

        Args:
            text: Text to check

        Returns:
            True if text contains formulas, False otherwise
        """
        # Check for explicit LaTeX markers
        for pattern in self.compiled_patterns:
            if pattern.search(text):
                return True

        # Check for mathematical indicators
        if self.math_indicators.search(text):
            return True

        # Check for patterns like "x = y", "f(x)", etc.
        simple_math = re.compile(r'\b[a-zA-Z]\([a-zA-Z0-9,\s]+\)|\b[a-zA-Z]\s*=\s*[0-9a-zA-Z]')
        if simple_math.search(text):
            return True

        return False

    def extract_formulas(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract and convert formulas from text

        Args:
            text: Text containing formulas

        Returns:
            List of content blocks with text and MathML formulas
        """
        blocks = []
        remaining_text = text
        last_end = 0

        # Try each pattern to find formulas
        for pattern in self.compiled_patterns:
            for match in pattern.finditer(text):
                # Add text before formula
                if match.start() > last_end:
                    text_before = text[last_end:match.start()].strip()
                    if text_before:
                        blocks.append({
                            'type': 'paragraph',
                            'content': text_before
                        })

                # Extract and convert formula
                latex_formula = match.group(1) if match.groups() else match.group(0)
                mathml_formula = self.latex_to_mathml(latex_formula)

                blocks.append({
                    'type': 'formula',
                    'latex': latex_formula,
                    'mathml': mathml_formula,
                    'display': '$$' in match.group(0) or '\\[' in match.group(0)
                })

                last_end = match.end()

        # Add remaining text
        if last_end < len(text):
            remaining = text[last_end:].strip()
            if remaining:
                blocks.append({
                    'type': 'paragraph',
                    'content': remaining
                })

        # If no formulas found but contains math indicators, treat as single paragraph
        if not blocks and self.contains_formula(text):
            blocks.append({
                'type': 'paragraph',
                'content': text
            })

        return blocks if blocks else [{'type': 'paragraph', 'content': text}]

    def latex_to_mathml(self, latex: str) -> str:
        """
        Convert LaTeX formula to MathML

        Args:
            latex: LaTeX formula string

        Returns:
            MathML representation of the formula
        """
        try:
            # Clean up LaTeX
            latex = latex.strip()

            # Remove common LaTeX delimiters
            latex = re.sub(r'^\$+|\$+$', '', latex)
            latex = re.sub(r'^\\[\[\(]|\\[\]\)]$', '', latex)

            # Try to parse with SymPy
            try:
                expr = parse_latex(latex)
                mathml_output = mathml(expr, printer='presentation')
                return mathml_output
            except Exception as sympy_error:
                logger.debug(f"SymPy parsing failed, using fallback: {sympy_error}")
                # Fallback to manual conversion
                return self._manual_latex_to_mathml(latex)

        except Exception as e:
            logger.warning(f"Failed to convert LaTeX to MathML: {e}")
            # Return a basic MathML wrapper with the original LaTeX
            return self._create_fallback_mathml(latex)

    def _manual_latex_to_mathml(self, latex: str) -> str:
        """
        Manual conversion of simple LaTeX to MathML (fallback)

        Args:
            latex: LaTeX formula string

        Returns:
            MathML representation
        """
        # This is a simplified converter for common patterns
        mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">'

        # Replace common LaTeX commands
        conversions = {
            r'\\frac\{([^}]+)\}\{([^}]+)\}': self._frac_to_mathml,
            r'\\sqrt\{([^}]+)\}': self._sqrt_to_mathml,
            r'\^(\{[^}]+\}|[0-9a-zA-Z])': self._sup_to_mathml,
            r'_(\{[^}]+\}|[0-9a-zA-Z])': self._sub_to_mathml,
        }

        result = latex
        for pattern, converter in conversions.items():
            result = re.sub(pattern, converter, result)

        # Wrap in <mrow>
        mathml += f'<mrow>{self._escape_text(result)}</mrow>'
        mathml += '</math>'

        return mathml

    def _frac_to_mathml(self, match) -> str:
        """Convert fraction to MathML"""
        num = match.group(1)
        den = match.group(2)
        return f'<mfrac><mrow>{num}</mrow><mrow>{den}</mrow></mfrac>'

    def _sqrt_to_mathml(self, match) -> str:
        """Convert square root to MathML"""
        content = match.group(1)
        return f'<msqrt><mrow>{content}</mrow></msqrt>'

    def _sup_to_mathml(self, match) -> str:
        """Convert superscript to MathML"""
        content = match.group(1).strip('{}')
        return f'<msup><mrow></mrow><mrow>{content}</mrow></msup>'

    def _sub_to_mathml(self, match) -> str:
        """Convert subscript to MathML"""
        content = match.group(1).strip('{}')
        return f'<msub><mrow></mrow><mrow>{content}</mrow></msub>'

    def _escape_text(self, text: str) -> str:
        """Escape special characters for MathML"""
        # Replace special characters
        text = text.replace('&', '&amp;')
        text = text.replace('<', '&lt;')
        text = text.replace('>', '&gt;')

        # Wrap individual characters in <mi> or <mn> tags
        result = []
        for char in text.split():
            if char.isdigit():
                result.append(f'<mn>{char}</mn>')
            elif char.isalpha():
                result.append(f'<mi>{char}</mi>')
            elif char in '+-=*/':
                result.append(f'<mo>{char}</mo>')
            else:
                result.append(char)

        return ''.join(result)

    def _create_fallback_mathml(self, latex: str) -> str:
        """
        Create a fallback MathML representation

        Args:
            latex: Original LaTeX string

        Returns:
            Basic MathML wrapper
        """
        return f'''<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
    <mrow>
        <mtext>{self._escape_xml(latex)}</mtext>
    </mrow>
</math>'''

    def _escape_xml(self, text: str) -> str:
        """Escape XML special characters"""
        text = text.replace('&', '&amp;')
        text = text.replace('<', '&lt;')
        text = text.replace('>', '&gt;')
        text = text.replace('"', '&quot;')
        text = text.replace("'", '&apos;')
        return text

    def validate_mathml(self, mathml: str) -> bool:
        """
        Validate MathML syntax

        Args:
            mathml: MathML string to validate

        Returns:
            True if valid, False otherwise
        """
        try:
            # Basic validation: check for required tags
            if not mathml.strip().startswith('<math'):
                return False
            if '</math>' not in mathml:
                return False

            # Check for proper namespace
            if 'xmlns="http://www.w3.org/1998/Math/MathML"' not in mathml:
                logger.warning("MathML missing proper namespace")

            return True

        except Exception as e:
            logger.error(f"MathML validation error: {e}")
            return False


# Utility functions for common conversions
def latex_to_mathml(latex: str) -> str:
    """
    Convenience function to convert LaTeX to MathML

    Args:
        latex: LaTeX formula string

    Returns:
        MathML representation
    """
    parser = FormulaParser()
    return parser.latex_to_mathml(latex)


def extract_and_convert_formulas(text: str) -> List[Dict[str, Any]]:
    """
    Convenience function to extract and convert formulas from text

    Args:
        text: Text containing formulas

    Returns:
        List of content blocks
    """
    parser = FormulaParser()
    return parser.extract_formulas(text)


# Example usage and testing
if __name__ == '__main__':
    # Set up logging
    logging.basicConfig(level=logging.DEBUG)

    # Test cases
    test_cases = [
        "The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$",
        "Einstein's equation: $$E = mc^2$$",
        "Integral: $\\int_0^\\infty e^{-x} dx = 1$",
        "Regular text without formulas",
        "Greek letters: $\\alpha, \\beta, \\gamma$"
    ]

    parser = FormulaParser()

    for i, test in enumerate(test_cases, 1):
        print(f"\nTest {i}:")
        print(f"Input: {test}")
        print(f"Contains formula: {parser.contains_formula(test)}")

        blocks = parser.extract_formulas(test)
        for block in blocks:
            print(f"  Type: {block['type']}")
            if block['type'] == 'formula':
                print(f"  LaTeX: {block['latex']}")
                print(f"  MathML: {block['mathml'][:100]}...")
            else:
                print(f"  Content: {block['content']}")
