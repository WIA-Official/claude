#!/usr/bin/env python3
"""
EPUB Checker Web Service
Flask web application for EPUB validation with bilingual (Korean/English) support
"""

import os
import logging
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from flask import Flask, request, render_template, jsonify, send_file, redirect, url_for, session
from werkzeug.utils import secure_filename

from checker import EPUBChecker, check_epub_file
from error_guide import ErrorGuide

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'epub-checker-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 30 * 1024 * 1024  # 30MB max file size

# Configuration
UPLOAD_FOLDER = Path(__file__).parent / 'uploads'
RESULTS_FOLDER = Path(__file__).parent / 'results'
ALLOWED_EXTENSIONS = {'epub'}

# Create directories
UPLOAD_FOLDER.mkdir(exist_ok=True)
RESULTS_FOLDER.mkdir(exist_ok=True)

# Initialize checker
checker = EPUBChecker()


def allowed_file(filename: str) -> bool:
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def cleanup_old_files(max_age_hours: int = 24):
    """
    Clean up files older than specified hours

    Args:
        max_age_hours: Maximum file age in hours
    """
    cutoff_time = datetime.now() - timedelta(hours=max_age_hours)

    for folder in [UPLOAD_FOLDER, RESULTS_FOLDER]:
        for file_path in folder.glob('*'):
            if file_path.is_file():
                file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                if file_time < cutoff_time:
                    try:
                        file_path.unlink()
                        logger.info(f"Cleaned up old file: {file_path.name}")
                    except Exception as e:
                        logger.warning(f"Failed to delete {file_path}: {e}")


@app.route('/')
def index():
    """Main page - EPUB upload interface"""
    # Get language from session or default to Korean
    language = session.get('language', 'ko')
    return render_template('index.html', language=language)


@app.route('/set_language/<lang>')
def set_language(lang):
    """Set user language preference"""
    if lang in ['ko', 'en']:
        session['language'] = lang
    return redirect(request.referrer or url_for('index'))


@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Handle EPUB file upload and validation

    Returns:
        JSON response with validation results or redirect to result page
    """
    language = session.get('language', 'ko')

    # Check if file was uploaded
    if 'file' not in request.files:
        if language == 'ko':
            return jsonify({'error': '파일이 선택되지 않았습니다.'}), 400
        else:
            return jsonify({'error': 'No file selected'}), 400

    file = request.files['file']

    # Check if filename is empty
    if file.filename == '':
        if language == 'ko':
            return jsonify({'error': '파일 이름이 비어있습니다.'}), 400
        else:
            return jsonify({'error': 'Empty filename'}), 400

    # Validate file extension
    if not allowed_file(file.filename):
        if language == 'ko':
            return jsonify({'error': 'EPUB 파일만 업로드 가능합니다.'}), 400
        else:
            return jsonify({'error': 'Only EPUB files are allowed'}), 400

    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        upload_path = UPLOAD_FOLDER / f"{file_id}_{filename}"

        # Save file
        file.save(str(upload_path))
        logger.info(f"File uploaded: {upload_path.name}")

        # Perform validation
        logger.info(f"Starting validation for {filename}")
        report = check_epub_file(str(upload_path), language)

        # Add file_id to report
        report['file_id'] = file_id
        report['original_filename'] = filename
        report['upload_time'] = datetime.now().isoformat()

        # Clean up old files
        cleanup_old_files()

        # Return JSON for AJAX or redirect for form submission
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify(report)
        else:
            # Store report in session for redirect
            session['last_report'] = report
            return redirect(url_for('result', file_id=file_id))

    except Exception as e:
        logger.error(f"Error processing file: {e}")
        if language == 'ko':
            error_msg = f'파일 처리 중 오류가 발생했습니다: {str(e)}'
        else:
            error_msg = f'Error processing file: {str(e)}'
        return jsonify({'error': error_msg}), 500


@app.route('/result/<file_id>')
def result(file_id):
    """
    Display validation results

    Args:
        file_id: Unique file identifier

    Returns:
        Rendered result page
    """
    language = session.get('language', 'ko')

    # Try to get report from session
    report = session.get('last_report')

    if not report or report.get('file_id') != file_id:
        # Report not in session, check if we can regenerate
        uploaded_files = list(UPLOAD_FOLDER.glob(f"{file_id}_*"))

        if uploaded_files:
            epub_path = uploaded_files[0]
            report = check_epub_file(str(epub_path), language)
            report['file_id'] = file_id
            report['original_filename'] = epub_path.name.replace(f"{file_id}_", "")
        else:
            # File not found
            if language == 'ko':
                return render_template('error.html', error='파일을 찾을 수 없습니다.', language=language), 404
            else:
                return render_template('error.html', error='File not found', language=language), 404

    # Get error guide for detailed info
    guide = ErrorGuide(language)

    return render_template('result.html', report=report, guide=guide, language=language)


@app.route('/api/check', methods=['POST'])
def api_check():
    """
    API endpoint for EPUB validation

    Returns:
        JSON validation report
    """
    language = request.args.get('lang', 'ko')

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. EPUB files only.'}), 400

    try:
        # Save temporary file
        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        temp_path = UPLOAD_FOLDER / f"{file_id}_{filename}"

        file.save(str(temp_path))

        # Validate
        report = check_epub_file(str(temp_path), language)
        report['file_id'] = file_id

        return jsonify(report)

    except Exception as e:
        logger.error(f"API error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/errors')
def api_errors():
    """
    Get all error codes with descriptions

    Returns:
        JSON error database
    """
    language = request.args.get('lang', 'ko')
    guide = ErrorGuide(language)
    return jsonify(guide.get_all_errors())


@app.route('/api/error/<error_code>')
def api_error_info(error_code):
    """
    Get detailed information for specific error code

    Args:
        error_code: Error code

    Returns:
        JSON error information
    """
    language = request.args.get('lang', 'ko')
    guide = ErrorGuide(language)
    info = guide.get_error_info(error_code)

    if info:
        return jsonify(info)
    else:
        return jsonify({'error': 'Error code not found'}), 404


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'EPUB Checker',
        'version': '1.0.0'
    })


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    language = session.get('language', 'ko')
    if language == 'ko':
        error = '파일 크기가 너무 큽니다 (최대 30MB)'
    else:
        error = 'File too large (max 30MB)'
    return jsonify({'error': error}), 413


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    language = session.get('language', 'ko')
    if language == 'ko':
        error = '페이지를 찾을 수 없습니다'
    else:
        error = 'Page not found'
    return render_template('error.html', error=error, language=language), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    language = session.get('language', 'ko')
    if language == 'ko':
        error = '서버 오류가 발생했습니다'
    else:
        error = 'Internal server error'
    logger.error(f"Internal error: {e}")
    return render_template('error.html', error=error, language=language), 500


# CLI for running the app
if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='EPUB Checker Web Service')
    parser.add_argument('--host', default='0.0.0.0', help='Host address')
    parser.add_argument('--port', type=int, default=5007, help='Port number')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')

    args = parser.parse_args()

    logger.info(f"Starting EPUB Checker on {args.host}:{args.port}")
    app.run(host=args.host, port=args.port, debug=args.debug)
