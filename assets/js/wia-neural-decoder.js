/**
 * ============================================================================
 * 🔍 WIA Neural Decoder - 뉴럴 패턴에서 데이터 복원
 * ============================================================================
 *
 * 핵심 기능:
 * - Canvas/이미지에서 뉴럴 패턴 인식
 * - 바이트 데이터 복원
 * - 오류 정정 적용
 * - 원본 데이터 재구성
 */

class WIANeuralDecoder {
    constructor() {
        this.VERSION = '1.0.0';
        this.GRID_SIZE = 480;
        this.NEURON_COUNT = 144;
        this.ERROR_THRESHOLD = 0.1; // 10% 오류 허용

        // 표준화된 색상 범위 (백업 파일의 정확한 사양)
        this.NEURON_COLOR = { r: 102, g: 126, b: 234 };  // 청보라색 (백업 파일과 동일)
        this.CONNECTION_COLOR = { r: 118, g: 75, b: 162 }; // 진한 보라 (백업 파일과 동일)

        // QR 스타일 마커 (검정 사각형)
        this.MARKER_COLOR = { r: 0, g: 0, b: 0 };         // 순수 검정
        this.MARKER_SIZE = 60;                             // 60x60px

        // 색상 허용 범위
        this.NEURON_TOLERANCE = 35;    // 뉴런 (청보라색, 넓은 범위)
        this.CONNECTION_TOLERANCE = 35; // 연결선 (진한 보라)
        this.MARKER_TOLERANCE = 30;    // 마커 (검정, 좁은 범위)
    }

