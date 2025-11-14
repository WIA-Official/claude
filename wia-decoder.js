/**
 * WIA Neural Code Decoder
 * 패턴 인식 및 데이터 복원
 */

class WIANeuralDecoder {
    constructor() {
        this.encoder = new WIANeuralEncoder();
    }
    
    /**
     * 이미지에서 WIA Code 디코딩
     */
    async decodeFromImage(imageData) {
        try {
            // 1. 마커 감지 및 정규화
            const normalized = await this.normalizeImage(imageData);
            
            // 2. Neural Pattern 추출
            const pattern = await this.extractPattern(normalized);
            
            // 3. 데이터 디코딩
            const decoded = this.encoder.decode(pattern);
            
            // 4. 타입별 처리
            return this.processDecodedData(decoded);
            
        } catch (error) {
            console.error('Decode error:', error);
            throw error;
        }
    }
    
    /**
     * 이미지 정규화 (회전, 크기, 왜곡 보정)
     */
    async normalizeImage(imageData) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 480;
        canvas.height = 480;
        
        // 마커 찾기 (삼각형, 하트, 별 등)
        const markers = this.findMarkers(imageData);
        
        if (markers.length < 3) {
            throw new Error('Insufficient markers detected');
        }
        
        // 아핀 변환으로 정규화
        const transform = this.calculateTransform(markers);
        
        ctx.setTransform(
            transform.a, transform.b,
            transform.c, transform.d,
            transform.e, transform.f
        );
        
        ctx.drawImage(imageData, 0, 0, 480, 480);
        
