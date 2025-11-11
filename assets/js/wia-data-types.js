/**
 * ============================================================================
 * 🌐 WIA Neural Code - Universal Data Format System
 * ============================================================================
 *
 * "모든 정보를 담는다" - 27+ Data Types
 *
 * Phase 1 (9KB):  ~28 bytes 실제 용량
 * Phase 4 (100KB): ~756 bytes 실제 용량
 */

/**
 * WIA 데이터 타입 정의
 * Type ID: 1 byte (0x00 ~ 0xFF)
 */
const WIADataTypes = {
    // ========== 정적 WIA (0x01 ~ 0x0F) ==========
    TEXT: 0x01,              // 📝 일반 텍스트
    SMS: 0x02,               // 💬 SMS 문자 메시지
    WIFI: 0x03,              // 📶 WiFi 네트워크
    VCARD_STATIC: 0x04,      // 👤 정적 vCard
    EVENT: 0x05,             // 📅 캘린더 이벤트
    DNA: 0x06,               // 🧬 DNA/유전자 정보
    MEDICAL: 0x07,           // 🏥 의료 정보
    LOCATION: 0x08,          // 🌍 WIA PIN Code (위치)
    CRYPTO_KEY: 0x09,        // 🔐 암호화 키
    IOT_CONFIG: 0x0A,        // 📊 IoT 설정
    TICKET: 0x0B,            // 🎫 티켓/패스
    HUMAN_PROOF: 0x0C,       // 🧠 휴먼 증명

    // ========== 동적 WIA (0x11 ~ 0x1F) ==========
    URL: 0x11,               // 🔗 웹사이트 URL
    EMAIL: 0x12,             // 📧 이메일
    PHONE: 0x13,             // 📞 전화번호
    SMS_ACTION: 0x14,        // 📱 SMS 액션
    VCARD_DYNAMIC: 0x15,     // 👥 동적 vCard
    APP_STORE: 0x16,         // 📱 앱 스토어 링크
    FILE: 0x17,              // 📎 파일 다운로드
    WHATSAPP: 0x18,          // 💚 WhatsApp
    CRYPTOCURRENCY: 0x19,    // ₿ 암호화폐 지갑
    AI_PROMPT: 0x1A,         // 🤖 AI 프롬프트
    GAME_INVITE: 0x1B,       // 🎮 게임 초대
    PRESCRIPTION: 0x1C,      // 💊 디지털 처방전
    STORE_INFO: 0x1D,        // 🏪 상점 정보
    VEHICLE: 0x1E,           // 🚗 차량 정보
    BLUETOOTH: 0x1F,         // 📡 블루투스

    // ========== 100KB 전용 - 미디어 (0x20 ~ 0x2F) ==========
    HTML_PAGE: 0x20,         // 🌐 완전한 HTML 페이지
    JAVASCRIPT_APP: 0x21,    // ⚡ JavaScript 앱
    JPEG_IMAGE: 0x22,        // 🖼️ JPEG 이미지
    WEBP_IMAGE: 0x23,        // 🎨 WebP 이미지
    MP3_AUDIO: 0x24,         // 🎵 MP3 오디오
    OPUS_AUDIO: 0x25,        // 🎤 Opus 오디오
    GIF_ANIMATION: 0x26,     // 🎬 GIF 애니메이션
    H264_VIDEO: 0x27,        // 📹 H.264 비디오
    PDF_DOCUMENT: 0x28,      // 📄 PDF 문서
    EPUB_BOOK: 0x29,         // 📚 ePub 전자책

    // ========== 100KB 전용 - 복합 데이터 (0x30 ~ 0x3F) ==========
    IDENTITY_PACKAGE: 0x30,  // 🆔 완전한 신원 정보
    EDUCATION: 0x31,         // 🎓 교육 콘텐츠
    DISASTER_INFO: 0x32,     // 🚨 재난 정보 패키지
    MEDICAL_RECORD: 0x33,    // 🏥 전자 의료 기록
    TRAVEL_GUIDE: 0x34,      // ✈️ 여행 가이드
    PRODUCT_CATALOG: 0x35,   // 🛍️ 제품 카탈로그
    BUSINESS_CARD: 0x36,     // 💼 비즈니스 카드 플러스
    RESUME: 0x37,            // 📋 이력서 + 포트폴리오
    MINI_WEBSITE: 0x38,      // 🌐 미니 웹사이트
    INTERACTIVE_MANUAL: 0x39 // 📖 인터랙티브 매뉴얼
};

