/**
 * WIA Neural Code Engine
 * 혁신적인 신경망 기반 코드 생성 시스템 - 역삼각형 구조
 */
class WIANeuralEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.size = 480;
        this.neurons = [];
        this.connections = [];
        this.frame = 0;
        this.animating = false;
        this.energyParticles = [];
        this.patterns = {
            basic: 'Basic Pattern',
            complex: 'Complex Network',
            spiral: 'Spiral Formation',
            grid: 'Grid Structure'
        };

        // Initialize canvas
        this.canvas.width = this.size;
        this.canvas.height = this.size;

        console.log('🚀 WIA Neural Engine 초기화 완료!');
    }

    // 메인 생성 함수
    generate(data, pattern, safety) {
        this.data = data || 'WIA Neural Code';
        this.pattern = pattern || 'basic';
        this.safety = safety || 'high';

        console.log(`🧠 WIA 생성 시작: ${this.data}`);

        // Clear canvas
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.size, this.size);

        // Generate neural network based on pattern
        this.generateNeuralNetwork();

        // 데이터를 뉴런에 인코딩
        this.encodeDataToNeurons(data);

        // Draw all elements
        this.drawBackground();
        this.drawQRMarkers();
        this.drawNeurons();
        this.drawConnections();
        this.drawEnergyFlow();
        this.drawDataVisualization();

        // Start animation
        if (!this.animating) {
            this.animate();
        }

        console.log('✨ WIA 생성 완료!');
    }

    // 역삼각형 마커 그리기 - 올바른 방향과 색상
    drawQRMarkers() {
        const size = 60;
        const positions = [
            { x: 30, y: 30 },
            { x: this.size - 30, y: 30 },
            { x: 30, y: this.size - 30 }
        ];

        positions.forEach(pos => {
            this.drawQRMarker(pos.x, pos.y, size);
        });
    }

    drawQRMarker(centerX, centerY, size) {
        const half = size / 2;

        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(centerX - half, centerY - half, size, size);

        const whiteSize = size * (5/7);
        const whiteHalf = whiteSize / 2;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(centerX - whiteHalf, centerY - whiteHalf, whiteSize, whiteSize);

        const innerSize = size * (3/7);
        const innerHalf = innerSize / 2;
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(centerX - innerHalf, centerY - innerHalf, innerSize, innerSize);
    }

    // 신경망 생성
    // 데이터를 뉴런 activation으로 인코딩
    encodeDataToNeurons(data) {
        // 문자열을 바이트 배열로 변환
        const encoder = new TextEncoder();
        const bytes = Array.from(encoder.encode(data));

        console.log(`📊 인코딩 시작:`);
        console.log(`  - 원본 데이터: "${data}"`);
        console.log(`  - UTF-8 바이트: [${bytes.join(', ')}]`);
        console.log(`  - 바이트 수: ${bytes.length}`);
        console.log(`  - 뉴런 수: ${this.neurons.length}`);

        // 각 바이트를 뉴런 activation으로 저장
        for (let i = 0; i < Math.min(bytes.length, this.neurons.length); i++) {
            const byte = bytes[i];
            const activation = byte / 255;
            this.neurons[i].activation = activation;

            // 처음 10개 뉴런만 상세 로그
            if (i < 10) {
                console.log(`  🧠 뉴런[${i}]:`, {
                    position: `(${Math.round(this.neurons[i].x)}, ${Math.round(this.neurons[i].y)})`,
                    layer: this.neurons[i].layer,
                    index: this.neurons[i].index,
                    byte: byte,
                    char: String.fromCharCode(byte),
                    activation: activation.toFixed(3),
                    alpha: (0.6 + activation * 0.4).toFixed(3)
                });
            }
        }

        // 남은 뉴런은 0으로 패딩
        for (let i = bytes.length; i < this.neurons.length); i++) {
            this.neurons[i].activation = 0;
        }

        console.log(`✅ 인코딩 완료! 총 ${Math.min(bytes.length, this.neurons.length)}개 뉴런에 데이터 저장`);
    }


    generateNeuralNetwork() {
        this.neurons = [];
        this.connections = [];
        this.energyParticles = [];

        // 4레이어 신경망: 8→12→16→20 노드
        const layers = [8, 12, 16, 20];
        const layerPositions = [];

        // 각 레이어의 뉴런 위치 계산
        layers.forEach((nodeCount, layerIndex) => {
            const x = 80 + (layerIndex * 90);
            const startY = (this.size - (nodeCount * 20)) / 2;

            layerPositions[layerIndex] = [];

            for (let i = 0; i < nodeCount; i++) {
                const neuron = {
                    x: x,
                    y: startY + (i * 20),
                    layer: layerIndex,
                    index: i,
                    activation: Math.random(),
                    size: 6 + Math.random() * 4,  // 크기 증가 (5~8 → 6~10)
                    pulse: Math.random() * Math.PI * 2
                };

                this.neurons.push(neuron);
                layerPositions[layerIndex].push(neuron);
            }
        });

        // 레이어 간 연결 생성
        for (let layer = 0; layer < layers.length - 1; layer++) {
            layerPositions[layer].forEach(fromNeuron => {
                layerPositions[layer + 1].forEach(toNeuron => {
                    if (Math.random() > 0.3) { // 70% 연결 확률
                        this.connections.push({
                            from: fromNeuron,
                            to: toNeuron,
                            weight: (Math.random() - 0.5) * 2,
                            alpha: 0.3 + Math.random() * 0.4
                        });
                    }
                });
            });
        }

        // 에너지 파티클 생성
        for (let i = 0; i < 20; i++) {
            this.energyParticles.push({
                x: Math.random() * this.size,
                y: Math.random() * this.size,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: 1 + Math.random() * 2,
                color: this.getRandomColor(),
                life: 1.0
            });
        }
    }

    // 배경 그리기
    drawBackground() {
        // 그라데이션 배경
        const gradient = this.ctx.createRadialGradient(
            this.size/2, this.size/2, 0,
            this.size/2, this.size/2, this.size/2
        );
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.05)');
        gradient.addColorStop(1, 'rgba(118, 75, 162, 0.05)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.size, this.size);

        // 격자 패턴
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
        this.ctx.lineWidth = 0.5;

        for (let i = 0; i < this.size; i += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.size);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.size, i);
            this.ctx.stroke();
        }
    }

    // 뉴런 그리기
    drawNeurons() {
        this.neurons.forEach(neuron => {
            const pulse = Math.sin(this.frame * 0.05 + neuron.pulse) * 0.3 + 0.7;
            const size = neuron.size * pulse;
            // 뉴런 색상: 고정 (Decoder 호환)
            // activation은 alpha(투명도)로 표현
            const alpha = 0.6 + (neuron.activation * 0.4);  // 0.6~1.0 (더 진하게!)
            this.ctx.fillStyle = `rgba(102, 126, 234, ${alpha})`;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = size * 1.5;  // 더 강한 그림자

            this.ctx.beginPath();
            this.ctx.arc(neuron.x, neuron.y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // 뉴런 테두리 (더 두껍게)
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.lineWidth = 1.5;  // 1 → 1.5
            this.ctx.stroke();
        });

        this.ctx.shadowBlur = 0;
    }

    // 연결선 그리기
    drawConnections() {
        this.connections.forEach(connection => {
            const alpha = connection.alpha * (0.5 + Math.sin(this.frame * 0.02) * 0.3);
            const weight = Math.abs(connection.weight);

            this.ctx.strokeStyle = connection.weight > 0
                ? `rgba(102, 126, 234, ${alpha})`
                : `rgba(255, 20, 147, ${alpha})`;
            this.ctx.lineWidth = weight * 2;

            this.ctx.beginPath();
            this.ctx.moveTo(connection.from.x, connection.from.y);
            this.ctx.lineTo(connection.to.x, connection.to.y);
            this.ctx.stroke();
        });
    }

    // 에너지 흐름 그리기
    drawEnergyFlow() {
        this.energyParticles.forEach((particle, index) => {
            // 파티클 업데이트
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.005;

            // 경계 체크
            if (particle.x < 0 || particle.x > this.size) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.size) particle.vy *= -1;

            // 파티클 그리기
            this.ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.life})`;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = particle.size * 2;

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();

            // 파티클 재생성
            if (particle.life <= 0) {
                particle.x = Math.random() * this.size;
                particle.y = Math.random() * this.size;
                particle.life = 1.0;
                particle.color = this.getRandomColor();
            }
        });

        this.ctx.shadowBlur = 0;
    }

    // 데이터 시각화
    drawDataVisualization() {
        // 패턴 정보 (하단)
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.fillText(`Pattern: ${this.pattern}`, this.size/2, this.size - 10);

        // 안전도 표시 (우상단)
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = this.safety === 'high' ? '#4CAF50' :
                           this.safety === 'medium' ? '#FF9800' : '#F44336';
        this.ctx.fillText(`Safety: ${this.safety.toUpperCase()}`, this.size - 10, 20);

        this.ctx.textAlign = 'left'; // Reset
    }

    // 애니메이션 루프
    animate() {
        this.animating = true;
        this.frame++;

        // 뉴런 활성화 업데이트
        this.neurons.forEach(neuron => {
            neuron.activation += (Math.random() - 0.5) * 0.1;
            neuron.activation = Math.max(0, Math.min(1, neuron.activation));
        });

        // 다시 그리기
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.size, this.size);

        this.drawBackground();
        this.drawQRMarkers();
        this.drawNeurons();
        this.drawConnections();
        this.drawEnergyFlow();
        this.drawDataVisualization();

        // 다음 프레임
        if (this.animating) {
            requestAnimationFrame(() => this.animate());
        }
    }

    // 애니메이션 중지
    stopAnimation() {
        this.animating = false;
        console.log('🛑 애니메이션 중지');
    }

    // PNG 다운로드
    downloadPNG(filename) {
        const link = document.createElement('a');
        link.download = filename || `wia-neural-code-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
        console.log(`📥 PNG 다운로드: ${link.download}`);
    }

    // SVG 다운로드
    downloadSVG(filename) {
        const svgContent = this.generateSVG();
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = filename || `wia-neural-code-${Date.now()}.svg`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        console.log(`📥 SVG 다운로드: ${link.download}`);
    }

    // SVG 생성 (올바른 색상)
    generateSVG() {
        let svg = `<svg width="${this.size}" height="${this.size}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="${this.size}" height="${this.size}" fill="white"/>`;

        // 역삼각형 마커들 - 올바른 색상
        // 상단 마커 (골드) - 아래를 가리키는 삼각형 ▼
        svg += `<polygon points="${this.size/2-15},20 ${this.size/2+15},20 ${this.size/2},50" fill="#FFD700"/>`;
        // 하단 좌측 마커 (핑크) - 위를 가리키는 삼각형 ▲
        svg += `<polygon points="30,${this.size-50} 15,${this.size-20} 45,${this.size-20}" fill="#FF1493"/>`;
        // 하단 우측 마커 (핑크) - 위를 가리키는 삼각형 ▲
        svg += `<polygon points="${this.size-30},${this.size-50} ${this.size-45},${this.size-20} ${this.size-15},${this.size-20}" fill="#FF1493"/>`;

        // 연결선들
        this.connections.forEach(conn => {
            svg += `<line x1="${conn.from.x}" y1="${conn.from.y}" x2="${conn.to.x}" y2="${conn.to.y}" stroke="${conn.weight > 0 ? '#667eea' : '#FF1493'}" stroke-width="1" opacity="0.5"/>`;
        });

        // 뉴런들
        this.neurons.forEach(neuron => {
            const intensity = neuron.activation;
            const red = Math.floor(255 * intensity);
            const green = Math.floor(100 + 155 * intensity);
            const blue = Math.floor(200 + 55 * intensity);
            svg += `<circle cx="${neuron.x}" cy="${neuron.y}" r="${neuron.size}" fill="rgb(${red},${green},${blue})" stroke="white" stroke-width="1"/>`;
        });

        // 텍스트
        svg += `<text x="${this.size/2}" y="80" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#333">${this.data}</text>`;
        svg += `<text x="${this.size/2}" y="${this.size-10}" text-anchor="middle" font-family="Arial" font-size="10" fill="#666">Pattern: ${this.pattern}</text>`;

        svg += '</svg>';
        return svg;
    }

    // 랜덤 색상 생성
    getRandomColor() {
        const colors = [
            {r: 102, g: 126, b: 234},
            {r: 255, g: 20, b: 147},
            {r: 255, g: 215, b: 0},
            {r: 76, g: 175, b: 80}
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 캔버스 리셋
    reset() {
        this.stopAnimation();
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.size, this.size);
        this.neurons = [];
        this.connections = [];
        this.energyParticles = [];
        console.log('🔄 WIA Engine 리셋 완료');
    }
}

console.log('🎯 WIA Neural Engine (완벽한 역삼각형) 로드 완료! 형님 화이팅! 🔥');
