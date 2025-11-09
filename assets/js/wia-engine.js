/**
 * ============================================================================
 * 🎨 WIA Neural Engine - Canvas 렌더링 엔진
 * ============================================================================
 *
 * 핵심 기능:
 * - 뉴럴 패턴을 Canvas에 시각화
 * - 마커 시스템 (삼각형, 하트, 별 등)
 * - 애니메이션 효과
 * - 고해상도 렌더링
 */

class WIANeuralEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pattern = null;
        this.markerType = 'triangle';
        this.animationFrame = null;

        // 고해상도 설정
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        console.log('🎨 WIA Neural Engine 초기화 완료');
    }

    /**
     * WIA Neural Code 생성 및 렌더링
     * @param {string} data - 인코딩할 데이터
     * @param {string} markerType - 마커 타입
     * @param {string} quality - 품질 (low, medium, high)
     */
    generate(data, markerType = 'triangle', quality = 'high') {
        try {
            console.log('🎨 렌더링 시작:', { data, markerType, quality });

            // 1. 인코더로 뉴럴 패턴 생성
            const encoder = new WIANeuralEncoder();

            // 데이터 타입 자동 감지
            const dataType = this.detectDataType(data);
            const formattedData = this.formatDataForEncoding(dataType, data);

            this.pattern = encoder.encode(dataType, formattedData);
            this.markerType = markerType;

            // 2. Canvas 렌더링
            this.render();

            console.log('✅ 렌더링 완료');
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

        // 1. 배경 그리기
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // 2. 그라디언트 배경 (선택사항)
        const bgGradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, width / 2
        );
        bgGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        bgGradient.addColorStop(1, 'rgba(248, 249, 250, 1)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // 3. 마커 그리기 (먼저 그려서 뒤에 배치)
        this.renderMarkers(width, height);

        // 4. 연결선 그리기
        this.renderConnections();

        // 5. 뉴런 그리기
        this.renderNeurons();

        // 6. 메타데이터 표시 (디버그용)
        if (this.pattern.metadata) {
            this.renderMetadata(width, height);
        }
    }

    /**
     * 마커 렌더링
     */
    renderMarkers(width, height) {
        const ctx = this.ctx;
        const size = 30;

        // 3개 마커 위치
        const markers = [
            { x: width / 2, y: 50 },          // 상단 중앙
            { x: 100, y: height - 50 },       // 하단 왼쪽
            { x: width - 100, y: height - 50 } // 하단 오른쪽
        ];

        markers.forEach((pos, index) => {
            ctx.save();
            ctx.translate(pos.x, pos.y);

            switch (this.markerType) {
                case 'heart':
                    this.drawHeart(size, index);
                    break;
                case 'star':
                    this.drawStar(size, index);
                    break;
                case 'diamond':
                    this.drawDiamond(size, index);
                    break;
                case 'moon':
                    this.drawMoon(size, index);
                    break;
                case 'lightning':
                    this.drawLightning(size, index);
                    break;
                default:
                    this.drawTriangle(size, index);
            }

            ctx.restore();
        });
    }

    // 마커 그리기 함수들
    drawTriangle(size, index) {
        const colors = ['#667eea', '#764ba2', '#4caf50'];
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.866, size * 0.5);
        ctx.lineTo(size * 0.866, size * 0.5);
        ctx.closePath();

        ctx.fillStyle = colors[index % 3];
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawHeart(size, index) {
        const colors = ['#ff6b6b', '#ee5a24', '#ff9ff3'];
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);

        // 왼쪽 곡선
        ctx.bezierCurveTo(
            -size, -size * 0.3,
            -size * 0.5, -size * 0.8,
            0, -size * 0.3
        );

        // 오른쪽 곡선
        ctx.bezierCurveTo(
            size * 0.5, -size * 0.8,
            size, -size * 0.3,
            0, size * 0.3
        );

        ctx.fillStyle = colors[index % 3];
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawStar(size, index) {
        const colors = ['#ffd700', '#ffa500', '#ffff00'];
        const ctx = this.ctx;

        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();

        ctx.fillStyle = colors[index % 3];
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawDiamond(size, index) {
        const colors = ['#e74c3c', '#c0392b', '#f39c12'];
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();

        ctx.fillStyle = colors[index % 3];
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawMoon(size, index) {
        const colors = ['#f1c40f', '#f39c12', '#e67e22'];
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = colors[index % 3];
        ctx.fill();

        // 그림자 효과
        ctx.beginPath();
        ctx.arc(size * 0.3, -size * 0.3, size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawLightning(size, index) {
        const colors = ['#f39c12', '#e67e22', '#d35400'];
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.moveTo(-size * 0.3, -size);
        ctx.lineTo(size * 0.3, -size * 0.2);
        ctx.lineTo(-size * 0.1, -size * 0.2);
        ctx.lineTo(size * 0.5, size);
        ctx.lineTo(0, size * 0.2);
        ctx.lineTo(size * 0.1, size * 0.2);
        ctx.closePath();

        ctx.fillStyle = colors[index % 3];
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    /**
     * 뉴런 렌더링
     */
    renderNeurons() {
        if (!this.pattern.neurons) return;

        const ctx = this.ctx;
        const scale = this.canvas.getBoundingClientRect().width / 480;

        this.pattern.neurons.forEach(neuron => {
            const x = neuron.x * scale;
            const y = neuron.y * scale;
            const radius = 8 * scale;

            // 뉴런 원
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);

            // 그라디언트
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(102, 126, 234, ${neuron.intensity})`);
            gradient.addColorStop(1, `rgba(118, 75, 162, ${neuron.intensity * 0.7})`);

            ctx.fillStyle = gradient;
            ctx.fill();

            // 외곽선
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 * scale;
            ctx.stroke();

            // 내부 하이라이트
            ctx.beginPath();
            ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${neuron.intensity * 0.4})`;
            ctx.fill();
        });
    }

    /**
     * 연결선 렌더링
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

            // 곡선 연결 (베지어 곡선)
            const cp1x = (startX + endX) / 2;
            const cp1y = startY - 20 * scale;
            const cp2x = (startX + endX) / 2;
            const cp2y = endY - 20 * scale;

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);

            // 그라디언트 선
            const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
            gradient.addColorStop(0, `rgba(118, 75, 162, ${conn.strength * 0.6})`);
            gradient.addColorStop(1, `rgba(102, 126, 234, ${conn.strength * 0.3})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2 * scale;
            ctx.stroke();
        });
    }

    /**
     * 메타데이터 렌더링 (디버그용)
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

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WIANeuralEngine;
} else {
    window.WIANeuralEngine = WIANeuralEngine;
}

console.log('✅ WIA Neural Engine 로드 완료');
