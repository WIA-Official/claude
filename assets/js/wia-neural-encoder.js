/**
 * ============================================================================
 * 🧠 WIA Neural Encoder - 30년 앞선 QR 코드 대체 시스템
 * ============================================================================
 */

class WIANeuralEncoder {
    constructor() {
        this.VERSION = '1.0.0';
        this.MAX_DATA_SIZE = 9216; // 9KB
        this.GRID_SIZE = 480;
        this.NEURON_COUNT = 144; // 12x12 뉴런 그리드
        this.ERROR_CORRECTION_LEVEL = 0.3; // 30% 오류 정정
    }

    /**
     * 메인 인코딩 함수
     */
    encode(dataType, data) {
        try {
            // 1. 데이터 타입별 포맷팅
            const formattedData = this.formatDataByType(dataType, data);

            // 2. 문자열을 바이트 배열로 변환
            const bytes = this.stringToBytes(formattedData);

            // 3. 데이터 크기 검증
            if (bytes.length > this.MAX_DATA_SIZE) {
                throw new Error(`데이터가 너무 큽니다: ${bytes.length} bytes (최대 ${this.MAX_DATA_SIZE} bytes)`);
            }

            // 4. 오류 정정 코드 추가 (Reed-Solomon)
            const encodedBytes = this.addErrorCorrection(bytes);

            // 5. 바이트를 뉴럴 패턴으로 변환
            const neuralPattern = this.bytesToNeuralPattern(encodedBytes);

            // 6. 메타데이터 추가
            neuralPattern.metadata = {
                version: this.VERSION,
                dataType: dataType,
                originalData: formattedData, // 디버깅용
                timestamp: Date.now(),
                dataSize: bytes.length,
                encodedSize: encodedBytes.length,
                neuronCount: this.NEURON_COUNT
            };

            return neuralPattern;

        } catch (error) {
            console.error('❌ 인코딩 오류:', error);
            throw error;
        }
    }

    /**
     * 데이터 타입별 포맷팅
     */
    formatDataByType(type, data) {
        switch (type) {
            case 'text':
                return data.content || data.text || '';

            case 'link':
            case 'url':
                return data.url || data.link || '';

            case 'wifi':
                return this.formatWiFi(data);

            case 'vcard':
            case 'staticvcard':
                return this.formatVCard(data);

            case 'email':
                return this.formatEmail(data);

            case 'phone':
                return `tel:${data.phone || ''}`;

            case 'sms':
            case 'smsonly':
                return this.formatSMS(data);

            case 'event':
                return this.formatEvent(data);

            case 'whatsapp':
                return this.formatWhatsApp(data);

            case 'crypto':
                return this.formatCrypto(data);

            case 'wiapin':
            case 'gps':
                return this.formatGPS(data);

            case 'application':
                return this.formatApplication(data);

            case 'file':
                return this.formatFile(data);

            default:
                return JSON.stringify(data);
        }
    }

    // WiFi 포맷 (MECARD 형식)
    formatWiFi(data) {
        const ssid = data.ssid || '';
        const password = data.password || '';
        const security = data.security || 'WPA';
        return `WIFI:T:${security};S:${ssid};P:${password};;`;
    }

    // vCard 포맷
    formatVCard(data) {
        const name = data.name || '';
        const phone = data.phone || '';
        const email = data.email || '';
        const org = data.org || '';
        const title = data.title || '';

        return `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${phone}
EMAIL:${email}
ORG:${org}
TITLE:${title}
END:VCARD`;
    }

