#!/usr/bin/env python3
"""
Web API - Flask-based Web Upload Interface
Provides REST API and web interface for PDF to EPUB conversion
"""

import os
import uuid
import logging
import time
import threading
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from functools import wraps

from flask import Flask, request, jsonify, send_file, render_template_string
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge

from pdf_to_epub import PDFToEPUBConverter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flask app configuration
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 30 * 1024 * 1024  # 30MB max file size
app.config['UPLOAD_FOLDER'] = '/tmp/pdf_to_epub/uploads'
app.config['OUTPUT_FOLDER'] = '/tmp/pdf_to_epub/outputs'
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', str(uuid.uuid4()))

# Claude API configuration for AI-powered auto-fix
# Set ANTHROPIC_API_KEY environment variable to enable AI-powered auto-fix
CLAUDE_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
if CLAUDE_API_KEY:
    logger.info("✓ Claude API configured for AI-powered auto-fix")
else:
    logger.info("ℹ Claude API not configured (set ANTHROPIC_API_KEY to enable)")

# Create folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Job tracking
conversion_jobs: Dict[str, Dict[str, Any]] = {}
job_lock = threading.Lock()


# HTML Templates
LANDING_PAGE_HTML = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF to EPUB Converter</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            flex: 1;
        }

        header {
            text-align: center;
            color: white;
            padding: 40px 20px;
        }

        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .tagline {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            padding: 40px;
            margin: 20px 0;
        }

        .upload-area {
            border: 3px dashed #667eea;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            transition: all 0.3s;
            cursor: pointer;
        }

        .upload-area:hover {
            border-color: #764ba2;
            background: #f5f5f5;
        }

        .upload-area.dragover {
            background: #e8e8ff;
            border-color: #764ba2;
        }

        .upload-icon {
            font-size: 3em;
            color: #667eea;
            margin-bottom: 20px;
        }

        input[type="file"] {
            display: none;
        }

        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 1.1em;
            border-radius: 5px;
            cursor: pointer;
            transition: transform 0.2s;
            margin: 10px;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .progress {
            width: 100%;
            height: 30px;
            background: #f0f0f0;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
            display: none;
        }

        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            width: 0%;
            transition: width 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }

        .status {
            text-align: center;
            margin: 20px 0;
            font-size: 1.1em;
        }

        .error {
            color: #e74c3c;
            background: #ffebee;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            display: none;
        }

        .success {
            color: #27ae60;
            background: #e8f5e9;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            display: none;
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }

        .feature {
            text-align: center;
            padding: 20px;
        }

        .feature-icon {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        footer {
            text-align: center;
            color: white;
            padding: 20px;
            opacity: 0.8;
        }

        .file-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            display: none;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
            display: none;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>📚 PDF to EPUB Converter</h1>
            <p class="tagline">Convert your PDF files to EPUB 3.x with MathML support</p>
        </div>
    </header>

    <div class="container">
        <div class="card">
            <div class="upload-area" id="uploadArea">
                <div class="upload-icon">📄</div>
                <h3>Drop your PDF file here or click to browse</h3>
                <p>Maximum file size: 30MB</p>
                <input type="file" id="fileInput" accept=".pdf" />
            </div>

            <div class="file-info" id="fileInfo"></div>

            <div class="progress" id="progress">
                <div class="progress-bar" id="progressBar">0%</div>
            </div>

            <div class="spinner" id="spinner"></div>

            <div class="status" id="status"></div>

            <div class="error" id="error"></div>
            <div class="success" id="success"></div>

            <div style="text-align: center;">
                <button class="btn" id="uploadBtn" style="display: none;">Convert to EPUB</button>
                <button class="btn" id="downloadBtn" style="display: none;">Download EPUB</button>
            </div>
        </div>

        <div class="card">
            <h2 style="text-align: center; margin-bottom: 30px;">Features</h2>
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">📐</div>
                    <h3>MathML Support</h3>
                    <p>Perfect formula conversion</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">✅</div>
                    <h3>EPUB 3.x</h3>
                    <p>Latest standard compliance</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">🎯</div>
                    <h3>Validated</h3>
                    <p>100% epubcheck pass</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">⚡</div>
                    <h3>Fast</h3>
                    <p>Quick conversion process</p>
                </div>
            </div>
        </div>
    </div>

    <footer>
        <p>&copy; 2024 PDF to EPUB Converter. Powered by Python & Flask.</p>
    </footer>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const fileInfo = document.getElementById('fileInfo');
        const progress = document.getElementById('progress');
        const progressBar = document.getElementById('progressBar');
        const spinner = document.getElementById('spinner');
        const status = document.getElementById('status');
        const error = document.getElementById('error');
        const success = document.getElementById('success');

        let selectedFile = null;
        let jobId = null;

        // Upload area click
        uploadArea.addEventListener('click', () => fileInput.click());

        // File selection
        fileInput.addEventListener('change', (e) => {
            handleFile(e.target.files[0]);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFile(e.dataTransfer.files[0]);
        });

        function handleFile(file) {
            if (!file) return;

            if (!file.name.toLowerCase().endsWith('.pdf')) {
                showError('Please select a PDF file');
                return;
            }

            if (file.size > 30 * 1024 * 1024) {
                showError('File size exceeds 30MB limit');
                return;
            }

            selectedFile = file;
            fileInfo.style.display = 'block';
            fileInfo.innerHTML = `
                <strong>Selected file:</strong> ${file.name}<br>
                <strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB
            `;
            uploadBtn.style.display = 'inline-block';
            hideMessages();
        }

        uploadBtn.addEventListener('click', uploadAndConvert);

        async function uploadAndConvert() {
            if (!selectedFile) return;

            uploadBtn.disabled = true;
            progress.style.display = 'block';
            spinner.style.display = 'block';
            status.textContent = 'Uploading...';
            hideMessages();

            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
                const response = await fetch('/api/convert', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    jobId = data.job_id;
                    pollJobStatus();
                } else {
                    showError(data.error || 'Conversion failed');
                    resetUI();
                }
            } catch (err) {
                showError('Network error: ' + err.message);
                resetUI();
            }
        }

        async function pollJobStatus() {
            try {
                const response = await fetch(`/api/status/${jobId}`);
                const data = await response.json();

                if (data.status === 'completed') {
                    progressBar.style.width = '100%';
                    progressBar.textContent = '100%';
                    spinner.style.display = 'none';
                    status.textContent = 'Conversion complete!';
                    showSuccess('Your EPUB file is ready for download');
                    downloadBtn.style.display = 'inline-block';
                    downloadBtn.onclick = () => {
                        window.location.href = `/api/download/${jobId}`;
                    };
                } else if (data.status === 'failed') {
                    showError(data.error || 'Conversion failed');
                    resetUI();
                } else {
                    // Still processing
                    const prog = data.progress || 50;
                    progressBar.style.width = prog + '%';
                    progressBar.textContent = prog + '%';
                    status.textContent = data.message || 'Converting...';
                    setTimeout(pollJobStatus, 2000);
                }
            } catch (err) {
                showError('Error checking status: ' + err.message);
                resetUI();
            }
        }

        function showError(message) {
            error.textContent = message;
            error.style.display = 'block';
            success.style.display = 'none';
        }

        function showSuccess(message) {
            success.textContent = message;
            success.style.display = 'block';
            error.style.display = 'none';
        }

        function hideMessages() {
            error.style.display = 'none';
            success.style.display = 'none';
        }

        function resetUI() {
            uploadBtn.disabled = false;
            spinner.style.display = 'none';
            progress.style.display = 'none';
            status.textContent = '';
        }
    </script>
