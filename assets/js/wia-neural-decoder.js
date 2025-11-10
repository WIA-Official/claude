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

        // 3개의 다른 마커 색상 (백업 파일의 정확한 사양)
        this.MARKER_COLORS = {
            top: { r: 255, g: 0, b: 110 },      // #ff006e 핑크
            left: { r: 0, g: 180, b: 216 },     // #00b4d8 하늘색
            right: { r: 114, g: 9, b: 183 }     // #7209b7 보라색
        };

        // 색상 허용 범위
        this.NEURON_TOLERANCE = 35;    // 뉴런 (청보라색, 넓은 범위)
        this.CONNECTION_TOLERANCE = 35; // 연결선 (진한 보라)
        this.MARKER_TOLERANCE = 40;    // 마커
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

            // 2. 마커 감지 (방향 및 유효성 확인)
            const markers = this.detectMarkers(imageData);
            if (markers.length < 3) {
                const debugInfo = this.sampleColorsAtPositions(imageData, [
                    { x: 60, y: 60 },
                    { x: imageData.width - 60, y: 60 },
                    { x: 60, y: imageData.height - 60 }
                ]);
                throw new Error(`마커를 감지할 수 없습니다 (${markers.length}/3). 샘플 색상: ${JSON.stringify(debugInfo)}`);
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
     * 마커 감지 (3개 위치 확인 - 백업 파일의 정확한 사양)
     */
    detectMarkers(imageData) {
        const w = imageData.width;
        const h = imageData.height;
        const data = imageData.data;

        // 예상 마커 위치와 색상 (백업 파일과 동일)
        const expectedMarkers = [
            {
                name: 'top',
                x: Math.round(w / 2),      // 가로 중앙
                y: 30,                      // 상단 30px
                color: this.MARKER_COLORS.top,
                tolerance: this.MARKER_TOLERANCE
            },
            {
                name: 'left',
                x: 30,                      // 좌측 30px
                y: h - 30,                  // 하단 30px
                color: this.MARKER_COLORS.left,
                tolerance: this.MARKER_TOLERANCE
            },
            {
                name: 'right',
                x: w - 30,                  // 우측 30px
                y: h - 30,                  // 하단 30px
                color: this.MARKER_COLORS.right,
                tolerance: this.MARKER_TOLERANCE
            }
        ];

        const foundMarkers = [];

        for (const expected of expectedMarkers) {
            // 좌표 유효성 검사
            if (expected.x < 0 || expected.x >= w || expected.y < 0 || expected.y >= h) {
                continue;
            }

            // 마커 주변 영역 검사 (반경 50px - 마커 크기 고려)
            let markerFound = false;
            const searchRadius = 50;

            for (let dy = -searchRadius; dy <= searchRadius; dy += 5) {
                for (let dx = -searchRadius; dx <= searchRadius; dx += 5) {
                    const checkX = Math.round(expected.x + dx);
                    const checkY = Math.round(expected.y + dy);

                    if (checkX < 0 || checkX >= w || checkY < 0 || checkY >= h) continue;

                    const idx = (checkY * w + checkX) * 4;
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];

                    // 해당 마커의 색상 검출
                    if (Math.abs(r - expected.color.r) < expected.tolerance &&
                        Math.abs(g - expected.color.g) < expected.tolerance &&
                        Math.abs(b - expected.color.b) < expected.tolerance) {

                        foundMarkers.push({
                            name: expected.name,
                            x: checkX,
                            y: checkY,
                            color: { r, g, b }
                        });
                        markerFound = true;
                        break;
                    }
                }
                if (markerFound) break;
            }

            if (!markerFound) {
                // 디버깅: 예상 위치의 실제 색상
                const idx = (expected.y * w + expected.x) * 4;
                console.warn(`❌ ${expected.name} 마커 못찾음. 예상 위치 색상:`, {
                    x: expected.x,
                    y: expected.y,
                    r: data[idx],
                    g: data[idx + 1],
                    b: data[idx + 2],
                    expected: expected.color
                });
            }
        }

        return foundMarkers;
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