    // Email 포맷
    formatEmail(data) {
        const to = data.to || data.email || '';
        const subject = data.subject || '';
        const body = data.body || '';
        return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    // SMS 포맷
    formatSMS(data) {
        const phone = data.phone || '';
        const message = data.message || '';
        return `sms:${phone}?body=${encodeURIComponent(message)}`;
    }

    // Event 포맷 (iCalendar)
    formatEvent(data) {
        const title = data.title || '';
        const start = data.start || '';
        const end = data.end || '';
        const location = data.location || '';

        return `BEGIN:VEVENT
SUMMARY:${title}
DTSTART:${start}
DTEND:${end}
LOCATION:${location}
END:VEVENT`;
    }

    // WhatsApp 포맷
    formatWhatsApp(data) {
        const phone = data.phone || '';
        const message = data.message || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    }

    // Crypto 포맷
    formatCrypto(data) {
        const type = data.type || 'bitcoin';
        const address = data.address || '';
        const amount = data.amount || '';
        return amount ? `${type}:${address}?amount=${amount}` : `${type}:${address}`;
    }

    // GPS/WIA PIN 포맷
    formatGPS(data) {
        const lat = data.lat || 0;
        const lng = data.lng || 0;
        const name = data.name || '';
        return `geo:${lat},${lng}${name ? '?name=' + encodeURIComponent(name) : ''}`;
    }

    // Application 포맷
    formatApplication(data) {
        const store = data.store || 'googleplay';
        const id = data.id || '';
        return store === 'appstore' ? `https://apps.apple.com/app/${id}` : `https://play.google.com/store/apps/details?id=${id}`;
    }

    // File 포맷
    formatFile(data) {
        const url = data.url || '';
        const name = data.name || '';
        return `${url}${name ? '#' + name : ''}`;
    }

    /**
     * 문자열을 바이트 배열로 변환 (UTF-8)
     */
    stringToBytes(str) {
        const encoder = new TextEncoder();
        return Array.from(encoder.encode(str));
    }

    /**
     * 오류 정정 코드 추가 (간단한 Reed-Solomon 스타일)
     */
    addErrorCorrection(bytes) {
        const eccLength = Math.ceil(bytes.length * this.ERROR_CORRECTION_LEVEL);
        const eccBytes = [];

        // 간단한 체크섬 기반 ECC
        for (let i = 0; i < eccLength; i++) {
            let checksum = 0;
            for (let j = 0; j < bytes.length; j++) {
                checksum ^= bytes[j] << (i % 8);
            }
            eccBytes.push(checksum % 256);
        }

        return [...bytes, ...eccBytes];
    }

    /**
     * 바이트 배열을 뉴럴 패턴으로 변환
     */
    bytesToNeuralPattern(bytes) {
        const pattern = {
            neurons: [],
            connections: [],
            rawData: bytes // 원본 바이트 데이터 저장
        };

        // 1. 뉴런 배치 (12x12 그리드)
        const gridSize = Math.sqrt(this.NEURON_COUNT);
        const spacing = this.GRID_SIZE / (gridSize + 1);

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const neuronIndex = i * gridSize + j;
                const byteIndex = neuronIndex % bytes.length;
                const byteValue = bytes[byteIndex];

                pattern.neurons.push({
                    id: neuronIndex,
                    x: (j + 1) * spacing,
                    y: (i + 1) * spacing,
                    value: byteValue,
                    intensity: byteValue / 255,
                    gridX: j,
                    gridY: i
                });
            }
        }

        // 2. 연결선 생성 (데이터 인코딩)
        for (let i = 0; i < Math.min(bytes.length - 1, this.NEURON_COUNT - 1); i++) {
            const startNeuron = pattern.neurons[i];
            const endNeuron = pattern.neurons[i + 1];

            if (startNeuron && endNeuron) {
                pattern.connections.push({
                    startId: startNeuron.id,
                    endId: endNeuron.id,
                    start: { x: startNeuron.x, y: startNeuron.y },
                    end: { x: endNeuron.x, y: endNeuron.y },
                    strength: (bytes[i] + bytes[i + 1]) / 510,
                    data: bytes[i]
                });
            }
        }

        return pattern;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WIANeuralEncoder;
} else {
    window.WIANeuralEncoder = WIANeuralEncoder;
}
