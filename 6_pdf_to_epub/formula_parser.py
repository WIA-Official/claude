#!/usr/bin/env python3
"""
Formula Parser - Enhanced MathML Conversion Module
Detects and converts mathematical formulas to MathML with SVG/PNG fallback for EPUB 3.x
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple
import sympy
from sympy.parsing.latex import parse_latex
from sympy.printing.mathml import mathml
import io
import base64

logger = logging.getLogger(__name__)


class FormulaParser:
    """Enhanced parser for mathematical formulas with MathML and fallback conversion"""

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

    def __init__(self, enable_svg_fallback: bool = True, enable_png_fallback: bool = True):
        """
        Initialize the enhanced formula parser

        Args:
            enable_svg_fallback: Enable SVG fallback generation
            enable_png_fallback: Enable PNG fallback generation
        """
        self.compiled_patterns = [re.compile(p, re.DOTALL) for p in self.MATH_PATTERNS]
        self.math_indicators = re.compile('|'.join(self.MATH_INDICATORS))
        self.enable_svg_fallback = enable_svg_fallback
        self.enable_png_fallback = enable_png_fallback

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
            List of content blocks with text and MathML formulas (with fallbacks)
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
                is_display = '$$' in match.group(0) or '\\[' in match.group(0) or 'equation' in match.group(0)

                # Convert to MathML with fallbacks
                mathml_formula = self.latex_to_mathml(latex_formula)
                svg_fallback = None
                png_fallback = None

                # Generate SVG fallback
                if self.enable_svg_fallback:
                    svg_fallback = self.mathml_to_svg(mathml_formula, latex_formula)

                # Generate PNG fallback
                if self.enable_png_fallback:
                    png_fallback = self.latex_to_png(latex_formula)

                blocks.append({
                    'type': 'formula',
                    'latex': latex_formula,
                    'mathml': mathml_formula,
                    'svg': svg_fallback,
                    'png': png_fallback,
                    'display': is_display
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

                # Ensure proper namespace
                if 'xmlns=' not in mathml_output:
                    mathml_output = mathml_output.replace(
                        '<math>',
                        '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">'
                    )

                return mathml_output
            except Exception as sympy_error:
                logger.debug(f"SymPy parsing failed, using fallback: {sympy_error}")
                # Fallback to manual conversion
                return self._manual_latex_to_mathml(latex)

        except Exception as e:
            logger.warning(f"Failed to convert LaTeX to MathML: {e}")
            # Return a basic MathML wrapper with the original LaTeX
            return self._create_fallback_mathml(latex)

    def mathml_to_svg(self, mathml: str, latex: str = '') -> Optional[str]:
        """
        Convert MathML to SVG for fallback support

        Args:
            mathml: MathML string
            latex: Original LaTeX (for fallback)

        Returns:
            SVG representation or None if conversion fails
        """
        try:
            # Simple SVG generation using text rendering
            # This is a simplified approach - for production, use a proper rendering library

            # Extract the formula content for simple rendering
            formula_text = latex if latex else self._extract_mathml_text(mathml)

            # Generate SVG with basic text rendering
            svg = self._generate_simple_svg(formula_text)
            return svg

        except Exception as e:
            logger.warning(f"Failed to convert MathML to SVG: {e}")
            return None

    def latex_to_png(self, latex: str) -> Optional[bytes]:
        """
        Convert LaTeX formula to PNG image for maximum compatibility fallback

        Args:
            latex: LaTeX formula string

        Returns:
            PNG image bytes or None if conversion fails
        """
        try:
            # This requires matplotlib - optional dependency
            try:
                import matplotlib
                matplotlib.use('Agg')  # Non-interactive backend
                import matplotlib.pyplot as plt
                from matplotlib import mathtext

                # Create figure
                fig = plt.figure(figsize=(6, 1))
                fig.patch.set_facecolor('white')

                # Render formula
                plt.text(0.5, 0.5, f'${latex}$',
                        fontsize=20,
                        ha='center',
                        va='center',
                        transform=fig.transFigure)

                plt.axis('off')

                # Save to bytes
                buf = io.BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight',
                           dpi=150, transparent=False, facecolor='white')
                plt.close(fig)

                buf.seek(0)
                return buf.read()

            except ImportError:
                logger.debug("matplotlib not available for PNG rendering")
                return None

        except Exception as e:
            logger.warning(f"Failed to convert LaTeX to PNG: {e}")
            return None

    def _generate_simple_svg(self, text: str) -> str:
        """
        Generate a simple SVG representation of a formula

        Args:
            text: Formula text

        Returns:
            SVG string
        """
        # Escape XML special characters
        text = self._escape_xml(text)

        # Calculate approximate dimensions
        width = max(200, len(text) * 12)
        height = 50

        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="100%" height="100%" fill="white"/>
  <text x="{width/2}" y="{height/2}"
        font-family="serif"
        font-size="18"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="black">
    {text}
  </text>
</svg>'''
        return svg

    def _extract_mathml_text(self, mathml: str) -> str:
        """
        Extract text content from MathML for SVG rendering

        Args:
            mathml: MathML string

        Returns:
            Extracted text
        """
        # Simple text extraction - remove all tags
        import re
        text = re.sub(r'<[^>]+>', '', mathml)
        return text.strip()

    def _manual_latex_to_mathml(self, latex: str) -> str:
        """
        Manual conversion of simple LaTeX to MathML (fallback)

        Args:
            latex: LaTeX formula string

        Returns:
            MathML representation
        """
        # This is a simplified converter for common patterns
        mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">\n'

        # Handle simple patterns
        content = self._convert_latex_to_mathml_content(latex)

        mathml += f'  <mrow>\n{content}\n  </mrow>\n'
        mathml += '</math>'

        return mathml

    def _convert_latex_to_mathml_content(self, latex: str) -> str:
        """
        Convert LaTeX content to MathML elements

        Args:
            latex: LaTeX string

        Returns:
            MathML content
        """
        result = latex

        # Replace fractions
        result = re.sub(
            r'\\frac\{([^}]+)\}\{([^}]+)\}',
            lambda m: f'<mfrac><mrow>{m.group(1)}</mrow><mrow>{m.group(2)}</mrow></mfrac>',
            result
        )

        # Replace square roots
        result = re.sub(
            r'\\sqrt\{([^}]+)\}',
            lambda m: f'<msqrt><mrow>{m.group(1)}</mrow></msqrt>',
            result
        )

        # Replace superscripts
        result = re.sub(
            r'\^(\{[^}]+\}|[0-9a-zA-Z])',
            lambda m: f'<msup><mrow></mrow><mrow>{m.group(1).strip("{}")}</mrow></msup>',
            result
        )

        # Replace subscripts
        result = re.sub(
            r'_(\{[^}]+\}|[0-9a-zA-Z])',
            lambda m: f'<msub><mrow></mrow><mrow>{m.group(1).strip("{}")}</mrow></msub>',
            result
        )

        # Wrap remaining characters
        parts = []
        i = 0
        while i < len(result):
            if result[i] == '<':
                # Find end of tag
                end = result.find('>', i)
                if end != -1:
                    parts.append(result[i:end+1])
                    i = end + 1
                else:
                    parts.append(result[i])
                    i += 1
            elif result[i].isdigit():
                parts.append(f'<mn>{result[i]}</mn>')
                i += 1
            elif result[i].isalpha():
                parts.append(f'<mi>{result[i]}</mi>')
                i += 1
            elif result[i] in '+-=*/()[]':
                parts.append(f'<mo>{result[i]}</mo>')
                i += 1
            elif result[i].isspace():
                i += 1
            else:
                parts.append(result[i])
                i += 1

        return '    ' + ''.join(parts)

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
        if not text:
            return ''
        text = str(text)
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


def latex_to_mathml_with_fallback(latex: str) -> Tuple[str, Optional[str], Optional[bytes]]:
    """
    Convert LaTeX to MathML with SVG and PNG fallbacks

    Args:
        latex: LaTeX formula string

    Returns:
        Tuple of (mathml, svg, png_bytes)
    """
    parser = FormulaParser(enable_svg_fallback=True, enable_png_fallback=True)
    mathml = parser.latex_to_mathml(latex)
    svg = parser.mathml_to_svg(mathml, latex)
    png = parser.latex_to_png(latex)
    return mathml, svg, png


def extract_and_convert_formulas(text: str) -> List[Dict[str, Any]]:
    """
    Convenience function to extract and convert formulas from text

    Args:
        text: Text containing formulas

    Returns:
        List of content blocks with MathML and fallbacks
    """
    parser = FormulaParser(enable_svg_fallback=True, enable_png_fallback=True)
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

    parser = FormulaParser(enable_svg_fallback=True, enable_png_fallback=True)

    for i, test in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"Test {i}:")
        print(f"Input: {test}")
        print(f"Contains formula: {parser.contains_formula(test)}")

        blocks = parser.extract_formulas(test)
        for block in blocks:
            print(f"\n  Type: {block['type']}")
            if block['type'] == 'formula':
                print(f"  LaTeX: {block['latex']}")
                print(f"  MathML: {block['mathml'][:150]}...")
                if block.get('svg'):
                    print(f"  SVG: Generated ({len(block['svg'])} bytes)")
                if block.get('png'):
                    print(f"  PNG: Generated ({len(block['png'])} bytes)")
            else:
                print(f"  Content: {block['content']}")

    print(f"\n{'='*60}")
    print("✓ Formula parser enhanced with MathML, SVG, and PNG fallback support")