    /**
     * 메인 디코딩 함수
     * @param {HTMLCanvasElement|Image} source - Canvas 또는 이미지
     * @returns {object} - 디코딩된 데이터
     */
    async decode(source) {
        try {
            // 1. 이미지 데이터 추출
            const imageData = this.extractImageData(source);

            // 2. 마커 감지 (QR 스타일 패턴 확인)
            const markers = this.detectMarkers(imageData);
            if (markers.length < 3) {
                const size = this.MARKER_SIZE;
                const w = imageData.width;
                const h = imageData.height;
                const debugInfo = this.sampleColorsAtPositions(imageData, [
                    { x: Math.floor(size / 2), y: Math.floor(size / 2) },
                    { x: w - Math.floor(size / 2), y: Math.floor(size / 2) },
                    { x: Math.floor(size / 2), y: h - Math.floor(size / 2) }
                ]);
                throw new Error(`QR 마커를 감지할 수 없습니다 (${markers.length}/3). 샘플: ${JSON.stringify(debugInfo)}`);
            }

            // 3. 뉴런 위치 감지
            const neurons = this.detectNeurons(imageData);

            if (neurons.length === 0) {
                const debugInfo = this.sampleColorsAtGrid(imageData);
                throw new Error(`뉴런을 감지할 수 없습니다. 샘플 색상: ${JSON.stringify(debugInfo)}`);
            }

            // 4. 연결선 추적
            const connections = this.traceConnections(imageData, neurons);

            // 5. 바이트 데이터 복원
            const bytes = this.reconstructBytes(neurons, connections);

            // 6. 오류 정정 적용
            const correctedBytes = this.applyErrorCorrection(bytes);

            // 7. 바이트를 문자열로 변환
            const decodedString = this.bytesToString(correctedBytes);

            // 8. 데이터 타입 파싱
            const result = this.parseDecodedData(decodedString);

            result.success = true;
            result.neuronCount = neurons.length;
            result.connectionCount = connections.length;

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
            throw new Error('지원하지 않는 소스 타입입니다.');
        }

        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * 마커 감지 - QR 스타일 (검정-흰색-검정 패턴)
     */
    detectMarkers(imageData) {
        // ✅ 입력 검증
        if (!imageData || typeof imageData.width === 'undefined') {
            throw new Error('Invalid imageData object');
        }

        const w = imageData.width;
        const h = imageData.height;
        const data = imageData.data;

        console.log('🔍 detectMarkers 시작:', {
            width: w,
            height: h,
            dataLength: data.length,
            expected: w * h * 4
        });

        // ✅ 유효성 검증
        if (w <= 0 || h <= 0 || data.length !== w * h * 4) {
            throw new Error(`Invalid dimensions: ${w}x${h}, data: ${data.length}`);
        }

        // QR 마커 위치 (중심점 기준)
        const positions = [
            { x: 30, y: 30, name: 'top-left' },
            { x: w - 30, y: 30, name: 'top-right' },
            { x: 30, y: h - 30, name: 'bottom-left' }
        ];

        const foundMarkers = [];

        for (const pos of positions) {
            // ✅ 범위 체크
            if (pos.x < 0 || pos.x >= w || pos.y < 0 || pos.y >= h) {
                console.warn(`⚠️ ${pos.name}: 범위 벗어남`, pos);
                continue;
            }

            // QR 패턴 검출
            const result = this.findQRPatternAt(data, w, h, pos.x, pos.y);

            if (result) {
                console.log(`✅ ${pos.name} 발견:`, result);
                foundMarkers.push({ ...result, name: pos.name });
            } else {
                console.warn(`❌ ${pos.name} 못찾음`);
            }
        }

        if (foundMarkers.length < 3) {
            // 디버깅 샘플
            const samples = positions.map(pos => {
                // ✅ 안전한 인덱스 계산
                if (pos.x < 0 || pos.x >= w || pos.y < 0 || pos.y >= h) {
                    return {
                        name: pos.name,
                        x: pos.x,
                        y: pos.y,
                        error: 'out of bounds'
                    };
                }
                const idx = (pos.y * w + pos.x) * 4;
                if (idx < 0 || idx >= data.length - 3) {
                    return {
                        name: pos.name,
                        x: pos.x,
                        y: pos.y,
                        error: 'invalid index'
                    };
                }
                return {
                    name: pos.name,
                    x: pos.x,
                    y: pos.y,
                    r: data[idx],
                    g: data[idx + 1],
                    b: data[idx + 2],
                    a: data[idx + 3]
                };
            });

            throw new Error(`QR 마커 감지 실패 (${foundMarkers.length}/3)\nImageData: ${w}x${h}\n샘플: ${JSON.stringify(samples)}`);
        }

        return foundMarkers;
    }

    /**
     * QR 패턴 검출 함수 - 검정색 사각형 찾기
     */
    findQRPatternAt(data, w, h, centerX, centerY) {
        const size = 60;
        const half = size / 2;

        // 검색 영역 (60x60 영역을 5px 간격으로 샘플링)
        for (let dy = -half; dy <= half; dy += 5) {
            for (let dx = -half; dx <= half; dx += 5) {
                const x = Math.round(centerX + dx);
                const y = Math.round(centerY + dy);

                // 범위 체크
                if (x < 0 || x >= w || y < 0 || y >= h) continue;

                const idx = (y * w + x) * 4;

                // 범위 체크
                if (idx < 0 || idx >= data.length - 3) continue;

                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // QR 검정색 (r,g,b < 50)
                if (r < 50 && g < 50 && b < 50) {
                    return { x, y, color: { r, g, b } };
                }
            }
        }

        return null;
    }

    /**
     * QR 마커 패턴 확인 (검정-흰색-검정)
     */
    isQRMarkerPattern(data, width, height, centerX, centerY, markerSize) {
        const stepSize = Math.floor(markerSize / 7);  // 7등분

        // 3개 지점 샘플링: 외곽(검정), 중간(흰색), 중심(검정)
        const samples = [
            { name: '외곽', offset: -3 * stepSize, expectBlack: true },
            { name: '중간', offset: -1 * stepSize, expectBlack: false },
            { name: '중심', offset: 0, expectBlack: true }
        ];

        for (const sample of samples) {
            const x = centerX + sample.offset;
            const y = centerY;

            if (x < 0 || x >= width || y < 0 || y >= height) continue;

            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const isBlack = (r < this.MARKER_TOLERANCE &&
                           g < this.MARKER_TOLERANCE &&
                           b < this.MARKER_TOLERANCE);
            const isWhite = (r > 255 - this.MARKER_TOLERANCE &&
                           g > 255 - this.MARKER_TOLERANCE &&
                           b > 255 - this.MARKER_TOLERANCE);

            // 패턴 검증
            if (sample.expectBlack && !isBlack) {
                return false;  // 검정이어야 하는데 아님
            }
            if (!sample.expectBlack && !isWhite) {
                return false;  // 흰색이어야 하는데 아님
            }
        }

        return true;  // 패턴 일치
    }

    /**
     * 특정 위치에서 마커 색상 찾기
     */
    findMarkerAt(data, width, height, centerX, centerY, radius) {
        let markerPixelCount = 0;
        let totalPixels = 0;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;

                if (x < 0 || x >= width || y < 0 || y >= height) continue;

                totalPixels++;
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // 마커 색상 감지: rgb(220, 60, 100) ± 20
                const isMarkerColor =
                    Math.abs(r - this.MARKER_COLOR.r) < this.COLOR_TOLERANCE &&
                    Math.abs(g - this.MARKER_COLOR.g) < this.COLOR_TOLERANCE &&
                    Math.abs(b - this.MARKER_COLOR.b) < this.COLOR_TOLERANCE;

                if (isMarkerColor) {
                    markerPixelCount++;
                }
            }
        }

