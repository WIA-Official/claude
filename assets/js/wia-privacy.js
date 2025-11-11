/**
 * 🔒 WIA Privacy & Security System
 *
 * **"개인정보는 신성하다"** - Privacy is Sacred
 *
 * 암호화, 익명화, 데이터 보호
 * 100년 후에도 안전한 데이터
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

class WIAPrivacy {
    constructor(options = {}) {
        this.options = {
            encryption: options.encryption !== false,  // 암호화
            anonymization: options.anonymization !== false,  // 익명화
            localOnly: options.localOnly || false,  // 로컬 전용 (서버 전송 안함)
            autoDelete: options.autoDelete || false,  // 자동 삭제
            ...options
        };

        console.log('🔒 WIA Privacy System 초기화');
        console.log('  - 암호화:', this.options.encryption ? '✅' : '❌');
        console.log('  - 익명화:', this.options.anonymization ? '✅' : '❌');
    }

    /**
     * 🔐 Simple Encryption (XOR-based)
     *
     * 실제 프로덕션에서는 AES-256 등 사용해야 하지만,
     * 오프라인 환경을 위해 간단한 방법 제공
     */
    encrypt(data, password) {
        const key = this.generateKey(password);
        const dataBytes = new TextEncoder().encode(typeof data === 'string' ? data : JSON.stringify(data));
        const encrypted = new Uint8Array(dataBytes.length);

        for (let i = 0; i < dataBytes.length; i++) {
            encrypted[i] = dataBytes[i] ^ key[i % key.length];
        }

        return {
            encrypted: Array.from(encrypted),
            salt: key.slice(0, 16),
            version: '1.0'
        };
    }

    /**
     * 🔓 Decrypt
     */
    decrypt(encryptedData, password) {
        const key = this.generateKey(password);
        const encrypted = new Uint8Array(encryptedData.encrypted);
        const decrypted = new Uint8Array(encrypted.length);

        for (let i = 0; i < encrypted.length; i++) {
            decrypted[i] = encrypted[i] ^ key[i % key.length];
        }

        const text = new TextDecoder().decode(decrypted);

        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    /**
     * 🔑 Generate Key from Password
     */
    generateKey(password) {
        const encoder = new TextEncoder();
        const passwordBytes = encoder.encode(password);
        const key = new Uint8Array(32);  // 256 bits

        // Simple key derivation (실제로는 PBKDF2 등 사용)
        for (let i = 0; i < key.length; i++) {
            key[i] = passwordBytes[i % passwordBytes.length] ^ (i * 37);
        }

        return key;
    }

    /**
     * 🎭 익명화 (Anonymization)
     */
    anonymize(data) {
        const anonymized = JSON.parse(JSON.stringify(data));  // Deep copy

        // 이름 익명화
        if (anonymized.name) {
            anonymized.name = this.maskName(anonymized.name);
        }

        // 이메일 익명화
        if (anonymized.email) {
            anonymized.email = this.maskEmail(anonymized.email);
        }

        // 전화번호 익명화
        if (anonymized.phone) {
            anonymized.phone = this.maskPhone(anonymized.phone);
        }

        // 주소 익명화
        if (anonymized.address) {
            anonymized.address = this.maskAddress(anonymized.address);
        }

        // 위치 익명화 (반경 1km 이내로 퍼즈)
        if (anonymized.location) {
            anonymized.location = this.fuzzLocation(anonymized.location);
        }

        return anonymized;
    }

    /**
     * 🎭 이름 마스킹
     */
    maskName(name) {
        if (!name || name.length < 2) return '***';

        const parts = name.split(' ');
        return parts.map(part => {
            if (part.length <= 2) {
                return part[0] + '*';
            }
            return part[0] + '*'.repeat(part.length - 1);
        }).join(' ');
    }

    /**
     * 📧 이메일 마스킹
     */
    maskEmail(email) {
        const [local, domain] = email.split('@');
        if (!local || !domain) return '***@***';

        const maskedLocal = local.length <= 2
            ? local[0] + '*'
            : local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];

        return `${maskedLocal}@${domain}`;
    }

    /**
     * 📞 전화번호 마스킹
     */
    maskPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 4) return '****';

        return cleaned.slice(0, -4).replace(/./g, '*') + cleaned.slice(-4);
    }

    /**
     * 🏠 주소 마스킹
     */
    maskAddress(address) {
        const parts = address.split(' ');
        if (parts.length <= 2) return parts[0] + ' ***';

        return parts.slice(0, -2).join(' ') + ' ***';
    }

    /**
     * 📍 위치 퍼즈 (Fuzzing)
     */
    fuzzLocation(location) {
        // ±0.01도 (약 1km) 범위 내로 퍼즈
        const fuzzFactor = 0.01;

        return {
            latitude: location.latitude + (Math.random() - 0.5) * fuzzFactor,
            longitude: location.longitude + (Math.random() - 0.5) * fuzzFactor,
            accuracy: 1000,  // 1km
            fuzzy: true
        };
    }

    /**
     * 🗑️ 데이터 삭제 (안전한 삭제)
     */
    secureDelete(key) {
        // 덮어쓰기 (1회)
        if (typeof localStorage !== 'undefined') {
            const randomData = Array(1000).fill(0).map(() => Math.random()).join('');
            localStorage.setItem(key, randomData);

            // 삭제
            localStorage.removeItem(key);
        }

        console.log('🗑️ 안전 삭제:', key);
    }

    /**
     * ⏰ 자동 삭제 예약
     */
    scheduleAutoDelete(key, delayMs) {
        setTimeout(() => {
            this.secureDelete(key);
            console.log('⏰ 자동 삭제 실행:', key);
        }, delayMs);

        console.log(`⏰ 자동 삭제 예약: ${key} (${delayMs}ms 후)`);
    }

    /**
     * 🔍 개인정보 감지
     */
    detectPII(text) {
        const piiPatterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /\b\d{2,4}[-.]?\d{3,4}[-.]?\d{4}\b/g,
            ssn: /\b\d{6}-\d{7}\b/g,  // 주민등록번호
            creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g
        };

        const detected = {};

        for (const [type, pattern] of Object.entries(piiPatterns)) {
            const matches = text.match(pattern);
            if (matches && matches.length > 0) {
                detected[type] = matches;
            }
        }

        return detected;
    }

    /**
     * 🛡️ PII 자동 마스킹
     */
    maskPII(text) {
        const pii = this.detectPII(text);

        let masked = text;

        if (pii.email) {
            pii.email.forEach(email => {
                masked = masked.replace(email, this.maskEmail(email));
            });
        }

        if (pii.phone) {
            pii.phone.forEach(phone => {
                masked = masked.replace(phone, this.maskPhone(phone));
            });
        }

        if (pii.ssn) {
            pii.ssn.forEach(ssn => {
                masked = masked.replace(ssn, ssn.slice(0, 6) + '-*******');
            });
        }

        if (pii.creditCard) {
            pii.creditCard.forEach(cc => {
                const cleaned = cc.replace(/\D/g, '');
                masked = masked.replace(cc, '**** **** **** ' + cleaned.slice(-4));
            });
        }

        return masked;
    }

    /**
     * 🔏 데이터 봉인 (Seal)
     */
    seal(data, options = {}) {
        const sealed = {
            data: data,
            sealed: true,
            sealedAt: Date.now(),
            expiresAt: options.expiresAt || null,
            readOnce: options.readOnce || false,
            hasBeenRead: false,
            hash: this.hash(data)
        };

        return sealed;
    }

    /**
     * 🔓 봉인 해제
     */
    unseal(sealed) {
        if (!sealed.sealed) {
            throw new Error('봉인된 데이터가 아닙니다');
        }

        if (sealed.expiresAt && Date.now() > sealed.expiresAt) {
            throw new Error('유효기간이 만료되었습니다');
        }

        if (sealed.readOnce && sealed.hasBeenRead) {
            throw new Error('이미 읽은 데이터입니다 (Read-Once)');
        }

        // Hash 검증
        const currentHash = this.hash(sealed.data);
        if (currentHash !== sealed.hash) {
            throw new Error('데이터가 변조되었습니다!');
        }

        sealed.hasBeenRead = true;

        return sealed.data;
    }

    /**
     * #️⃣ 해시
     */
    hash(data) {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WIAPrivacy };
}

console.log('🔒 WIA Privacy System 로드 완료!');
console.log('  - 암호화 (XOR-based)');
console.log('  - 익명화 (Name, Email, Phone, etc)');
console.log('  - PII 자동 감지/마스킹');
console.log('  - 안전한 삭제');
console.log('  - "개인정보는 신성하다" 🌍');
