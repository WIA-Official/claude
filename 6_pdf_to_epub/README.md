# PDF to EPUB 3.x Converter

Complete, production-ready system for converting PDF files to EPUB 3.x format with MathML support, formula conversion, and epubcheck validation.

## Features

- **EPUB 3.x Compliance**: Full support for EPUB 3.x standard
- **MathML Conversion**: Automatic detection and conversion of mathematical formulas
- **Formula Support**: LaTeX formula parsing and MathML generation
- **Image Handling**: Responsive image extraction and optimization
- **Validation**: Built-in epubcheck integration for 100% compliance
- **Web Interface**: Beautiful upload interface with real-time progress tracking
- **REST API**: RESTful API for programmatic conversion
- **Large Files**: Support for PDF files up to 30MB
- **Background Processing**: Asynchronous conversion with job tracking

## Architecture

```
6_pdf_to_epub/
├── pdf_to_epub.py      # Main conversion orchestrator
├── formula_parser.py   # MathML conversion module
├── epub_builder.py     # EPUB 3.x generation
├── validator.py        # epubcheck integration
├── web_api.py          # Flask web API and interface
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Installation

### Prerequisites

- Python 3.8 or higher
- Java Runtime Environment (JRE) 8+ for epubcheck
- pip (Python package manager)

### Setup

1. **Clone or download the project:**

```bash
cd 6_pdf_to_epub
```

2. **Install Python dependencies:**

```bash
pip install -r requirements.txt
```

3. **Download epubcheck (optional but recommended):**

```bash
# Download from: https://github.com/w3c/epubcheck/releases
# Example for version 5.1.0:
wget https://github.com/w3c/epubcheck/releases/download/v5.1.0/epubcheck-5.1.0.zip
unzip epubcheck-5.1.0.zip
mv epubcheck-5.1.0/epubcheck.jar ./epubcheck.jar
```

## Usage

### Command Line Interface

Convert a single PDF file:

```bash
python pdf_to_epub.py input.pdf
```

Specify output path:

```bash
python pdf_to_epub.py input.pdf -o output.epub
```

Enable verbose logging:

```bash
python pdf_to_epub.py input.pdf -v
```

Skip validation:

```bash
python pdf_to_epub.py input.pdf --no-validate
```

### Web Interface

1. **Start the web server:**

```bash
python web_api.py
```

2. **Open your browser:**

Navigate to `http://localhost:5000`

3. **Upload and convert:**

- Drag and drop your PDF file or click to browse
- Click "Convert to EPUB"
- Wait for conversion to complete
- Download your EPUB file

### REST API

**Upload and convert PDF:**

```bash
curl -X POST -F "file=@document.pdf" http://localhost:5000/api/convert
```

Response:
```json
{
  "job_id": "abc123...",
  "message": "Conversion started"
}
```

**Check conversion status:**

```bash
curl http://localhost:5000/api/status/abc123...
```

Response:
```json
{
  "job_id": "abc123...",
  "status": "completed",
  "message": "Conversion completed successfully",
  "progress": 100
}
```

**Download converted EPUB:**

```bash
curl -O -J http://localhost:5000/api/download/abc123...
```

**Health check:**

```bash
curl http://localhost:5000/api/health
```

### Python API

```python
from pdf_to_epub import PDFToEPUBConverter

# Create converter instance
converter = PDFToEPUBConverter('input.pdf', 'output.epub')

# Perform conversion
output_path = converter.convert()

# Get statistics
stats = converter.get_conversion_stats()
print(f"Converted {stats['num_pages']} pages")
```

## Configuration

### Environment Variables

- `PORT`: Web server port (default: 5000)
- `DEBUG`: Enable debug mode (default: False)
- `SECRET_KEY`: Flask secret key (default: auto-generated)

### File Size Limits

- Maximum upload size: 30MB
- Configurable in `web_api.py`: `app.config['MAX_CONTENT_LENGTH']`

### File Cleanup

- Uploaded and generated files are automatically deleted after 24 hours
- Cleanup runs hourly in the background

## Module Documentation

### pdf_to_epub.py

Main conversion orchestrator that coordinates the entire conversion process.

**Key Classes:**
- `PDFToEPUBConverter`: Main converter class

**Methods:**
- `extract_metadata()`: Extract PDF metadata
- `extract_content()`: Extract text, images, and formulas
- `convert()`: Perform complete conversion
- `get_conversion_stats()`: Get conversion statistics

### formula_parser.py

Detects and converts mathematical formulas to MathML.

**Key Classes:**
- `FormulaParser`: Formula detection and conversion

**Methods:**
- `contains_formula(text)`: Check if text contains formulas
- `extract_formulas(text)`: Extract and convert formulas
- `latex_to_mathml(latex)`: Convert LaTeX to MathML

**Supported Formula Formats:**
- LaTeX inline math: `$formula$`
- LaTeX display math: `$$formula$$`
- LaTeX environments: `\begin{equation}...\end{equation}`
- Unicode math symbols
- Common operators and Greek letters

### epub_builder.py

Builds EPUB 3.x compliant files with MathML support.

**Key Classes:**
- `EPUBBuilder`: EPUB file generator

**Methods:**
- `set_metadata(title, author, language)`: Set EPUB metadata
- `add_paragraph(text)`: Add text paragraph
- `add_heading(text, level)`: Add heading
- `add_formula(mathml)`: Add mathematical formula
- `add_image(data, filename)`: Add image
- `new_chapter(title)`: Start new chapter
- `build(output_path)`: Generate EPUB file

### validator.py

Validates EPUB files using epubcheck and custom validation.

**Key Classes:**
- `EPUBValidator`: EPUB validation

**Methods:**
- `validate(epub_path)`: Validate EPUB file
- `validate_mathml(epub_path)`: Validate MathML content
- `get_report()`: Get validation report

