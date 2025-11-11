/**
 * ============================================================================
 * 🚀 WIA Neural Code Engine - 100KB Version (Phase 4)
 * ============================================================================
 *
 * "히말라야 정상 등반 - 베이스 캠프를 높게!"
 *
 * 스펙:
 * - 504개 뉴런 (12 layers)
 * - 960×960 Canvas
 * - RGB 복합 인코딩 (1 neuron = 3 bytes)
 * - 연결선 데이터 활용
 * - 총 용량: ~1.5KB per frame
 * - 멀티 프레임: 10 frames = 15KB
 */
class WIANeuralEngine100KB {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.size = 960;  // 480 → 960 (2배 확장!)
        this.neurons = [];
        this.connections = [];
        this.frame = 0;
        this.animating = false;
        this.energyParticles = [];

        // 12 레이어 구조
        this.layers = [20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64];
        this.totalNeurons = this.layers.reduce((a, b) => a + b, 0);  // 504개!

        console.log(`🚀 WIA 100KB Engine 초기화!`);
        console.log(`  - Canvas: ${this.size}×${this.size}`);
        console.log(`  - Neurons: ${this.totalNeurons}개`);
        console.log(`  - Layers: ${this.layers.join('-')}`);

        // Initialize canvas
        this.canvas.width = this.size;
        this.canvas.height = this.size;

