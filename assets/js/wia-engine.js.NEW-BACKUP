/**
 * ============================================================================
 * 🎨 WIA Neural Engine - Canvas 렌더링 엔진
 * ============================================================================
 */

class WIANeuralEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pattern = null;
        this.markerType = 'triangle';
        this.animationFrame = null;

        // 표준화된 색상 (백업 파일의 정확한 사양)
        this.NEURON_COLOR = 'rgba(102, 126, 234, 0.8)';      // 청보라색 (백업 파일과 동일)
        this.NEURON_STROKE = '#ffffff';                       // 흰색 테두리
        this.CONNECTION_COLOR = 'rgba(118, 75, 162, 0.3)';   // 진한 보라 (백업 파일과 동일)

        // QR 스타일 마커 (검정 사각형 - 특허 만료, 세계 표준)
        this.MARKER_COLOR = 'rgb(0, 0, 0)';                  // 순수 검정
        this.MARKER_SIZE = 60;                                // 큰 사각형 60x60px

        // 고해상도 설정
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    /**
     * WIA Neural Code 생성 및 렌더링
     */
    generate(data, markerType = 'triangle', quality = 'high') {
        try {
            // 1. 인코더로 뉴럴 패턴 생성
            const encoder = new WIANeuralEncoder();

            // 데이터 타입 자동 감지
            const dataType = this.detectDataType(data);
            const formattedData = this.formatDataForEncoding(dataType, data);

            this.pattern = encoder.encode(dataType, formattedData);
            this.markerType = markerType;

            // 2. Canvas 렌더링
            this.render();

            return this.pattern;

        } catch (error) {
            console.error('❌ 렌더링 오류:', error);
            this.renderError(error.message);
            throw error;
        }
    }

    /**
     * 데이터 타입 자동 감지
     */
    detectDataType(data) {
        if (typeof data === 'string') {
            if (data.startsWith('http://') || data.startsWith('https://')) return 'link';
            if (data.startsWith('WIFI:')) return 'wifi';
            if (data.startsWith('BEGIN:VCARD')) return 'vcard';
            if (data.startsWith('mailto:')) return 'email';
            if (data.startsWith('tel:')) return 'phone';
            if (data.startsWith('sms:')) return 'sms';
            return 'text';
        }
        return 'text';
    }

    /**
     * 인코딩용 데이터 포맷
     */
    formatDataForEncoding(type, data) {
        if (typeof data === 'string') {
            return { content: data };
        }
        return data;
    }

    /**
     * 메인 렌더링 함수
     */
    render() {
        if (!this.pattern) {
            console.warn('⚠️ 렌더링할 패턴이 없습니다.');
            return;
        }

        const { width, height } = this.canvas.getBoundingClientRect();
        const ctx = this.ctx;

        // 1. 배경 그리기 (순백색)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // 2. 마커 그리기 (가장 먼저 - 뒤에 배치)
        this.renderMarkers(width, height);

        // 3. 연결선 그리기
        this.renderConnections();

        // 4. 뉴런 그리기 (가장 나중 - 앞에 배치)
        this.renderNeurons();

        // 5. 메타데이터 표시 (선택사항)
        if (this.pattern.metadata) {
            this.renderMetadata(width, height);
        }
    }

    /**
     * 마커 렌더링 - QR 스타일 (3개 사각형 - 검정-흰색-검정 패턴)
     */
    renderMarkers(width, height) {
        const ctx = this.ctx;
        const size = this.MARKER_SIZE;

        // 3개 마커 위치 (QR 코드와 동일 - 좌상, 우상, 좌하)
        const positions = [
            { x: 0, y: 0 },                    // 좌상단
            { x: width - size, y: 0 },         // 우상단
            { x: 0, y: height - size }         // 좌하단
        ];

        positions.forEach(pos => {
            this.drawQRMarker(pos.x, pos.y, size);
        });
    }

    /**
     * QR 스타일 마커 그리기 (검정-흰색-검정 3층 사각형)
     */
    drawQRMarker(x, y, size) {
        const ctx = this.ctx;

        // 1. 외곽 검정 사각형 (7/7)
        ctx.fillStyle = this.MARKER_COLOR;
        ctx.fillRect(x, y, size, size);

        // 2. 중간 흰색 사각형 (5/7)
        const whiteSize = size * 5 / 7;
        const whiteOffset = size * 1 / 7;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
            x + whiteOffset,
            y + whiteOffset,
            whiteSize,
            whiteSize
        );

        // 3. 내부 검정 사각형 (3/7)
        const innerSize = size * 3 / 7;
        const innerOffset = size * 2 / 7;
        ctx.fillStyle = this.MARKER_COLOR;
        ctx.fillRect(
            x + innerOffset,
            y + innerOffset,
            innerSize,
            innerSize
        );
    }

    // 마커 그리기 함수들 (각각 다른 색상 적용)
    drawTriangle(size, color, direction = 'up') {
        const ctx = this.ctx;
        const width = size * 1.25;  // 너비 100px (50 * 2.5)
        const height = size * 2;    // 높이 80px

        ctx.beginPath();

        if (direction === 'up') {
            // 위로 향하는 삼각형 (상단 마커)
            ctx.moveTo(0, -height / 3);                    // 꼭지점
            ctx.lineTo(-width, height * 2 / 3);           // 왼쪽 하단
            ctx.lineTo(width, height * 2 / 3);            // 오른쪽 하단
        } else {
            // 아래로 향하는 삼각형 (하단 마커들)
            ctx.moveTo(0, height / 3);                     // 아래 꼭지점
            ctx.lineTo(-width, -height * 2 / 3);          // 왼쪽 상단
            ctx.lineTo(width, -height * 2 / 3);           // 오른쪽 상단
        }

        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawHeart(size, color) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);

        ctx.bezierCurveTo(-size, -size * 0.3, -size * 0.5, -size * 0.8, 0, -size * 0.3);
        ctx.bezierCurveTo(size * 0.5, -size * 0.8, size, -size * 0.3, 0, size * 0.3);

        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawStar(size, color) {
        const ctx = this.ctx;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawDiamond(size, color) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawMoon(size, color) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(size * 0.3, -size * 0.3, size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawLightning(size, color) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, -size);
        ctx.lineTo(size * 0.3, -size * 0.2);
        ctx.lineTo(-size * 0.1, -size * 0.2);
        ctx.lineTo(size * 0.5, size);
        ctx.lineTo(0, size * 0.2);
        ctx.lineTo(size * 0.1, size * 0.2);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    /**
     * 뉴런 렌더링 - 백업 파일 사양대로
     */
    renderNeurons() {
        if (!this.pattern.neurons) return;

        const ctx = this.ctx;
        const scale = this.canvas.getBoundingClientRect().width / 480;

        this.pattern.neurons.forEach(neuron => {
            const x = neuron.x * scale;
            const y = neuron.y * scale;
            const radius = 8 * scale; // 백업 파일과 동일 (8px)

            // 뉴런 원 - 백업 파일과 동일한 색상
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);

            // 청보라색 rgba(102, 126, 234, 0.8)
            ctx.fillStyle = this.NEURON_COLOR;
            ctx.fill();

            // 흰색 테두리 2px (백업 파일과 동일)
            ctx.strokeStyle = this.NEURON_STROKE;
            ctx.lineWidth = 2 * scale;
            ctx.stroke();
        });
    }

    /**
     * 연결선 렌더링 - 백업 파일 사양대로 (곡선)
     */
    renderConnections() {
        if (!this.pattern.connections) return;

        const ctx = this.ctx;
        const scale = this.canvas.getBoundingClientRect().width / 480;

        this.pattern.connections.forEach(conn => {
            const startX = conn.start.x * scale;
            const startY = conn.start.y * scale;
            const endX = conn.end.x * scale;
            const endY = conn.end.y * scale;

            ctx.beginPath();
            ctx.moveTo(startX, startY);

            // 곡선 연결 (백업 파일과 동일 - quadraticCurveTo)
            const cpX = (startX + endX) / 2;
            const cpY = startY - 20 * scale;
            ctx.quadraticCurveTo(cpX, cpY, endX, endY);

            // 진한 보라색 rgba(118, 75, 162, strength)
            const strength = conn.strength || 0.3;
            ctx.strokeStyle = `rgba(118, 75, 162, ${strength})`;
            ctx.lineWidth = 2 * scale;
            ctx.stroke();
        });
    }

    /**
     * 메타데이터 렌더링
     */
    renderMetadata(width, height) {
        const ctx = this.ctx;
        const meta = this.pattern.metadata;

        ctx.save();
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.textAlign = 'right';

        const text = `v${meta.version} | ${meta.dataType} | ${meta.dataSize}B`;
        ctx.fillText(text, width - 10, height - 10);

        ctx.restore();
    }

    /**
     * 에러 렌더링
     */
    renderError(message) {
        const { width, height } = this.canvas.getBoundingClientRect();
        const ctx = this.ctx;

        ctx.fillStyle = '#fee';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#c00';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('❌ 오류', width / 2, height / 2 - 20);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(message, width / 2, height / 2 + 10);
    }

    /**
     * 마커 타입 변경
     */
    setMarkerType(type) {
        this.markerType = type;
        if (this.pattern) {
            this.render();
        }
    }

    /**
     * Canvas를 이미지로 변환
     */
    toDataURL(format = 'image/png') {
        return this.canvas.toDataURL(format);
    }

    /**
     * Canvas를 Blob으로 변환
     */
    async toBlob(format = 'image/png') {
        return new Promise((resolve) => {
            this.canvas.toBlob((blob) => {
                resolve(blob);
            }, format);
        });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WIANeuralEngine;
} else {
    window.WIANeuralEngine = WIANeuralEngine;
}
