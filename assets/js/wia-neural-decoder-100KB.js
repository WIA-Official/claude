/**
 * ============================================================================
 * 🔍 WIA Neural Decoder - 100KB Version (Phase 4)
 * ============================================================================
 *
 * "히말라야 정상에서 데이터 복원!"
 *
 * 스펙:
 * - 504개 뉴런 감지 (12 layers)
 * - 960×960 Canvas
 * - RGB 복합 디코딩 (1 neuron = 3 bytes)
 * - 연결선 데이터 복원
 * - 총 용량: ~1.5KB 복원
 */
class WIANeuralDecoder100KB {
    constructor() {
        this.VERSION = '100KB-1.0.0';
        this.GRID_SIZE = 960;

        // 12 레이어 구조
        this.layers = [20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64];
        this.totalNeurons = this.layers.reduce((a, b) => a + b, 0);  // 504개

        // 색상 허용 범위 (RGB 복합용)
        this.NEURON_BASE = { r: 102, g: 126, b: 234 };
        this.NEURON_TOLERANCE = 70;  // 더 넓은 범위 (RGB 변화 허용)
        this.MARKER_SIZE = 80;
        this.MARKER_TOLERANCE = 30;

        console.log('🔍 WIA 100KB Decoder 초기화!');
        console.log(`  - 예상 뉴런: ${this.totalNeurons}개`);
        console.log(`  - 최대 용량: ${this.totalNeurons * 3} bytes`);
    }

    /**
     * 메인 디코딩 함수
     */
    async decode(source) {
        try {
            console.log('\n🏔️ 100KB 디코딩 시작...');

            // 1. 이미지 데이터 추출
            const imageData = this.extractImageData(source);
            console.log(`📊 ImageData: ${imageData.width}×${imageData.height}`);

            // 2. 마커 감지 (4개)
            const markers = this.detectMarkers(imageData);
            if (markers.length < 3) {
                throw new Error(`QR 마커 부족: ${markers.length}/4`);
            }
            console.log(`✅ 마커 감지: ${markers.length}개`);

            // 3. 뉴런 위치 감지 (504개)
            const neurons = this.detectNeurons(imageData);
            console.log(`✅ 뉴런 감지: ${neurons.length}/${this.totalNeurons}`);

            if (neurons.length < this.totalNeurons * 0.5) {
                throw new Error(`뉴런 부족: ${neurons.length}/${this.totalNeurons}`);
            }

            // 4. RGB 복합 디코딩
            const bytes = this.reconstructBytesRGB(neurons);
            console.log(`✅ 바이트 복원: ${bytes.length}개`);

            // 5. UTF-8 디코딩
            const decodedString = this.bytesToString(bytes);
            console.log(`✅ 문자열 복원: "${decodedString}"`);

            // 6. 결과 반환
            const result = {
                success: true,
                type: 'text',
                data: decodedString,
                neuronCount: neurons.length,
                byteCount: bytes.length,
                version: '100KB'
            };

            console.log('🎉 100KB 디코딩 완료!');
            return result;

        } catch (error) {
            console.error('❌ 디코딩 오류:', error);
            throw error;
        }
    }