/**
 * 타입별 설명 및 스펙
 */
const WIATypeSpecs = {
    [WIADataTypes.TEXT]: {
        name: "텍스트",
        icon: "📝",
        category: "정적",
        maxSize: {
            phase1: 28,
            phase4: 756
        },
        format: "UTF-8 문자열",
        schema: {
            text: "string"
        },
        example: "Hello World! 안녕하세요!"
    },

    [WIADataTypes.URL]: {
        name: "URL",
        icon: "🔗",
        category: "동적",
        maxSize: {
            phase1: 28,
            phase4: 756
        },
        format: "URL 문자열",
        schema: {
            url: "string"
        },
        example: "https://example.com"
    },

    [WIADataTypes.VCARD_STATIC]: {
        name: "명함 (vCard)",
        icon: "👤",
        category: "정적",
        maxSize: {
            phase1: 28,  // 이름+전화번호만
            phase4: 756  // 완전한 vCard
        },
        format: "vCard 3.0",
        schema: {
            name: "string",
            phone: "string",
            email: "string",
            org: "string",
            title: "string",
            url: "string",
            address: "string",
            photo: "base64"  // Phase 4만
        },
        example: {
            name: "홍길동",
            phone: "+82-10-1234-5678",
            email: "hong@example.com",
            org: "WIA Corp",
            title: "CEO"
        }
    },

    [WIADataTypes.WIFI]: {
        name: "WiFi",
        icon: "📶",
        category: "정적",
        maxSize: {
            phase1: 28,
            phase4: 756
        },
        format: "WiFi Config",
        schema: {
            ssid: "string",
            password: "string",
            security: "string",  // WPA, WPA2, WEP, nopass
            hidden: "boolean"
        },
        example: {
            ssid: "MyWiFi",
            password: "password123",
            security: "WPA2",
            hidden: false
        }
    },

    [WIADataTypes.SMS]: {
        name: "SMS",
        icon: "💬",
        category: "정적",
        maxSize: {
            phase1: 28,
            phase4: 756
        },
        format: "SMS Message",
        schema: {
            phone: "string",
            message: "string"
        },
        example: {
            phone: "+82-10-1234-5678",
            message: "안녕하세요!"
        }
    },

    [WIADataTypes.EMAIL]: {
        name: "이메일",
        icon: "📧",
        category: "동적",
        maxSize: {
            phase1: 28,
            phase4: 756
        },
        format: "Email Message",
        schema: {
            to: "string",
            subject: "string",
            body: "string"
        },
        example: {
            to: "hello@example.com",
            subject: "안녕하세요",
            body: "이메일 본문..."
        }
    },

    [WIADataTypes.HTML_PAGE]: {
        name: "HTML 페이지",
        icon: "🌐",
        category: "100KB 전용",
        maxSize: {
            phase1: null,  // 불가능
            phase4: 756
        },
        format: "HTML + CSS + JS",
        schema: {
            html: "string",
            title: "string",
            meta: "object"
        },
        example: `<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    <style>body { font-family: sans-serif; }</style>
</head>
<body>
    <h1>Hello World!</h1>
</body>
</html>`
    },

    [WIADataTypes.JPEG_IMAGE]: {
        name: "JPEG 이미지",
        icon: "🖼️",
        category: "100KB 전용",
        maxSize: {
            phase1: null,
            phase4: 756
        },
        format: "JPEG Base64",
        schema: {
            image: "base64",
            width: "number",
            height: "number",
            title: "string"
        },
        example: {
            image: "data:image/jpeg;base64,/9j/4AAQ...",
            width: 800,
            height: 600,
            title: "My Photo"
        }
    },

    [WIADataTypes.MEDICAL]: {
        name: "의료 정보",
        icon: "🏥",
        category: "정적",
        maxSize: {
            phase1: 28,  // 혈액형+알레르기만
            phase4: 756  // 완전한 의료 기록
        },
        format: "Medical Record",
        schema: {
            bloodType: "string",
            allergies: "array",
            medications: "array",
            conditions: "array",
            emergencyContact: "string",
            emergencyPhone: "string"
        },
        example: {
            bloodType: "A+",
            allergies: ["페니실린", "땅콩"],
            medications: ["아스피린 100mg"],
            conditions: ["당뇨"],
            emergencyContact: "홍길동",
            emergencyPhone: "+82-10-1234-5678"
        }
    },

    [WIADataTypes.LOCATION]: {
        name: "위치 (PIN Code)",
        icon: "🌍",
        category: "정적",
        maxSize: {
            phase1: 28,
            phase4: 756
        },
        format: "GPS Coordinates + Plus Code",
        schema: {
            latitude: "number",
            longitude: "number",
            plusCode: "string",
            name: "string",
            address: "string"
        },
        example: {
            latitude: 37.5665,
            longitude: 126.9780,
            plusCode: "8Q98MXRH+2V",
            name: "서울시청",
            address: "서울특별시 중구"
        }
    }
};

