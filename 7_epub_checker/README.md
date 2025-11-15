# EPUB Checker Web Service

Professional EPUB 3.x validation service with bilingual (Korean/English) support, detailed error analysis, and fix recommendations.

## Features

### Core Features
- **EPUB 3.x Validation**: epubcheck-based validation with comprehensive error detection
- **Bilingual Support**: Complete Korean and English interface and error messages
- **Detailed Error Analysis**: Error codes, locations, and severity levels
- **Fix Recommendations**: Step-by-step guides for resolving each error type
- **Auto-Fix Detection**: Identifies errors that can be automatically fixed
- **Material Design UI**: Beautiful, responsive interface with smooth animations
- **Drag & Drop Upload**: Easy file upload with drag-and-drop support
- **File Size Limit**: Supports EPUB files up to 30MB
- **Auto Cleanup**: Automatic deletion of files older than 24 hours

### Error Guide Database
Comprehensive error guides for common EPUB issues:
- RSC-005: Invalid ARIA roles
- RSC-016: Invalid XML characters
- PKG-021: Missing files
- RSC-007: Referenced resources missing
- RSC-012: Fragment identifier errors
- OPF-003: OPF file structure errors
- HTM-014: HTML validity errors
- CSS-008: CSS syntax errors

## Architecture

```
7_epub_checker/
├── app.py                 # Flask web application
├── checker.py             # EPUB validation logic
├── error_guide.py         # Bilingual error database
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   ├── index.html        # Upload page
│   ├── result.html       # Validation results page
│   └── error.html        # Error page
├── static/
│   ├── css/
│   │   └── style.css     # Material Design styles
│   └── js/
│       └── main.js       # Client-side interactions
├── uploads/              # Temporary uploaded files
└── results/              # Validation results storage
```

## Installation

### Prerequisites