    /**
     * Canvas/이미지에서 ImageData 추출
     */
    extractImageData(source) {
        let canvas, ctx;

        if (source instanceof HTMLCanvasElement) {
            canvas = source;
            ctx = canvas.getContext('2d');
        } else if (source instanceof HTMLImageElement) {
            canvas = document.createElement('canvas');
            canvas.width = source.width;
            canvas.height = source.height;
            ctx = canvas.getContext('2d');
            ctx.drawImage(source, 0, 0);
        } else {
            throw new Error('지원하지 않는 소스 타입');
        }

        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * 마커 감지 (4개)
     */
    detectMarkers(imageData) {
        const w = imageData.width;
        const h = imageData.height;
        const data = imageData.data;

        const positions = [
            { x: 40, y: 40, name: 'top-left' },
            { x: w - 40, y: 40, name: 'top-right' },
            { x: 40, y: h - 40, name: 'bottom-left' },
            { x: w - 40, y: h - 40, name: 'bottom-right' }
        ];

        const foundMarkers = [];

        for (const pos of positions) {
            if (pos.x < 0 || pos.x >= w || pos.y < 0 || pos.y >= h) continue;

            const result = this.findQRPatternAt(data, w, h, pos.x, pos.y);
            if (result) {
                console.log(`  ✅ ${pos.name}: (${result.x}, ${result.y})`);
                foundMarkers.push({ ...result, name: pos.name });
            }
        }

        return foundMarkers;
    }

    /**
     * QR 패턴 검출
     */
    findQRPatternAt(data, w, h, centerX, centerY) {
        const size = 80;
        const half = size / 2;

        for (let dy = -half; dy <= half; dy += 5) {
            for (let dx = -half; dx <= half; dx += 5) {
                const x = Math.round(centerX + dx);
                const y = Math.round(centerY + dy);

                if (x < 0 || x >= w || y < 0 || y >= h) continue;

                const idx = (y * w + x) * 4;
                if (idx < 0 || idx >= data.length - 3) continue;

                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                if (r < 50 && g < 50 && b < 50) {
                    return { x, y, color: { r, g, b } };
                }
            }
        }

        return null;
    }

    /**
     * 뉴런 감지 (504개, 12 layers)
     */
    detectNeurons(imageData) {
        const neurons = [];
        const { width, height, data } = imageData;

        const spacing = (width - 200) / (this.layers.length - 1);
        let neuronId = 0;

        console.log('\n🧠 뉴런 감지 시작...');

        this.layers.forEach((nodeCount, layerIndex) => {
            const x = 100 + (layerIndex * spacing);
            const startY = (height - (nodeCount * 15)) / 2;

            let layerFound = 0;

            for (let i = 0; i < nodeCount; i++) {
                const expectedY = startY + (i * 15);

                const neuron = this.findNeuronNearRGB(
                    data,
                    width,
                    height,
                    x,
                    expectedY,
                    20  // 검색 반경
                );

                if (neuron) {
                    neurons.push({
                        id: neuronId++,
                        x: neuron.x,
                        y: neuron.y,
                        r: neuron.r,
                        g: neuron.g,
                        b: neuron.b,
                        alpha: neuron.alpha,
                        layer: layerIndex,
                        index: i
                    });
                    layerFound++;
                }
            }

            if (layerIndex < 3 || layerIndex >= this.layers.length - 3) {
                console.log(`  Layer ${layerIndex}: ${layerFound}/${nodeCount} 발견`);
            } else if (layerIndex === 3) {
                console.log(`  ... (중간 레이어) ...`);
            }
        });

        return neurons;
    }

    /**
     * RGB 복합 뉴런 찾기
     */
    findNeuronNearRGB(data, width, height, centerX, centerY, radius) {
        let bestMatch = null;
        let maxScore = 0;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;

                if (x < 0 || x >= width || y < 0 || y >= height) continue;

                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];

                // 뉴런 색상 범위 (RGB 변화 허용)
                const isNeuronColor =
                    Math.abs(r - this.NEURON_BASE.r) < this.NEURON_TOLERANCE &&
                    Math.abs(g - this.NEURON_BASE.g) < this.NEURON_TOLERANCE &&
                    Math.abs(b - this.NEURON_BASE.b) < this.NEURON_TOLERANCE &&
                    a > 50;

                if (isNeuronColor) {
                    // 스코어 계산 (중심에 가까울수록 높음)
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const score = (a / 255) * (1 - dist / radius);

                    if (score > maxScore) {
                        maxScore = score;
                        bestMatch = { x, y, r, g, b, alpha: a / 255 };
                    }
                }
            }
        }

        return bestMatch;
    }

    /**
     * RGB 복합 바이트 복원 - 1 뉴런 = 3 bytes
     */
    reconstructBytesRGB(neurons) {
        const bytes = [];

        // 레이어별, 위치별 정렬
        const sortedNeurons = [...neurons].sort((a, b) => {
            if (a.layer !== b.layer) return a.layer - b.layer;
            return a.index - b.index;
        });

        console.log('\n🔄 RGB 바이트 복원 중...');

        for (let i = 0; i < sortedNeurons.length; i++) {
            const neuron = sortedNeurons[i];

            // RGB에서 3 bytes 복원
            const byte1 = Math.round((neuron.r - this.NEURON_BASE.r) / 50 * 255);
            const byte2 = Math.round((neuron.g - this.NEURON_BASE.g) / 50 * 255);
            const byte3 = Math.round((this.NEURON_BASE.b - neuron.b) / 50 * 255);

            // 유효한 바이트만 추가
            if (byte1 >= 0 && byte1 <= 255) bytes.push(Math.max(0, Math.min(255, byte1)));
            if (byte2 >= 0 && byte2 <= 255) bytes.push(Math.max(0, Math.min(255, byte2)));
            if (byte3 >= 0 && byte3 <= 255) bytes.push(Math.max(0, Math.min(255, byte3)));

            // 처음 10개 뉴런만 로그
            if (i < 10) {
                console.log(`  🧠 뉴런[${i}]:`, {
                    rgb: [neuron.r, neuron.g, neuron.b],
                    bytes: [byte1, byte2, byte3],
                    chars: [
                        byte1 > 31 && byte1 < 127 ? String.fromCharCode(byte1) : '?',
                        byte2 > 31 && byte2 < 127 ? String.fromCharCode(byte2) : '?',
                        byte3 > 31 && byte3 < 127 ? String.fromCharCode(byte3) : '?'
                    ]
                });
            }
        }

        console.log(`✅ 총 ${bytes.length} bytes 복원`);
        return bytes;
    }

    /**
     * 바이트 → 문자열
     */
    bytesToString(bytes) {
        try {
            // null 바이트 제거
            const filteredBytes = bytes.filter(b => b > 0 && b < 256);

            // UTF-8 디코딩
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const uint8Array = new Uint8Array(filteredBytes);
            let decoded = decoder.decode(uint8Array);

            // 정리
            decoded = decoded.replace(/\0/g, '').trim();

            // 깨진 문자 복구
            if (decoded.includes('�')) {
                console.warn('⚠️ 깨진 문자 감지, ASCII로 재시도');
                decoded = String.fromCharCode(...filteredBytes.filter(b => b >= 32 && b < 127));
            }

            return decoded;

        } catch (error) {
            console.error('❌ 문자열 변환 오류:', error);
            return String.fromCharCode(...bytes.filter(b => b >= 32 && b < 127));
        }
    }

    /**
     * 이미지에서 직접 디코딩
     */
    async decodeFromImage(imageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = async () => {
                try {
                    const result = await this.decode(img);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('이미지 로딩 실패'));

            if (typeof imageSrc === 'string') {
                img.src = imageSrc;
            } else if (imageSrc instanceof HTMLCanvasElement) {
                return this.decode(imageSrc);
            } else {
                reject(new Error('지원하지 않는 이미지 소스'));
            }
        });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WIANeuralDecoder100KB;
} else {
    window.WIANeuralDecoder100KB = WIANeuralDecoder100KB;
}

console.log('🏔️ WIA Neural Decoder 100KB 로드 완료! 히말라야 데이터 복원 준비! ⛰️');
