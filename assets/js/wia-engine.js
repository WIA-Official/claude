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

        // 3개의 다른 마커 색상 (백업 파일의 정확한 사양)
        this.MARKER_COLORS = {
            top: 'rgb(255, 0, 110)',      // #ff006e 핑크
            left: 'rgb(0, 180, 216)',     // #00b4d8 하늘색
            right: 'rgb(114, 9, 183)'     // #7209b7 보라색
        };

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
     * 마커 렌더링 - 3개 위치 (백업 파일의 정확한 사양)
     */
    renderMarkers(width, height) {
        const ctx = this.ctx;
        const size = 40; // 마커 크기 (너비 100px, 높이 80px 삼각형 기준)

        // 3개 마커 위치 (백업 파일과 동일)
        const markers = [
            {
                name: 'top',
                x: width / 2,           // 가로 중앙
                y: 30,                  // 상단에서 30px
                color: this.MARKER_COLORS.top,
                direction: 'up'         // 위쪽을 가리킴
            },
            {
                name: 'left',
                x: 30,                  // 좌측에서 30px
                y: height - 30,         // 하단에서 30px
                color: this.MARKER_COLORS.left,
                direction: 'down'       // 아래쪽을 가리킴
            },
            {
                name: 'right',
                x: width - 30,          // 우측에서 30px
                y: height - 30,         // 하단에서 30px
                color: this.MARKER_COLORS.right,
                direction: 'down'       // 아래쪽을 가리킴
            }
        ];

        markers.forEach((marker) => {
            ctx.save();
            ctx.translate(marker.x, marker.y);

            // 마커 타입별 렌더링 (각 마커마다 다른 색상)
            switch (this.markerType) {
                case 'heart':
                    this.drawHeart(size, marker.color);
                    break;
                case 'star':
                    this.drawStar(size, marker.color);
                    break;
                case 'diamond':
                    this.drawDiamond(size, marker.color);
                    break;
                case 'moon':
                    this.drawMoon(size, marker.color);
                    break;
                case 'lightning':
                    this.drawLightning(size, marker.color);
                    break;
                default:
                    this.drawTriangle(size, marker.color, marker.direction);
            }

            ctx.restore();
        });
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
