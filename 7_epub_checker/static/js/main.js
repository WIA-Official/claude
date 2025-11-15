// EPUB Checker - Client-side JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // File input elements
    const fileInput = document.getElementById('file-input');
    const fileLabel = document.querySelector('.file-label');
    const fileName = document.querySelector('.file-name');
    const dropZone = document.getElementById('drop-zone');
    const uploadForm = document.getElementById('upload-form');
    const submitBtn = document.getElementById('submit-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const errorMessage = document.getElementById('error-message');

    if (!fileInput) return; // Exit if not on upload page

    // File selection handler
    fileInput.addEventListener('change', function(e) {
        handleFileSelect(e.target.files);
    });

    // Drag and drop handlers
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect(files);
        }
    });

    // Handle file selection
    function handleFileSelect(files) {
        if (files.length === 0) return;

        const file = files[0];

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.epub')) {
            showError(getLocalizedText('invalidFileType'));
            return;
        }

        // Validate file size (30MB)
        const maxSize = 30 * 1024 * 1024;
        if (file.size > maxSize) {
            showError(getLocalizedText('fileTooLarge'));
            return;
        }

        // Update UI
        fileName.textContent = file.name;
        fileName.classList.add('show');
        hideError();
    }

    // Form submission handler
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validate file selected
        if (!fileInput.files || fileInput.files.length === 0) {
            showError(getLocalizedText('noFileSelected'));
            return;
        }

        // Show progress
        submitBtn.disabled = true;
        progressContainer.style.display = 'block';
        hideError();

        // Create form data
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        // Submit via AJAX
        fetch('/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Upload failed');
                });
            }
            return response.json();
        })
        .then(data => {
            // Redirect to result page
            window.location.href = `/result/${data.file_id}`;
        })
        .catch(error => {
            console.error('Upload error:', error);
            showError(error.message);
            submitBtn.disabled = false;
            progressContainer.style.display = 'none';
        });
    });

    // Error handling
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Localized text helper
    function getLocalizedText(key) {
        const lang = document.documentElement.lang;
        const texts = {
            'ko': {
                'invalidFileType': 'EPUB 파일만 업로드 가능합니다.',
                'fileTooLarge': '파일 크기가 너무 큽니다 (최대 30MB)',
                'noFileSelected': '파일을 선택해주세요.'
            },
            'en': {
                'invalidFileType': 'Only EPUB files are allowed.',
                'fileTooLarge': 'File too large (max 30MB)',
                'noFileSelected': 'Please select a file.'
            }
        };

        return texts[lang] ? texts[lang][key] : texts['en'][key];
    }

    // Auto-expand error guide details on click
    document.querySelectorAll('.error-guide').forEach(function(guide) {
        const summary = guide.querySelector('.guide-summary');
        if (summary) {
            summary.addEventListener('click', function(e) {
                e.preventDefault();
                guide.toggleAttribute('open');
            });
        }
    });

    // Smooth scroll to anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add animation to cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(20px)';
                entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 100);

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe cards for animation
    document.querySelectorAll('.card').forEach(card => {
        observer.observe(card);
    });
});

// Print functionality for results
function printResults() {
    window.print();
}

// Copy error to clipboard
function copyError(errorText) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(errorText).then(() => {
            // Show toast notification
            showToast('Copied to clipboard!');
        });
    }
}

// Toast notification
function showToast(message, duration = 3000) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #323232;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Fade in
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 100);

    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}