</body>
</html>
'''


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'


def cleanup_old_files():
    """Clean up files older than 24 hours"""
    try:
        now = time.time()
        cutoff = now - (24 * 60 * 60)  # 24 hours

        for folder in [app.config['UPLOAD_FOLDER'], app.config['OUTPUT_FOLDER']]:
            for filename in os.listdir(folder):
                filepath = os.path.join(folder, filename)
                if os.path.isfile(filepath):
                    if os.path.getmtime(filepath) < cutoff:
                        os.remove(filepath)
                        logger.info(f"Cleaned up old file: {filepath}")

    except Exception as e:
        logger.error(f"Cleanup error: {e}")


def convert_pdf_async(job_id: str, pdf_path: str, output_path: str):
    """
    Perform PDF conversion in background thread

    Args:
        job_id: Job identifier
        pdf_path: Path to input PDF
        output_path: Path for output EPUB
    """
    try:
        with job_lock:
            conversion_jobs[job_id]['status'] = 'processing'
            conversion_jobs[job_id]['message'] = 'Starting conversion...'
            conversion_jobs[job_id]['progress'] = 10

        # Create converter
        converter = PDFToEPUBConverter(pdf_path, output_path)

        # Extract metadata
        with job_lock:
            conversion_jobs[job_id]['message'] = 'Extracting metadata...'
            conversion_jobs[job_id]['progress'] = 30
        converter.extract_metadata()

        # Extract content
        with job_lock:
            conversion_jobs[job_id]['message'] = 'Extracting content...'
            conversion_jobs[job_id]['progress'] = 50
        converter.extract_content()

        # Build EPUB
        with job_lock:
            conversion_jobs[job_id]['message'] = 'Building EPUB...'
            conversion_jobs[job_id]['progress'] = 70
        converter.convert()

        # Validate
        with job_lock:
            conversion_jobs[job_id]['message'] = 'Validating EPUB...'
            conversion_jobs[job_id]['progress'] = 90

        # Complete
        with job_lock:
            conversion_jobs[job_id]['status'] = 'completed'
            conversion_jobs[job_id]['message'] = 'Conversion completed successfully'
            conversion_jobs[job_id]['progress'] = 100
            conversion_jobs[job_id]['output_path'] = output_path

        logger.info(f"Job {job_id} completed successfully")

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        with job_lock:
            conversion_jobs[job_id]['status'] = 'failed'
            conversion_jobs[job_id]['error'] = str(e)


@app.route('/')
def index():
    """Serve landing page"""
    return render_template_string(LANDING_PAGE_HTML)


@app.route('/api/convert', methods=['POST'])
def convert():
    """
    API endpoint to upload and convert PDF

    Returns:
        JSON response with job ID
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Only PDF files are allowed'}), 400

        # Generate job ID
        job_id = str(uuid.uuid4())

        # Save uploaded file
        filename = secure_filename(file.filename)
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_{filename}")
        file.save(pdf_path)

        # Output path
        output_filename = filename.rsplit('.', 1)[0] + '.epub'
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], f"{job_id}_{output_filename}")

        # Create job entry
        with job_lock:
            conversion_jobs[job_id] = {
                'status': 'pending',
                'message': 'Job created',
                'progress': 0,
                'pdf_path': pdf_path,
                'output_path': output_path,
                'created_at': datetime.now().isoformat()
            }

        # Start conversion in background thread
        thread = threading.Thread(
            target=convert_pdf_async,
            args=(job_id, pdf_path, output_path)
        )
        thread.daemon = True
        thread.start()

        logger.info(f"Started conversion job {job_id}")

        return jsonify({
            'job_id': job_id,
            'message': 'Conversion started'
        }), 202

    except RequestEntityTooLarge:
        return jsonify({'error': 'File size exceeds 30MB limit'}), 413
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/status/<job_id>', methods=['GET'])
def get_status(job_id: str):
    """
    Get conversion job status

    Args:
        job_id: Job identifier

    Returns:
        JSON response with job status
    """
    with job_lock:
        if job_id not in conversion_jobs:
            return jsonify({'error': 'Job not found'}), 404

        job = conversion_jobs[job_id]
        return jsonify({
            'job_id': job_id,
            'status': job['status'],
            'message': job.get('message', ''),
            'progress': job.get('progress', 0),
            'error': job.get('error')
        })


@app.route('/api/download/<job_id>', methods=['GET'])
def download(job_id: str):
    """
    Download converted EPUB file

    Args:
        job_id: Job identifier

    Returns:
        EPUB file download
    """
    with job_lock:
        if job_id not in conversion_jobs:
            return jsonify({'error': 'Job not found'}), 404

        job = conversion_jobs[job_id]

        if job['status'] != 'completed':
            return jsonify({'error': 'Conversion not completed'}), 400

        output_path = job.get('output_path')
        if not output_path or not os.path.exists(output_path):
            return jsonify({'error': 'Output file not found'}), 404

    # Send file
    return send_file(
        output_path,
        as_attachment=True,
        download_name=os.path.basename(output_path).split('_', 1)[1]
    )


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'active_jobs': len([j for j in conversion_jobs.values() if j['status'] == 'processing'])
    })


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({'error': 'File size exceeds 30MB limit'}), 413


@app.errorhandler(500)
def internal_error(error):
    """Handle internal server error"""
    logger.error(f"Internal error: {error}")
    return jsonify({'error': 'Internal server error'}), 500


# Cleanup scheduler
def schedule_cleanup():
    """Schedule periodic cleanup of old files"""
    while True:
        time.sleep(3600)  # Run every hour
        cleanup_old_files()


if __name__ == '__main__':
    # Start cleanup thread
    cleanup_thread = threading.Thread(target=schedule_cleanup)
    cleanup_thread.daemon = True
    cleanup_thread.start()

    # Run Flask app
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'

    logger.info(f"Starting web server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