/**
 * WIA 데이터 패키지 구조
 *
 * [TYPE_ID (1 byte)]
 * [DATA_LENGTH (2 bytes, little-endian)]
 * [DATA (N bytes)]
 * [CRC32 (4 bytes)]
 * [PARITY (1 byte)]
 *
 * 총 오버헤드: 8 bytes
 */
class WIADataPackage {
    /**
     * 데이터를 WIA 패키지로 변환
     */
    static pack(typeId, data) {
        // 1. 데이터를 JSON 또는 문자열로 직렬화
        let dataString;
        if (typeof data === 'string') {
            dataString = data;
        } else {
            dataString = JSON.stringify(data);
        }

        // 2. UTF-8 인코딩
        const encoder = new TextEncoder();
        const dataBytes = Array.from(encoder.encode(dataString));

        // 3. CRC32 계산
        const checksum = this.crc32(dataString);
        const checksumBytes = [
            (checksum >>> 24) & 0xFF,
            (checksum >>> 16) & 0xFF,
            (checksum >>> 8) & 0xFF,
            checksum & 0xFF
        ];

        // 4. 패리티 계산
        const parity = this.generateParity(dataBytes);

        // 5. 패키지 조립
        const dataLength = dataBytes.length;
        const package = [
            typeId,                        // Type ID (1 byte)
            dataLength & 0xFF,             // Length low byte
            (dataLength >>> 8) & 0xFF,     // Length high byte
            ...dataBytes,                  // Data
            ...checksumBytes,              // CRC32 (4 bytes)
            parity                         // Parity (1 byte)
        ];

        console.log(`📦 WIA 패키지 생성:`);
        console.log(`  - Type: 0x${typeId.toString(16).toUpperCase()} (${this.getTypeName(typeId)})`);
        console.log(`  - Data: ${dataLength} bytes`);
        console.log(`  - Total: ${package.length} bytes (오버헤드: 8 bytes)`);
        console.log(`  - CRC32: 0x${checksum.toString(16).toUpperCase()}`);

        return package;
    }