1. **Python 3.8+**
2. **Java Runtime Environment** (for epubcheck)
3. **epubcheck JAR file** ([Download](https://github.com/w3c/epubcheck/releases))

### Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install epubcheck:**
   ```bash
   # Download epubcheck
   wget https://github.com/w3c/epubcheck/releases/download/v5.1.0/epubcheck-5.1.0.zip
   unzip epubcheck-5.1.0.zip

   # Place JAR in accessible location
   sudo mv epubcheck-5.1.0/epubcheck.jar /usr/local/bin/
   ```

3. **Create required directories:**
   ```bash
   mkdir -p uploads results
   chmod 755 uploads results
   ```

## Usage

### Running the Web Service

**Development mode:**
```bash
python app.py --debug
```

**Production mode:**
```bash
python app.py --host 0.0.0.0 --port 5007
```

**With custom settings:**
```bash
python app.py --host 127.0.0.1 --port 8080
```

The service will be available at `http://localhost:5007`

### API Endpoints

#### 1. Main Page
```
GET /
```
Upload interface for EPUB files

#### 2. Upload & Validate
```
POST /upload
Content-Type: multipart/form-data

Parameters:
  - file: EPUB file (max 30MB)

Returns: Redirect to result page or JSON response
```

#### 3. View Results
```
GET /result/<file_id>
```
Display validation results for uploaded file

#### 4. API Validation
```
POST /api/check?lang=ko
Content-Type: multipart/form-data

Parameters:
  - file: EPUB file
  - lang: Language (ko|en, default: ko)

Returns: JSON validation report
```

#### 5. Error Database
```
GET /api/errors?lang=ko

Returns: All error codes with descriptions
```

#### 6. Specific Error Info
```
GET /api/error/<error_code>?lang=ko

Returns: Detailed information for error code
```

#### 7. Health Check
```
GET /health

Returns: Service status
```

### API Response Example

```json
{
  "is_valid": false,
  "file_info": {
    "filename": "sample.epub",
    "title": "Sample Book",
    "creator": "John Doe",
    "size_mb": 2.5,
    "num_files": 42,
    "has_images": true,
    "has_fonts": false
  },
  "summary": {
    "total_errors": 5,
    "total_warnings": 2,
    "total_info": 1,
    "fixable_errors": 3
  },
  "errors": [
    {
      "code": "RSC-005",
      "severity": "ERROR",
      "message": "Invalid ARIA role value",
      "location": "chapter001.xhtml",
      "line": 42,
      "column": 15,
      "fixable": true
    }
  ]
}
```

## Using the Error Guide

### Python API

```python
from error_guide import ErrorGuide

# Create guide (Korean)
guide = ErrorGuide('ko')

# Get error information
info = guide.get_error_info('RSC-005')
print(info['title'])  # "잘못된 ARIA role 속성"
print(info['fix'])    # List of fix steps

# Format error message
message = guide.format_error_message('RSC-005', 'chapter001.xhtml:42')
print(message)

# Check if auto-fixable
is_fixable = guide.is_auto_fixable('RSC-005')  # True
```

### Web Interface

The error guide is automatically displayed on the results page with:
- Error title and description
- Impact explanation
- Step-by-step fix instructions
- Code examples
- Auto-fixable badge for supported errors

## Deployment

### Production Deployment with Gunicorn

1. **Install Gunicorn:**
   ```bash
   pip install gunicorn
   ```

2. **Run with Gunicorn:**
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5007 app:app
   ```

### Systemd Service

Create `/etc/systemd/system/epub-checker.service`:

```ini
[Unit]
Description=EPUB Checker Web Service
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/wiabooks/epub-checker
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/gunicorn -w 4 -b 0.0.0.0:5007 app:app

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable epub-checker
sudo systemctl start epub-checker
sudo systemctl status epub-checker
```

### Nginx Reverse Proxy

Add to Nginx configuration:

```nginx
location /epub-checker/ {
    proxy_pass http://localhost:5007/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    client_max_body_size 30M;
}
```

## Integration with PDF to EPUB Converter

This EPUB Checker integrates seamlessly with the PDF to EPUB converter:

1. Users validate their EPUB files
2. Checker identifies auto-fixable errors
3. CTA button redirects to PDF to EPUB converter
4. Converter automatically fixes errors using the same validation logic

**Shared Components:**
- `validator.py`: Core validation logic (imported from `6_pdf_to_epub/`)
- Error codes: Same error code system
- Auto-fix capability: Same fixable error detection

## Configuration

### Environment Variables

```bash
# Flask secret key
export SECRET_KEY="your-secret-key-here"

# epubcheck path
export EPUBCHECK_PATH="/usr/local/bin/epubcheck.jar"

# Max file size (bytes)
export MAX_CONTENT_LENGTH=31457280  # 30MB
```

### Application Settings

Edit `app.py` to customize:

```python
# File size limit
app.config['MAX_CONTENT_LENGTH'] = 30 * 1024 * 1024  # 30MB

# Upload folder
UPLOAD_FOLDER = Path(__file__).parent / 'uploads'

# Auto-cleanup age
cleanup_old_files(max_age_hours=24)  # Delete files older than 24 hours
```

## Troubleshooting

### epubcheck not found

**Error:** "epubcheck not found in common locations"

**Solution:**
1. Download epubcheck from [GitHub](https://github.com/w3c/epubcheck/releases)
2. Place JAR file in one of these locations:
   - `/usr/local/bin/epubcheck.jar`
   - `/opt/epubcheck/epubcheck.jar`
   - Or specify path in `app.py`

### File upload fails

**Error:** "File too large"

**Solution:**
- Check `MAX_CONTENT_LENGTH` in `app.py`
- If using Nginx, increase `client_max_body_size`

### Permission errors

**Error:** "Permission denied" when saving files

**Solution:**
```bash
chmod 755 uploads results
chown www-data:www-data uploads results
```

## Development

### Running Tests

```bash
# Test error guide
python error_guide.py

# Test checker
python checker.py sample.epub ko

# Test Flask app
python app.py --debug
```

### Adding New Error Codes

Edit `error_guide.py` and add to `ERROR_DATABASE`:

```python
'NEW-001': {
    'ko': {
        'title': '오류 제목',
        'description': '오류 설명',
        'severity': '오류',
        'impact': '영향',
        'fix': ['수정 방법 1', '수정 방법 2'],
        'example': '예시 코드',
        'auto_fixable': True
    },
    'en': {
        'title': 'Error Title',
        'description': 'Error description',
        'severity': 'Error',
        'impact': 'Impact',
        'fix': ['Fix step 1', 'Fix step 2'],
        'example': 'Example code',
        'auto_fixable': True
    }
}
```

## Support

For issues and questions:
- Check the troubleshooting section
- Review error guide documentation
- Test with sample EPUB files

## License

Copyright (c) 2024 WIA Books. All rights reserved.

## Changelog

### Version 1.0.0 (2024)
- Initial release
- EPUB 3.x validation with epubcheck
- Bilingual (Korean/English) support
- Material Design UI
- Error guide database with 8 common error types
- API endpoints for programmatic access
- Auto-cleanup functionality
- Integration with PDF to EPUB converter

## Acknowledgments

- epubcheck for EPUB validation
- Flask for web framework
- Material Design for UI guidelines
- Font Awesome / Material Icons for icons