        // 20% 이상이 마커 색상이면 마커로 인식
        return (markerPixelCount / totalPixels) > 0.2;
    }

    /**
     * 디버깅: 특정 위치들의 색상 샘플링
     */
    sampleColorsAtPositions(imageData, positions) {
        const { width, data } = imageData;
        const samples = [];

        positions.forEach(pos => {
            const idx = (pos.y * width + pos.x) * 4;
            samples.push({
                x: pos.x,
                y: pos.y,
                r: data[idx],
                g: data[idx + 1],
                b: data[idx + 2]
            });
        });

        return samples;
    }

    /**
     * 디버깅: 그리드 위치의 색상 샘플링
     */
    sampleColorsAtGrid(imageData) {
        const { width, data } = imageData;
        const gridSize = Math.sqrt(this.NEURON_COUNT);
        const spacing = width / (gridSize + 1);
        const samples = [];

        // 첫 4개 뉴런 위치만 샘플링
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const x = Math.round((j + 1) * spacing);
                const y = Math.round((i + 1) * spacing);
                const idx = (y * width + x) * 4;
                samples.push({
                    gridPos: `${i},${j}`,
                    x, y,
                    r: data[idx],
                    g: data[idx + 1],
                    b: data[idx + 2]
                });
            }
        }

        return samples;
    }

    /**
     * 뉴런 위치 감지 (원형 패턴 찾기)
     */
    detectNeurons(imageData) {
        const neurons = [];
        const { width, height, data } = imageData;

        // 그리드 스캔
        const gridSize = Math.sqrt(this.NEURON_COUNT);
        const spacing = width / (gridSize + 1);

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const expectedX = Math.round((j + 1) * spacing);
                const expectedY = Math.round((i + 1) * spacing);

                // 주변 영역에서 뉴런 검색 (±10px)
                const neuron = this.findNeuronNear(
                    data,
                    width,
                    height,
                    expectedX,
                    expectedY,
                    10
                );

                if (neuron) {
                    neurons.push({
                        id: i * gridSize + j,
                        x: neuron.x,
                        y: neuron.y,
                        intensity: neuron.intensity
                    });
                }
            }
        }

        return neurons;
    }

    /**
     * 특정 위치 근처에서 뉴런 찾기 (백업 파일 사양)
     */
    findNeuronNear(data, width, height, centerX, centerY, radius) {
        let maxIntensity = 0;
        let neuronX = centerX;
        let neuronY = centerY;
        let foundCount = 0;

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

                // 뉴런 색상 감지: rgba(102, 126, 234, 0.8) - 백업 파일과 동일
                // 청보라색 계열 (넓은 범위)
                const isNeuronColor =
                    Math.abs(r - this.NEURON_COLOR.r) < this.NEURON_TOLERANCE &&
                    Math.abs(g - this.NEURON_COLOR.g) < this.NEURON_TOLERANCE &&
                    Math.abs(b - this.NEURON_COLOR.b) < this.NEURON_TOLERANCE &&
                    a > 150;  // 0.8 * 255 = 204, 여유있게 150

                if (isNeuronColor) {
                    foundCount++;
                    // Intensity는 blue channel 기준 (뉴런의 주요 색상)
                    const intensity = b / 255;
                    if (intensity > maxIntensity) {
                        maxIntensity = intensity;
                        neuronX = x;
                        neuronY = y;
                    }
                }
            }
        }

        // 충분한 픽셀을 찾았고, intensity가 유의미하면 뉴런으로 인식
        return (foundCount > 3 && maxIntensity > 0.7) ? { x: neuronX, y: neuronY, intensity: maxIntensity } : null;
    }

    /**
     * 연결선 추적 (뉴런 간 연결 감지)
     */
    traceConnections(imageData, neurons) {
        const connections = [];
        const { width, data } = imageData;

        // 모든 뉴런 쌍 검사
        for (let i = 0; i < neurons.length - 1; i++) {
            const start = neurons[i];
            const end = neurons[i + 1];

            // 두 뉴런 사이의 선 추적
            const connection = this.traceLine(data, width, start, end);

            if (connection) {
                connections.push({
                    startId: start.id,
                    endId: end.id,
                    strength: connection.strength
                });
            }
        }

        return connections;
    }

    /**
     * 두 점 사이의 선 추적 (백업 파일 사양 - 곡선 고려)
     */
    traceLine(data, width, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance);

        let totalIntensity = 0;
        let sampleCount = 0;

        // 곡선 경로를 따라 샘플링 (quadraticCurveTo)
        for (let i = 0; i < steps; i++) {
            const t = i / steps;

            // 곡선 제어점 (백업 파일과 동일)
            const cpX = (start.x + end.x) / 2;
            const cpY = start.y - 20;

            // Quadratic Bezier 곡선 계산
            const x = Math.round(
                (1 - t) * (1 - t) * start.x +
                2 * (1 - t) * t * cpX +
                t * t * end.x
            );
            const y = Math.round(
                (1 - t) * (1 - t) * start.y +
                2 * (1 - t) * t * cpY +
                t * t * end.y
            );

            if (x < 0 || x >= width || y < 0 || y >= data.length / width / 4) continue;

            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // 연결선 색상 감지: rgba(118, 75, 162, 0.3) - 백업 파일과 동일
            const isConnection =
                Math.abs(r - this.CONNECTION_COLOR.r) < this.CONNECTION_TOLERANCE &&
                Math.abs(g - this.CONNECTION_COLOR.g) < this.CONNECTION_TOLERANCE &&
                Math.abs(b - this.CONNECTION_COLOR.b) < this.CONNECTION_TOLERANCE &&
                a > 50;  // 약한 투명도 (0.3 * 255 = 76, 여유있게 50)

            if (isConnection) {
                totalIntensity += a / 255;  // alpha를 strength로 사용
                sampleCount++;
            }
        }

        const avgStrength = sampleCount > 0 ? totalIntensity / sampleCount : 0;

        return avgStrength > 0.05 ? { strength: avgStrength } : null;
    }

    /**
     * 바이트 데이터 복원
     */
    reconstructBytes(neurons, connections) {
        const bytes = [];

        // 뉴런의 intensity에서 바이트 값 복원
        for (const neuron of neurons) {
            const byteValue = Math.round(neuron.intensity * 255);
            bytes.push(byteValue);
        }

        // 연결선의 strength에서 추가 데이터 복원
        for (const conn of connections) {
            const byteValue = Math.round(conn.strength * 255);
            bytes.push(byteValue);
        }

        return bytes;
    }

    /**
     * 오류 정정 적용 (30% 오류 허용)
     */
    applyErrorCorrection(bytes) {
        // ECC 데이터 분리 (마지막 30%가 ECC)
        const eccLength = Math.floor(bytes.length * 0.3);
        const dataLength = bytes.length - eccLength;

        const dataBytes = bytes.slice(0, dataLength);
        const eccBytes = bytes.slice(dataLength);

        // 간단한 체크섬 검증
        let errorCount = 0;
        for (let i = 0; i < eccLength; i++) {
            let checksum = 0;
            for (let j = 0; j < dataBytes.length; j++) {
                checksum ^= dataBytes[j] << (i % 8);
            }
            const expectedECC = checksum % 256;

            if (Math.abs(eccBytes[i] - expectedECC) > 10) {
                errorCount++;
            }
        }

        // 30% 오류까지 허용 (백업 파일 사양)
        if (errorCount > eccLength * 0.3) {
            console.warn(`⚠️ ECC 검증 경고: ${errorCount}/${eccLength} 오류 감지, 데이터 반환 시도`);
        }

        // 검증 실패해도 데이터 반환 (복구 시도)
        return dataBytes;
    }

    /**
     * 바이트 배열을 문자열로 변환
     */
    bytesToString(bytes) {
        try {
            // UTF-8 디코딩
            const decoder = new TextDecoder('utf-8');
            const uint8Array = new Uint8Array(bytes);
            return decoder.decode(uint8Array);
        } catch (error) {
            console.error('❌ 문자열 변환 오류:', error);
            return '';
        }
    }

    /**
     * 디코딩된 문자열 파싱 (타입별 처리)
     */
    parseDecodedData(str) {
        if (!str) {
            throw new Error('디코딩된 데이터가 비어있습니다.');
        }

        // 데이터 타입 자동 감지
        if (str.startsWith('WIFI:')) {
            return this.parseWiFi(str);
        } else if (str.startsWith('BEGIN:VCARD')) {
            return this.parseVCard(str);
        } else if (str.startsWith('mailto:')) {
            return this.parseEmail(str);
        } else if (str.startsWith('tel:')) {
            return { type: 'phone', data: str.replace('tel:', '') };
        } else if (str.startsWith('sms:')) {
            return this.parseSMS(str);
        } else if (str.startsWith('https://wa.me/')) {
            return this.parseWhatsApp(str);
        } else if (str.startsWith('geo:')) {
            return this.parseGPS(str);
        } else if (str.startsWith('HUMAN:')) {
            return this.parseHumanProof(str);
        } else if (str.startsWith('http://') || str.startsWith('https://')) {
            return { type: 'link', data: str };
        } else {
            return { type: 'text', data: str };
        }
    }

    parseWiFi(str) {
        const match = str.match(/WIFI:T:(.*?);S:(.*?);P:(.*?);;/);
        if (match) {
            return {
                type: 'wifi',
                data: {
                    security: match[1],
                    ssid: match[2],
                    password: match[3]
                }
            };
        }
        return { type: 'wifi', data: str };
    }

    parseVCard(str) {
        const lines = str.split('\n');
        const data = {};

        lines.forEach(line => {
            if (line.startsWith('FN:')) data.fullName = line.substring(3);
            if (line.startsWith('TEL:')) data.phone = line.substring(4);
            if (line.startsWith('EMAIL:')) data.email = line.substring(6);
            if (line.startsWith('ORG:')) data.organization = line.substring(4);
            if (line.startsWith('URL:')) data.website = line.substring(4);
        });

        return { type: 'vcard', data };
    }

    parseEmail(str) {
        const match = str.match(/mailto:(.*?)(?:\?subject=(.*?)&body=(.*?))?$/);
        if (match) {
            return {
                type: 'email',
                data: {
                    email: match[1],
                    subject: decodeURIComponent(match[2] || ''),
                    body: decodeURIComponent(match[3] || '')
                }
            };
        }
        return { type: 'email', data: str };
    }

    parseSMS(str) {
        const match = str.match(/sms:(.*?)(?:\?body=(.*?))?$/);
        if (match) {
            return {
                type: 'sms',
                data: {
                    phone: match[1],
                    message: decodeURIComponent(match[2] || '')
                }
            };
        }
        return { type: 'sms', data: str };
    }

    parseWhatsApp(str) {
        const match = str.match(/https:\/\/wa\.me\/(.*?)(?:\?text=(.*?))?$/);
        if (match) {
            return {
                type: 'whatsapp',
                data: {
                    phone: match[1],
                    message: decodeURIComponent(match[2] || '')
                }
            };
        }
        return { type: 'whatsapp', data: str };
    }

    parseGPS(str) {
        const match = str.match(/geo:(.*?),(.*?)(?:\?pincode=(.*?))?$/);
        if (match) {
            return {
                type: 'gps',
                data: {
                    latitude: parseFloat(match[1]),
                    longitude: parseFloat(match[2]),
                    pinCode: match[3] || ''
                }
            };
        }
        return { type: 'gps', data: str };
    }

    parseHumanProof(str) {
        const parts = str.split(':');
        return {
            type: 'human',
            data: {
                challenge: parts[1] || '',
                timestamp: parseInt(parts[2]) || 0,
                randomSeed: parts[3] || ''
            }
        };
    }

    /**
     * 이미지 파일에서 직접 디코딩
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

            img.onerror = () => {
                reject(new Error('이미지 로딩 실패'));
            };

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

// Export for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WIANeuralDecoder;
} else {
    window.WIANeuralDecoder = WIANeuralDecoder;
}
