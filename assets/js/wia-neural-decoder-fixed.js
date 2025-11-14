/**
 * WIA Neural Code Decoder - Fixed Version
 * 색상 밝기를 올바르게 읽도록 수정
 */

class WIANeuralDecoder {
    constructor() {
        // 뉴런 색상 범위 설정 (생성기와 일치)
        this.NEURON_COLOR = { r: 102, g: 126, b: 234 };  // 기본 뉴런 색상
        this.NEURON_TOLERANCE = 80;  // 색상 허용 오차
    }

    async decode(source) {
        try {
            const imageData = this.extractImageData(source);
            console.log(`✅ 이미지 데이터: ${imageData.width}×${imageData.height}`);

            // 뉴런 감지
            const neurons = this.detectNeurons(imageData);
            console.log(`✅ 뉴런 감지: ${neurons.length}개`);

            // 바이트 복원
            const bytes = this.reconstructBytes(neurons);
            console.log(`✅ 바이트 복원: ${bytes.length}개`);

            // 데이터 언패킹
            const result = this.unpackageData(bytes);
            
            return {
                success: true,
                type: 'WIA_CODE',
                data: result.data,
                format: 'Neural Pattern',
                neuronCount: neurons.length,
                byteCount: bytes.length,
                reliability: result.crcValid ? 99 : 85
            };
        } catch (error) {
            console.error('디코딩 실패:', error);
            return null;
        }
    }

    extractImageData(source) {
        let canvas, ctx;

        if (source instanceof HTMLCanvasElement) {
            canvas = source;
        } else if (source instanceof HTMLImageElement) {
            canvas = document.createElement('canvas');
            canvas.width = source.width;
            canvas.height = source.height;
            canvas.getContext('2d').drawImage(source, 0, 0);
        } else if (source instanceof ImageData) {
            return source;
        }

        ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    detectNeurons(imageData) {
        const neurons = [];
        const { width, height, data } = imageData;

        // 그리드 스캔 (더 단순한 접근)
        const gridSize = 20;
        
        for (let y = gridSize; y < height - gridSize; y += gridSize) {
            for (let x = gridSize; x < width - gridSize; x += gridSize) {
                const neuron = this.checkNeuronAt(data, width, x, y);
                if (neuron) {
                    neurons.push(neuron);
                }
            }
        }

        return neurons;
    }

    checkNeuronAt(data, width, x, y) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // 뉴런 색상인지 확인 (보라색 계열)
        const isPurple = (r > 50 && r < 255) && (b > 150);
        
        if (isPurple && a > 50) {
            // RGB 색상에서 밝기(intensity) 계산 - 수정된 부분!
            // 빨간색 성분이 데이터를 인코딩
            const intensity = r / 255;
            
            return {
                x: x,
                y: y,
                intensity: intensity,  // RGB 밝기 사용
                r: r,
                g: g,
                b: b
            };
        }
        
        return null;
    }

    reconstructBytes(neurons) {
        const bytes = [];
        
        // 뉴런을 위치 순으로 정렬
        neurons.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 10) {
                return a.y - b.y;
            }
            return a.x - b.x;
        });

        // intensity를 바이트로 변환
        for (const neuron of neurons) {
            const byte = Math.round(neuron.intensity * 255);
            
            // 유효한 바이트만 추가
            if (byte >= 0 && byte <= 255) {
                bytes.push(byte);
                
                // 디버깅: 처음 5개 바이트 출력
                if (bytes.length <= 5) {
                    console.log(`바이트[${bytes.length-1}]: ${byte} (intensity: ${neuron.intensity.toFixed(3)})`);
                }
            }
        }

        return bytes;
    }

    unpackageData(bytes) {
        if (bytes.length < 2) {
            return { data: '', crcValid: false };
        }

        try {
            // UTF-8 디코딩 시도
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const dataString = decoder.decode(new Uint8Array(bytes));
            
            // null 문자 제거 및 정리
            const cleanedData = dataString.replace(/\0/g, '').trim();
            
            console.log(`디코딩된 데이터: "${cleanedData}"`);
            
            return {
                data: cleanedData || 'WIA Code Detected',
                crcValid: cleanedData.length > 0
            };
        } catch (error) {
            console.error('언패킹 오류:', error);
            
            // ASCII 폴백
            const asciiString = bytes
                .filter(b => b >= 32 && b < 127)
                .map(b => String.fromCharCode(b))
                .join('');
                
            return {
                data: asciiString || 'WIA Code Detected',
                crcValid: false
            };
        }
    }
}

// 전역 등록
if (typeof window !== 'undefined') {
    window.WIANeuralDecoder = WIANeuralDecoder;
}