    /**
     * WIA 패키지를 데이터로 복원
     */
    static unpack(packageBytes) {
        if (packageBytes.length < 8) {
            throw new Error(`패키지가 너무 짧음: ${packageBytes.length} bytes`);
        }

        // 1. 헤더 파싱
        const typeId = packageBytes[0];
        const dataLength = packageBytes[1] | (packageBytes[2] << 8);

        console.log(`📤 WIA 패키지 언패킹:`);
        console.log(`  - Type: 0x${typeId.toString(16).toUpperCase()} (${this.getTypeName(typeId)})`);
        console.log(`  - 선언된 길이: ${dataLength} bytes`);

        // 2. 데이터 추출
        const dataBytes = packageBytes.slice(3, 3 + dataLength);

        // 3. CRC32 추출 및 검증
        const crc32Start = 3 + dataLength;
        let expectedCRC32 = 0;
        if (packageBytes.length >= crc32Start + 4) {
            expectedCRC32 = (
                (packageBytes[crc32Start] << 24) |
                (packageBytes[crc32Start + 1] << 16) |
                (packageBytes[crc32Start + 2] << 8) |
                packageBytes[crc32Start + 3]
            ) >>> 0;
        }

        // 4. 패리티 추출 및 검증
        const parityIndex = crc32Start + 4;
        const expectedParity = packageBytes.length > parityIndex ? packageBytes[parityIndex] : 0;

        // 5. UTF-8 디코딩
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const dataString = decoder.decode(new Uint8Array(dataBytes));

        // 6. CRC32 검증
        const actualCRC32 = this.crc32(dataString);
        const crcValid = (actualCRC32 === expectedCRC32);

        // 7. 패리티 검증
        const parityValid = this.verifyParity(dataBytes, expectedParity);

        // 8. JSON 파싱 시도
        let data;
        try {
            data = JSON.parse(dataString);
        } catch (e) {
            data = dataString;  // JSON이 아니면 문자열 그대로
        }

        console.log(`  - 복원된 데이터: ${dataString.substring(0, 50)}${dataString.length > 50 ? '...' : ''}`);
        console.log(`  - CRC32: ${crcValid ? '✅' : '❌'}`);
        console.log(`  - 패리티: ${parityValid ? '✅' : '❌'}`);

        return {
            typeId,
            typeName: this.getTypeName(typeId),
            data,
            dataLength,
            crcValid,
            parityValid,
            reliability: crcValid && parityValid ? '99.9%' : crcValid ? '95%' : '85%'
        };
    }

    /**
     * CRC32 계산
     */
    static crc32(str) {
        const crcTable = [];
        for (let i = 0; i < 256; i++) {
            let crc = i;
            for (let j = 0; j < 8; j++) {
                crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
            }
            crcTable[i] = crc;
        }
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < str.length; i++) {
            const byte = str.charCodeAt(i);
            crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xFF];
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    /**
     * 패리티 생성
     */
    static generateParity(bytes) {
        let parity = 0;
        for (let i = 0; i < bytes.length; i++) {
            parity ^= bytes[i];
        }
        return parity;
    }

    /**
     * 패리티 검증
     */
    static verifyParity(bytes, expectedParity) {
        let parity = 0;
        for (let i = 0; i < bytes.length; i++) {
            parity ^= bytes[i];
        }
        return parity === expectedParity;
    }

    /**
     * 타입 이름 가져오기
     */
    static getTypeName(typeId) {
        for (const [key, value] of Object.entries(WIADataTypes)) {
            if (value === typeId) {
                return WIATypeSpecs[typeId]?.name || key;
            }
        }
        return `Unknown (0x${typeId.toString(16)})`;
    }

    /**
     * 타입 아이콘 가져오기
     */
    static getTypeIcon(typeId) {
        return WIATypeSpecs[typeId]?.icon || '❓';
    }
}

console.log('🌐 WIA Universal Data Format System 로드 완료!');
console.log(`  - 지원 타입: ${Object.keys(WIADataTypes).length}개`);
console.log(`  - 정적 WIA: 12개`);
console.log(`  - 동적 WIA: 15개`);
console.log(`  - 100KB 전용: 20개`);