### web_api.py

Flask-based web application with REST API and upload interface.

**Endpoints:**
- `GET /`: Landing page with upload interface
- `POST /api/convert`: Upload and convert PDF
- `GET /api/status/<job_id>`: Check conversion status
- `GET /api/download/<job_id>`: Download converted EPUB
- `GET /api/health`: Health check

## Examples

### Example 1: Simple Text PDF

```python
from pdf_to_epub import PDFToEPUBConverter

converter = PDFToEPUBConverter('simple.pdf')
converter.convert()
```

### Example 2: PDF with Mathematical Formulas

```python
from pdf_to_epub import PDFToEPUBConverter

converter = PDFToEPUBConverter('math_paper.pdf', 'output.epub')
output = converter.convert()
print(f"Conversion complete: {output}")
```

### Example 3: Custom Formula Conversion

```python
from formula_parser import FormulaParser

parser = FormulaParser()
latex = r"E = mc^2"
mathml = parser.latex_to_mathml(latex)
print(mathml)
```

### Example 4: Build EPUB from Scratch

```python
from epub_builder import EPUBBuilder

builder = EPUBBuilder()
builder.set_metadata(
    title='My Book',
    author='John Doe',
    language='en'
)

builder.add_heading('Chapter 1', 1)
builder.add_paragraph('This is the first chapter.')

# Add a formula
mathml = '''<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow>
</math>'''
builder.add_formula(mathml)

builder.build('mybook.epub')
```

### Example 5: Validate Existing EPUB

```python
from validator import EPUBValidator

validator = EPUBValidator()
is_valid, errors = validator.validate('book.epub')

if is_valid:
    print("✓ EPUB is valid!")
else:
    print(f"✗ Found {len(errors)} errors:")
    for error in errors:
        print(f"  - {error}")
```

## Deployment

### Production Deployment

1. **Use a production WSGI server:**

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 web_api:app
```

2. **Configure Nginx reverse proxy:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 30M;
    }
}
```

3. **Set up systemd service:**

```ini
[Unit]
Description=PDF to EPUB Converter
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/6_pdf_to_epub
ExecStart=/usr/bin/gunicorn -w 4 -b 127.0.0.1:5000 web_api:app
Restart=always

[Install]
WantedBy=multi-user.target
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "web_api:app"]
```

Build and run:

```bash
docker build -t pdf-to-epub .
docker run -p 5000:5000 pdf-to-epub
```

## Testing

Run the validation script:

```bash
python validator.py sample.epub
```

Test formula parsing:

```bash
python formula_parser.py
```

Test EPUB building:

```bash
python epub_builder.py
```

## Troubleshooting

### Issue: "epubcheck not found"

**Solution:** Download epubcheck JAR file and place it in the project directory or specify its path.

### Issue: "Formula conversion fails"

**Solution:** Check if the LaTeX formula is valid. The parser supports common LaTeX commands but may not support all advanced features.

### Issue: "File size too large"

**Solution:** Increase `MAX_CONTENT_LENGTH` in `web_api.py` or compress the PDF before conversion.

### Issue: "EPUB validation fails"

**Solution:** Check the validation errors. Most common issues are:
- Missing metadata (title, author)
- Invalid XHTML
- Missing navigation document

## Performance

- Typical conversion time: 3-5 minutes for a 30MB PDF
- Memory usage: ~500MB for large PDFs
- Supports concurrent conversions via background threads

## Limitations

- Complex PDF layouts may not convert perfectly
- Some advanced LaTeX formulas may require manual adjustment
- Scanned PDFs (images of text) are not supported - use OCR first
- Tables are extracted as text, not as structured HTML tables

## Contributing

Contributions are welcome! Please ensure:

1. Code follows PEP 8 style guidelines
2. All functions have docstrings
3. Changes are tested before submission

## License

This project is provided as-is for educational and commercial use.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the code documentation
- Test with the provided examples

## Changelog

### Version 1.0.0 (2024)
- Initial release
- PDF to EPUB 3.x conversion
- MathML formula support
- Web interface with REST API
- epubcheck validation
- Background processing
- Automatic file cleanup

## Acknowledgments

- PyPDF2 for PDF processing
- SymPy for mathematical formula conversion
- Flask for web framework
- epubcheck for EPUB validation

## Technical Specifications

### EPUB 3.x Compliance

- EPUB version: 3.0
- Content documents: XHTML 5
- Navigation: Both NCX (EPUB 2 compat) and nav.xhtml (EPUB 3)
- MathML namespace: http://www.w3.org/1998/Math/MathML
- Package document: OPF 3.0

### Supported PDF Features

- Text extraction
- Image extraction (JPEG, PNG)
- Metadata (title, author, subject)
- Multiple pages
- Mathematical formulas (LaTeX)

### Generated EPUB Structure

```
output.epub
├── mimetype
├── META-INF/
│   └── container.xml
└── OEBPS/
    ├── content.opf
    ├── toc.ncx
    ├── nav.xhtml
    ├── styles/
    │   └── main.css
    ├── text/
    │   ├── chapter001.xhtml
    │   ├── chapter002.xhtml
    │   └── ...
    └── images/
        ├── image001.png
        └── ...
```

## Security Considerations

- File uploads are validated for type and size
- Files are stored with unique UUIDs
- Automatic cleanup prevents disk space exhaustion
- No shell command injection vulnerabilities
- Safe XML parsing without external entity expansion

## Future Enhancements

Potential improvements:
- Table structure preservation
- OCR support for scanned PDFs
- Additional formula formats
- Batch conversion
- Cloud storage integration
- Email notifications
- User authentication
- Payment integration
- Advanced styling options

---

**Built with Python 3 • Flask • PyPDF2 • SymPy**