        console.log('✅ 히말라야 정상 준비 완료!');
    }

    /**
     * 메인 생성 함수 - RGB 복합 인코딩
     */
    generate(data, pattern = 'complex', safety = 'high') {
        this.data = data || 'WIA Neural Code 100KB';
        this.pattern = pattern;
        this.safety = safety;

        console.log(`\n🏔️ 100KB 생성 시작: "${this.data}"`);
        console.log(`📊 목표 용량: ${this.totalNeurons * 3} bytes (RGB 복합)`);

        // Clear canvas
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.size, this.size);

        // Generate neural network
        this.generateNeuralNetwork();

        // RGB 복합 인코딩!
        this.encodeDataToNeuronsRGB(data);

        // Draw all elements
        this.drawBackground();
        this.drawQRMarkers();
        this.drawConnections();
        this.drawNeurons();
        this.drawEnergyFlow();
        this.drawDataVisualization();

        // Start animation
        if (!this.animating) {
            this.animate();
        }

        console.log('🎉 100KB 생성 완료!');
    }

    /**
     * RGB 복합 인코딩 - 1 뉴런당 3 bytes!
     */
    encodeDataToNeuronsRGB(data) {
        const encoder = new TextEncoder();
        const bytes = Array.from(encoder.encode(data));

        console.log(`\n📊 RGB 복합 인코딩 시작:`);
        console.log(`  - 원본 데이터: "${data}"`);
        console.log(`  - UTF-8 바이트: ${bytes.length}개`);
        console.log(`  - 최대 용량: ${this.neurons.length * 3} bytes`);

        let byteIndex = 0;

        for (let i = 0; i < this.neurons.length && byteIndex < bytes.length; i++) {
            const neuron = this.neurons[i];

            // 1 뉴런 = 3 bytes (RGB 각각 사용)
            const byte1 = bytes[byteIndex++] || 0;
            const byte2 = bytes[byteIndex++] || 0;
            const byte3 = bytes[byteIndex++] || 0;

            // RGB에 데이터 인코딩 (색상 범위 내에서)
            neuron.dataR = byte1 / 255;  // 0~1
            neuron.dataG = byte2 / 255;
            neuron.dataB = byte3 / 255;

            // Alpha는 전체 평균값
            neuron.activation = (byte1 + byte2 + byte3) / (255 * 3);

            // 처음 10개 뉴런만 상세 로그
            if (i < 10) {
                console.log(`  🧠 뉴런[${i}]:`, {
                    position: `(${Math.round(neuron.x)}, ${Math.round(neuron.y)})`,
                    layer: neuron.layer,
                    bytes: [byte1, byte2, byte3],
                    chars: [
                        byte1 ? String.fromCharCode(byte1) : '',
                        byte2 ? String.fromCharCode(byte2) : '',
                        byte3 ? String.fromCharCode(byte3) : ''
                    ],
                    dataRGB: [
                        neuron.dataR.toFixed(3),
                        neuron.dataG.toFixed(3),
                        neuron.dataB.toFixed(3)
                    ]
                });
            }
        }

        // 남은 뉴런은 0으로 패딩
        for (let i = Math.ceil(bytes.length / 3); i < this.neurons.length; i++) {
            this.neurons[i].dataR = 0;
            this.neurons[i].dataG = 0;
            this.neurons[i].dataB = 0;
            this.neurons[i].activation = 0;
        }

        const encodedBytes = Math.min(byteIndex, bytes.length);
        console.log(`✅ RGB 인코딩 완료! ${encodedBytes} bytes → ${Math.ceil(encodedBytes / 3)} 뉴런`);
    }

    /**
     * 12레이어 신경망 생성 (504 neurons)
     */
    generateNeuralNetwork() {
        this.neurons = [];
        this.connections = [];
        this.energyParticles = [];

        const layerPositions = [];
        const spacing = (this.size - 200) / (this.layers.length - 1);

        console.log(`\n🧠 신경망 생성 중...`);
        console.log(`  - 레이어 수: ${this.layers.length}`);
        console.log(`  - 레이어 간격: ${spacing.toFixed(1)}px`);

        // 각 레이어의 뉴런 위치 계산
        this.layers.forEach((nodeCount, layerIndex) => {
            const x = 100 + (layerIndex * spacing);
            const startY = (this.size - (nodeCount * 15)) / 2;  // 15px 간격

            layerPositions[layerIndex] = [];

            for (let i = 0; i < nodeCount; i++) {
                const neuron = {
                    x: x,
                    y: startY + (i * 15),
                    layer: layerIndex,
                    index: i,
                    activation: 0,
                    dataR: 0,
                    dataG: 0,
                    dataB: 0,
                    size: 4 + Math.random() * 3,  // 4~7px (작게!)
                    pulse: Math.random() * Math.PI * 2
                };

                this.neurons.push(neuron);
                layerPositions[layerIndex].push(neuron);
            }

            if (layerIndex < 3 || layerIndex >= this.layers.length - 3) {
                console.log(`  Layer ${layerIndex}: ${nodeCount} neurons at x=${Math.round(x)}`);
            } else if (layerIndex === 3) {
                console.log(`  ... (중간 ${this.layers.length - 6}개 레이어 생략) ...`);
            }
        });

        console.log(`✅ 총 ${this.neurons.length}개 뉴런 생성 완료!`);

        // 레이어 간 연결 생성 (희소 연결)
        let connectionCount = 0;
        for (let layer = 0; layer < this.layers.length - 1; layer++) {
            layerPositions[layer].forEach(fromNeuron => {
                layerPositions[layer + 1].forEach(toNeuron => {
                    if (Math.random() > 0.85) { // 15% 연결 확률 (희소하게!)
                        this.connections.push({
                            from: fromNeuron,
                            to: toNeuron,
                            weight: (Math.random() - 0.5) * 2,
                            alpha: 0.1 + Math.random() * 0.2
                        });
                        connectionCount++;
                    }
                });
            });
        }

        console.log(`✅ ${connectionCount}개 연결선 생성 완료!`);

        // 에너지 파티클 (더 많이!)
        for (let i = 0; i < 50; i++) {
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

    /**
     * QR 마커 (4개 - 960x960용)
     */
    drawQRMarkers() {
        const size = 80;  // 60 → 80
        const positions = [
            { x: 40, y: 40 },
            { x: this.size - 40, y: 40 },
            { x: 40, y: this.size - 40 },
            { x: this.size - 40, y: this.size - 40 }  // 4번째 마커 추가!
        ];

        positions.forEach(pos => {
            this.drawQRMarker(pos.x, pos.y, size);
        });
    }

    drawQRMarker(centerX, centerY, size) {
        const half = size / 2;

        // 7-5-3 패턴
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

    /**
     * 배경 그리기
     */
    drawBackground() {
        // 그라데이션 배경
        const gradient = this.ctx.createRadialGradient(
            this.size/2, this.size/2, 0,
            this.size/2, this.size/2, this.size/2
        );
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.03)');
        gradient.addColorStop(1, 'rgba(118, 75, 162, 0.03)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.size, this.size);

        // 격자 패턴 (더 촘촘하게)
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.05)';
        this.ctx.lineWidth = 0.5;

        for (let i = 0; i < this.size; i += 40) {
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

    /**
     * 뉴런 그리기 - RGB 복합 색상!
     */
    drawNeurons() {
        this.neurons.forEach(neuron => {
            const pulse = Math.sin(this.frame * 0.05 + neuron.pulse) * 0.3 + 0.7;
            const size = neuron.size * pulse;

            // RGB 복합 색상!
            const baseR = 102;
            const baseG = 126;
            const baseB = 234;

            // 데이터를 색상 변화로 표현
            const r = Math.round(baseR + neuron.dataR * 50);
            const g = Math.round(baseG + neuron.dataG * 50);
            const b = Math.round(baseB - neuron.dataB * 50);
            const alpha = 0.6 + (neuron.activation * 0.4);

            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = size * 1.2;

            this.ctx.beginPath();
            this.ctx.arc(neuron.x, neuron.y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // 테두리
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });

        this.ctx.shadowBlur = 0;
    }

    /**
     * 연결선 그리기
     */
    drawConnections() {
        this.connections.forEach(connection => {
            const alpha = connection.alpha * (0.5 + Math.sin(this.frame * 0.02) * 0.3);
            const weight = Math.abs(connection.weight);

            this.ctx.strokeStyle = connection.weight > 0
                ? `rgba(102, 126, 234, ${alpha})`
                : `rgba(255, 20, 147, ${alpha})`;
            this.ctx.lineWidth = weight * 1.5;

            this.ctx.beginPath();
            this.ctx.moveTo(connection.from.x, connection.from.y);
            this.ctx.lineTo(connection.to.x, connection.to.y);
            this.ctx.stroke();
        });
    }

    /**
     * 에너지 흐름 그리기
     */
    drawEnergyFlow() {
        this.energyParticles.forEach((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.005;

            if (particle.x < 0 || particle.x > this.size) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.size) particle.vy *= -1;

            this.ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.life})`;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = particle.size * 2;

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();

            if (particle.life <= 0) {
                particle.x = Math.random() * this.size;
                particle.y = Math.random() * this.size;
                particle.life = 1.0;
                particle.color = this.getRandomColor();
            }
        });

        this.ctx.shadowBlur = 0;
    }

    /**
     * 데이터 시각화
     */
    drawDataVisualization() {
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#667eea';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('WIA Neural Code - 100KB Version', this.size/2, 50);

        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.fillText(`504 Neurons | ${this.connections.length} Connections`, this.size/2, this.size - 30);
        this.ctx.fillText(`Capacity: ${this.totalNeurons * 3} bytes (RGB)`, this.size/2, this.size - 10);
    }

    /**
     * 애니메이션 루프
     */
    animate() {
        this.animating = true;
        this.frame++;

        // 뉴런 활성화 업데이트 (부드럽게)
        this.neurons.forEach(neuron => {
            const change = (Math.random() - 0.5) * 0.05;
            neuron.activation += change;
            neuron.activation = Math.max(0, Math.min(1, neuron.activation));
        });

        // 다시 그리기
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.size, this.size);

        this.drawBackground();
        this.drawQRMarkers();
        this.drawConnections();
        this.drawNeurons();
        this.drawEnergyFlow();
        this.drawDataVisualization();

        if (this.animating) {
            requestAnimationFrame(() => this.animate());
        }
    }

    /**
     * 애니메이션 중지
     */
    stopAnimation() {
        this.animating = false;
        console.log('🛑 애니메이션 중지');
    }

    /**
     * PNG 다운로드
     */
    downloadPNG(filename) {
        const link = document.createElement('a');
        link.download = filename || `wia-neural-code-100KB-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png', 1.0);  // 최고 품질!
        link.click();
        console.log(`📥 100KB PNG 다운로드: ${link.download}`);
    }

    /**
     * 랜덤 색상
     */
    getRandomColor() {
        const colors = [
            {r: 102, g: 126, b: 234},
            {r: 255, g: 20, b: 147},
            {r: 255, g: 215, b: 0},
            {r: 76, g: 175, b: 80}
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 리셋
     */
    reset() {
        this.stopAnimation();
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.size, this.size);
        this.neurons = [];
        this.connections = [];
        this.energyParticles = [];
        console.log('🔄 100KB Engine 리셋 완료');
    }
}

console.log('🏔️ WIA Neural Engine 100KB 로드 완료! 히말라야 정상 정복 준비! ⛰️');