        return ctx.getImageData(0, 0, 480, 480);
    }
    
    /**
     * 마커 찾기
     */
    findMarkers(imageData) {
        const markers = [];
        const shapes = [
            { type: 'triangle', vertices: 3 },
            { type: 'heart', curves: 2 },
            { type: 'star', vertices: 5 },
            { type: 'diamond', vertices: 4 },
            { type: 'moon', curves: 2 },
            { type: 'lightning', vertices: 7 }
        ];
        
        // 간단한 엣지 검출
        const edges = this.detectEdges(imageData);
        
        // 각 모양별로 매칭
        for (let shape of shapes) {
            const found = this.matchShape(edges, shape);
            if (found.length > 0) {
                markers.push(...found);
            }
        }
        
        return markers;
    }
    
    /**
     * Neural Pattern 추출
     */
    async extractPattern(imageData) {
        const pattern = {
            neurons: [],
            connections: [],
            colors: [],
            metadata: {}
        };
        
        // 1. 뉴런 위치 검출 (원형 객체)
        pattern.neurons = this.detectNeurons(imageData);
        
        // 2. 연결선 검출 (곡선)
        pattern.connections = this.detectConnections(imageData);
        
        // 3. 색상 추출
        pattern.colors = this.extractColors(imageData);
        
        // 4. 메타데이터 복원
        pattern.metadata = this.extractMetadata(pattern);
        
        return pattern;
    }
    
    /**
     * 뉴런 검출
     */
    detectNeurons(imageData) {
        const neurons = [];
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Hough Circle Transform 간소화 버전
        for (let y = 10; y < height - 10; y += 20) {
            for (let x = 10; x < width - 10; x += 20) {
                if (this.isNeuron(data, x, y, width)) {
                    // 뉴런 중심에서 데이터 추출
                    const neuronData = this.extractNeuronData(data, x, y, width);
                    neurons.push({
                        x: x,
                        y: y,
                        data: neuronData
                    });
                }
            }
        }
        
        return neurons;
    }
    
    /**
     * 뉴런 판별
     */
    isNeuron(data, x, y, width) {
        // 원형 패턴 검사
        const radius = 10;
        let edgeCount = 0;
        
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const px = Math.round(x + radius * Math.cos(angle));
            const py = Math.round(y + radius * Math.sin(angle));
            const idx = (py * width + px) * 4;
            
            // 엣지 검출
            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            if (brightness < 128) edgeCount++;
        }
        
        return edgeCount >= 12; // 16개 중 12개 이상 어두운 픽셀
    }
    
    /**
     * 뉴런 데이터 추출
     */
    extractNeuronData(data, cx, cy, width) {
        const extracted = [];
        const radius = 10;
        
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                if (x * x + y * y <= radius * radius) {
                    const px = cx + x;
                    const py = cy + y;
                    const idx = (py * width + px) * 4;
                    
                    // RGB 값을 바이트로 변환
                    extracted.push(data[idx]);     // R
                    extracted.push(data[idx + 1]); // G
                    extracted.push(data[idx + 2]); // B
                }
            }
        }
        
        return new Uint8Array(extracted);
    }
    
    /**
     * 연결선 검출
     */
    detectConnections(imageData) {
        const connections = [];
        
        // 간단한 라인 검출 (Hough Line Transform 대체)
        const lines = this.detectLines(imageData);
        
        for (let line of lines) {
            connections.push({
                start: line.start,
                end: line.end,
                data: this.extractLineData(imageData, line)
            });
        }
        
        return connections;
    }
    
    /**
     * 타입별 데이터 처리
     */
    processDecodedData(decoded) {
        const { type, data } = decoded;
        
        switch (type) {
            case 'wifi':
                return {
                    type: 'wifi',
                    ssid: data.ssid,
                    password: data.password,
                    security: data.security
                };
                
            case 'wiapin':
                const location = this.encoder.decodeYUJIN(data.pinCode);
                return {
                    type: 'wiapin',
                    pinCode: data.pinCode,
                    latitude: location.lat,
                    longitude: location.lon,
                    accuracy: location.accuracy
                };
                
            case 'human':
                // 휴먼 증명 검증
                if (this.verifyHumanPattern(data)) {
                    return {
                        type: 'human',
                        verified: true,
                        message: '인간임이 확인되었습니다'
                    };
                } else {
                    return {
                        type: 'human',
                        verified: false,
                        message: '인간이 필요합니다'
                    };
                }
                
            default:
                return { type, data };
        }
    }
    
    /**
     * 휴먼 패턴 검증
     */
    verifyHumanPattern(data) {
        if (!data.humanOnly) return false;
        
        // 미세 떨림 검증
        const vibration = data.humanOnly.microVibration;
        if (!vibration || vibration.length < 5) return false;
        
        // 생체 리듬 검증
        const biorhythm = data.humanOnly.biorhythm;
        if (biorhythm < 0 || biorhythm > 1) return false;
        
        // 스테가노그래피 메시지 확인
        const hidden = this.extractSteganography(data.humanOnly.hiddenMessage);
        if (hidden !== 'HUMAN-ONLY') return false;
        
        return true;
    }
    
    /**
     * 엣지 검출
     */
    detectEdges(imageData) {
        const edges = [];
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Sobel 필터
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                // 수평 그라디언트
                const gx = 
                    -1 * data[idx - 4 - width * 4] +
                    -2 * data[idx - 4] +
                    -1 * data[idx - 4 + width * 4] +
                    1 * data[idx + 4 - width * 4] +
                    2 * data[idx + 4] +
                    1 * data[idx + 4 + width * 4];
                
                // 수직 그라디언트
                const gy = 
                    -1 * data[idx - width * 4 - 4] +
                    -2 * data[idx - width * 4] +
                    -1 * data[idx - width * 4 + 4] +
                    1 * data[idx + width * 4 - 4] +
                    2 * data[idx + width * 4] +
                    1 * data[idx + width * 4 + 4];
                
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                
                if (magnitude > 128) {
                    edges.push({ x, y, magnitude });
                }
            }
        }
        
        return edges;
    }
    
    /**
     * 스테가노그래피 추출
     */
    extractSteganography(bits) {
        if (!bits || bits.length === 0) return '';
        
        let message = '';
        for (let i = 0; i < bits.length; i += 8) {
            let byte = 0;
            for (let j = 0; j < 8 && i + j < bits.length; j++) {
                byte = (byte << 1) | bits[i + j];
            }
            message += String.fromCharCode(byte);
        }
        
        return message;
    }
}

// 전역 등록
window.WIANeuralDecoder = WIANeuralDecoder;
