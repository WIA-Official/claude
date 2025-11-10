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

        // 표준화된 색상 (Decoder가 쉽게 감지 가능)
        this.NEURON_COLOR = 'rgb(120, 120, 220)';  // 보라색 (명확한 중간값)
        this.MARKER_COLOR = 'rgb(220, 60, 100)';    // 빨강-분홍 (마커 구별)

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
     * 마커 렌더링 - 3개 위치
     */
    renderMarkers(width, height) {
        const ctx = this.ctx;
        const size = 25; // 마커 크기

        // 3개 마커 위치 (고정된 위치)
        const markers = [
            { x: 60, y: 60 },                    // 좌상단
            { x: width - 60, y: 60 },            // 우상단
            { x: 60, y: height - 60 }            // 좌하단
        ];

        markers.forEach((pos, index) => {
            ctx.save();
            ctx.translate(pos.x, pos.y);

            // 마커 타입별 렌더링
            switch (this.markerType) {
                case 'heart':
                    this.drawHeart(size);
                    break;
                case 'star':
                    this.drawStar(size);
                    break;
                case 'diamond':
                    this.drawDiamond(size);
                    break;
                case 'moon':
                    this.drawMoon(size);
                    break;
                case 'lightning':
                    this.drawLightning(size);
                    break;
                default:
                    this.drawTriangle(size);
            }

            ctx.restore();
        });
    }

    // 마커 그리기 함수들
    drawTriangle(size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.866, size * 0.5);
        ctx.lineTo(size * 0.866, size * 0.5);
        ctx.closePath();

        ctx.fillStyle = this.MARKER_COLOR;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    drawHeart(size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);

        ctx.bezierCurveTo(-size, -size * 0.3, -size * 0.5, -size * 0.8, 0, -size * 0.3);
        ctx.bezierCurveTo(size * 0.5, -size * 0.8, size, -size * 0.3, 0, size * 0.3);

        ctx.fillStyle = this.MARKER_COLOR;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    drawStar(size) {
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

        ctx.fillStyle = this.MARKER_COLOR;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    drawDiamond(size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();

        ctx.fillStyle = this.MARKER_COLOR;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    drawMoon(size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = this.MARKER_COLOR;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(size * 0.3, -size * 0.3, size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    drawLightning(size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, -size);
        ctx.lineTo(size * 0.3, -size * 0.2);
        ctx.lineTo(-size * 0.1, -size * 0.2);
        ctx.lineTo(size * 0.5, size);
        ctx.lineTo(0, size * 0.2);
        ctx.lineTo(size * 0.1, size * 0.2);
        ctx.closePath();

        ctx.fillStyle = this.MARKER_COLOR;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    /**
     * 뉴런 렌더링 - 명확한 단색으로
     */
    renderNeurons() {
        if (!this.pattern.neurons) return;

        const ctx = this.ctx;
        const scale = this.canvas.getBoundingClientRect().width / 480;

        this.pattern.neurons.forEach(neuron => {
            const x = neuron.x * scale;
            const y = neuron.y * scale;
            const radius = 10 * scale; // 더 큰 뉴런

            // 뉴런 원 - 단색 (그라디언트 제거)
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);

            // 명확한 단일 색상 (intensity 기반)
            const alpha = 0.5 + (neuron.intensity * 0.5); // 0.5 ~ 1.0
            ctx.fillStyle = this.NEURON_COLOR.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            ctx.fill();

            // 흰색 외곽선
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3 * scale;
            ctx.stroke();

            // 내부 하이라이트 (입체감)
            ctx.beginPath();
            ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${neuron.intensity * 0.5})`;
            ctx.fill();
        });
    }

    /**
     * 연결선 렌더링 - 더 명확하게
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

            // 직선 연결 (곡선보다 명확)
            ctx.lineTo(endX, endY);

            // 명확한 색상
            const alpha = 0.3 + (conn.strength * 0.4); // 0.3 ~ 0.7
            ctx.strokeStyle = `rgba(150, 100, 200, ${alpha})`;
            ctx.lineWidth = 2.5 * scale;
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
