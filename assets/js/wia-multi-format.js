/**
 * ============================================================================
 * 🎁 WIA Multi-Format System - Universal Data Handler
 * ============================================================================
 *
 * "모든 것을 담는다" - 기존 엔진 위에 구축된 멀티포맷 레이어
 *
 * Dependencies:
 * - wia-data-types.js
 * - wia-engine-BEAUTIFUL-QR.js (Phase 1)
 * - wia-engine-100KB.js (Phase 4)
 * - wia-neural-decoder.js (Phase 1)
 * - wia-neural-decoder-100KB.js (Phase 4)
 */

/**
 * WIA 멀티포맷 Generator
 * 모든 데이터 타입을 자동으로 처리
 */
class WIAMultiFormat {
    constructor(canvas, phase = 1) {
        this.canvas = canvas;
        this.phase = phase;

        // Phase에 맞는 엔진 선택
        if (phase === 1) {
            this.engine = new WIANeuralEngine(canvas);
            this.decoder = new WIANeuralDecoder();
            this.maxCapacity = 28;  // 중복 저장으로 실제 용량
        } else if (phase === 4) {
            this.engine = new WIANeuralEngine100KB(canvas);
            this.decoder = new WIANeuralDecoder100KB();
            this.maxCapacity = 756;  // 중복 저장으로 실제 용량
        } else {
            throw new Error(`지원하지 않는 Phase: ${phase}`);
        }

        console.log(`🎁 WIA MultiFormat 초기화! (Phase ${phase})`);
        console.log(`  - 최대 용량: ${this.maxCapacity} bytes`);
    }

    /**
     * 데이터를 WIA Neural Code로 생성
     *
     * @param {number} typeId - WIADataTypes에서 선택
     * @param {*} data - 데이터 (타입에 맞는 형식)
     * @param {string} pattern - 'basic', 'complex', etc.
     * @param {string} safety - 'high', 'medium', 'low'
     */
    generate(typeId, data, pattern = 'complex', safety = 'high') {
        console.log(`\n🎨 === WIA 멀티포맷 생성 시작 ===`);
        console.log(`  - Phase: ${this.phase}`);
        console.log(`  - Type: 0x${typeId.toString(16).toUpperCase()} (${WIADataPackage.getTypeName(typeId)})`);
        console.log(`  - Icon: ${WIADataPackage.getTypeIcon(typeId)}`);

        // 1. 데이터 검증 및 변환
        const processedData = this.preprocessData(typeId, data);

        // 2. WIA 패키지로 변환
        const packageBytes = WIADataPackage.pack(typeId, processedData);

        // 3. 용량 체크
        if (packageBytes.length > this.maxCapacity) {
            throw new Error(
                `데이터가 너무 큽니다!\n` +
                `  - 현재: ${packageBytes.length} bytes\n` +
                `  - 최대: ${this.maxCapacity} bytes (Phase ${this.phase})\n` +
                `  - 초과: ${packageBytes.length - this.maxCapacity} bytes\n\n` +
                `해결 방법:\n` +
                `  ${this.phase === 1 ? '- Phase 4 (100KB)로 업그레이드\n  - 데이터 압축\n  - 데이터 일부 제거' : '- 데이터 압축\n  - 데이터 분할'}`
            );
        }

        // 4. 바이트 배열을 문자열로 변환 (기존 엔진 호환)
        const dataString = this.bytesToString(packageBytes);

        // 5. 기존 엔진으로 생성
        this.engine.generate(dataString, pattern, safety);

        console.log(`✅ 멀티포맷 생성 완료!`);
        console.log(`  - 실제 사용량: ${packageBytes.length}/${this.maxCapacity} bytes`);
        console.log(`  - 여유 공간: ${this.maxCapacity - packageBytes.length} bytes\n`);

        return {
            typeId,
            typeName: WIADataPackage.getTypeName(typeId),
            dataSize: packageBytes.length,
            capacity: this.maxCapacity,
            usage: ((packageBytes.length / this.maxCapacity) * 100).toFixed(1) + '%'
        };
    }

    /**
     * WIA Neural Code를 디코딩
     *
     * @param {HTMLCanvasElement} source - Canvas 또는 이미지
     * @param {boolean} useRetry - 멀티 스캔 재시도 사용 여부
     */
    async decode(source, useRetry = true) {
        console.log(`\n🔍 === WIA 멀티포맷 디코딩 시작 ===`);
        console.log(`  - Phase: ${this.phase}`);
        console.log(`  - 멀티 스캔: ${useRetry ? 'ON (최대 3회)' : 'OFF'}`);

        // 1. 기존 디코더로 디코딩
        let result;
        if (useRetry) {
            result = await this.decoder.decodeWithRetry(source, 3);
        } else {
            result = await this.decoder.decode(source);
        }

        // 2. 복원된 문자열을 바이트 배열로 변환
        const packageBytes = this.stringToBytes(result.data);

        // 3. WIA 패키지 언패킹
        const unpacked = WIADataPackage.unpack(packageBytes);

        // 4. 데이터 후처리
        const finalData = this.postprocessData(unpacked.typeId, unpacked.data);

        console.log(`\n🎉 === 멀티포맷 디코딩 성공! ===`);
        console.log(`  - Type: ${unpacked.typeName} ${WIADataPackage.getTypeIcon(unpacked.typeId)}`);
        console.log(`  - 신뢰도: ${unpacked.reliability}`);
        console.log(`  - CRC32: ${unpacked.crcValid ? '✅' : '❌'}`);
        console.log(`  - 패리티: ${unpacked.parityValid ? '✅' : '❌'}\n`);

        return {
            success: true,
            typeId: unpacked.typeId,
            typeName: unpacked.typeName,
            typeIcon: WIADataPackage.getTypeIcon(unpacked.typeId),
            data: finalData,
            reliability: unpacked.reliability,
            crcValid: unpacked.crcValid,
            parityValid: unpacked.parityValid,
            phase: this.phase
        };
    }

    /**
     * 타입별 전처리 (인코딩 전)
     */
    preprocessData(typeId, data) {
        switch (typeId) {
            case WIADataTypes.TEXT:
                return String(data);

            case WIADataTypes.URL:
                return String(data);

            case WIADataTypes.VCARD_STATIC:
            case WIADataTypes.VCARD_DYNAMIC:
                return this.encodeVCard(data);

            case WIADataTypes.WIFI:
                return this.encodeWiFi(data);

            case WIADataTypes.SMS:
            case WIADataTypes.SMS_ACTION:
                return this.encodeSMS(data);

            case WIADataTypes.EMAIL:
                return this.encodeEmail(data);

            case WIADataTypes.MEDICAL:
                return this.encodeMedical(data);

            case WIADataTypes.LOCATION:
                return this.encodeLocation(data);

            case WIADataTypes.HTML_PAGE:
                return this.encodeHTML(data);

            case WIADataTypes.JPEG_IMAGE:
            case WIADataTypes.WEBP_IMAGE:
                return this.encodeImage(data);

            default:
                // JSON으로 직렬화
                return typeof data === 'string' ? data : JSON.stringify(data);
        }
    }

    /**
     * 타입별 후처리 (디코딩 후)
     */
    postprocessData(typeId, data) {
        switch (typeId) {
            case WIADataTypes.VCARD_STATIC:
            case WIADataTypes.VCARD_DYNAMIC:
                return this.decodeVCard(data);

            case WIADataTypes.WIFI:
                return this.decodeWiFi(data);

            case WIADataTypes.SMS:
            case WIADataTypes.SMS_ACTION:
                return this.decodeSMS(data);

            case WIADataTypes.EMAIL:
                return this.decodeEmail(data);

            case WIADataTypes.MEDICAL:
                return this.decodeMedical(data);

            case WIADataTypes.LOCATION:
                return this.decodeLocation(data);

            case WIADataTypes.HTML_PAGE:
                return this.decodeHTML(data);

            case WIADataTypes.JPEG_IMAGE:
            case WIADataTypes.WEBP_IMAGE:
                return this.decodeImage(data);

            default:
                return data;
        }
    }

    /**
     * ========== 타입별 인코더 ==========
     */

    encodeVCard(data) {
        // vCard 3.0 format
        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        if (data.name) vcard += `FN:${data.name}\n`;
        if (data.phone) vcard += `TEL:${data.phone}\n`;
        if (data.email) vcard += `EMAIL:${data.email}\n`;
        if (data.org) vcard += `ORG:${data.org}\n`;
        if (data.title) vcard += `TITLE:${data.title}\n`;
        if (data.url) vcard += `URL:${data.url}\n`;
        if (data.address) vcard += `ADR:${data.address}\n`;
        if (data.photo && this.phase === 4) vcard += `PHOTO;ENCODING=BASE64:${data.photo}\n`;
        vcard += 'END:VCARD';
        return vcard;
    }

    decodeVCard(vcardString) {
        const lines = vcardString.split('\n');
        const vcard = {};
        lines.forEach(line => {
            if (line.startsWith('FN:')) vcard.name = line.substring(3);
            else if (line.startsWith('TEL:')) vcard.phone = line.substring(4);
            else if (line.startsWith('EMAIL:')) vcard.email = line.substring(6);
            else if (line.startsWith('ORG:')) vcard.org = line.substring(4);
            else if (line.startsWith('TITLE:')) vcard.title = line.substring(6);
            else if (line.startsWith('URL:')) vcard.url = line.substring(4);
            else if (line.startsWith('ADR:')) vcard.address = line.substring(4);
            else if (line.startsWith('PHOTO;')) {
                const photoData = line.split(':')[1];
                if (photoData) vcard.photo = photoData;
            }
        });
        return vcard;
    }

    encodeWiFi(data) {
        // WIFI:S:<SSID>;T:<WPA|WEP|>;P:<password>;H:<true|false>;;
        const security = data.security || 'WPA2';
        const hidden = data.hidden ? 'true' : 'false';
        return `WIFI:S:${data.ssid};T:${security};P:${data.password};H:${hidden};;`;
    }

    decodeWiFi(wifiString) {
        const parts = wifiString.split(';');
        const wifi = {};
        parts.forEach(part => {
            if (part.startsWith('S:')) wifi.ssid = part.substring(2);
            else if (part.startsWith('T:')) wifi.security = part.substring(2);
            else if (part.startsWith('P:')) wifi.password = part.substring(2);
            else if (part.startsWith('H:')) wifi.hidden = part.substring(2) === 'true';
        });
        return wifi;
    }

    encodeSMS(data) {
        return `SMSTO:${data.phone}:${data.message}`;
    }

    decodeSMS(smsString) {
        const parts = smsString.split(':');
        return {
            phone: parts[1],
            message: parts.slice(2).join(':')
        };
    }

    encodeEmail(data) {
        return `MAILTO:${data.to}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
    }

    decodeEmail(emailString) {
        const url = new URL(emailString);
        return {
            to: emailString.split(':')[1].split('?')[0],
            subject: decodeURIComponent(url.searchParams.get('subject') || ''),
            body: decodeURIComponent(url.searchParams.get('body') || '')
        };
    }

    encodeMedical(data) {
        return JSON.stringify(data);
    }

    decodeMedical(jsonString) {
        return JSON.parse(jsonString);
    }

    encodeLocation(data) {
        return JSON.stringify(data);
    }

    decodeLocation(jsonString) {
        return JSON.parse(jsonString);
    }

    encodeHTML(data) {
        return typeof data === 'string' ? data : data.html || '';
    }

    decodeHTML(htmlString) {
        return {
            html: htmlString,
            canRender: true
        };
    }

    encodeImage(data) {
        return JSON.stringify(data);
    }

    decodeImage(jsonString) {
        return JSON.parse(jsonString);
    }

    /**
     * ========== 유틸리티 함수 ==========
     */

    bytesToString(bytes) {
        // 바이트 배열을 특수 문자열로 변환 (기존 엔진 호환)
        // 각 바이트를 Unicode Private Use Area (U+E000~U+F8FF)로 매핑
        return bytes.map(b => String.fromCharCode(0xE000 + b)).join('');
    }

    stringToBytes(str) {
        // 특수 문자열을 바이트 배열로 복원
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code >= 0xE000 && code <= 0xE0FF) {
                bytes.push(code - 0xE000);
            }
        }
        return bytes;
    }

    /**
     * 용량 계산기
     */
    static calculateSize(typeId, data) {
        const packageBytes = WIADataPackage.pack(typeId, data);
        return {
            total: packageBytes.length,
            overhead: 8,
            actual: packageBytes.length - 8,
            phase1Fit: packageBytes.length <= 28,
            phase4Fit: packageBytes.length <= 756
        };
    }

    /**
     * 자동 Phase 선택
     */
    static selectPhase(typeId, data) {
        const size = this.calculateSize(typeId, data);
        if (size.phase1Fit) {
            return { phase: 1, reason: 'Phase 1로 충분' };
        } else if (size.phase4Fit) {
            return { phase: 4, reason: 'Phase 4 필요' };
        } else {
            throw new Error(`데이터가 너무 큽니다! (${size.total} bytes > 756 bytes)`);
        }
    }
}

/**
 * WIA 멀티포맷 렌더러
 * 디코딩된 데이터를 사용자에게 표시
 */
class WIARenderer {
    /**
     * 데이터를 HTML로 렌더링
     */
    static render(result, container) {
        container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'wia-render-result';
        wrapper.style.cssText = 'padding: 20px; border: 2px solid #667eea; border-radius: 10px; background: #f8f9ff;';

        // 헤더
        const header = document.createElement('div');
        header.style.cssText = 'font-size: 24px; font-weight: bold; margin-bottom: 15px;';
        header.textContent = `${result.typeIcon} ${result.typeName}`;
        wrapper.appendChild(header);

        // 신뢰도 표시
        const reliability = document.createElement('div');
        reliability.style.cssText = 'font-size: 14px; color: #666; margin-bottom: 20px;';
        reliability.innerHTML = `
            신뢰도: <strong>${result.reliability}</strong>
            ${result.crcValid ? '✅' : '❌'} CRC32
            ${result.parityValid ? '✅' : '❌'} Parity
        `;
        wrapper.appendChild(reliability);

        // 타입별 렌더링
        const content = document.createElement('div');
        content.style.cssText = 'background: white; padding: 15px; border-radius: 5px;';

        switch (result.typeId) {
            case WIADataTypes.TEXT:
                content.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word;">${this.escapeHTML(result.data)}</pre>`;
                break;

            case WIADataTypes.URL:
                content.innerHTML = `<a href="${result.data}" target="_blank" style="font-size: 18px; color: #667eea;">${this.escapeHTML(result.data)}</a>`;
                break;

            case WIADataTypes.VCARD_STATIC:
            case WIADataTypes.VCARD_DYNAMIC:
                content.innerHTML = this.renderVCard(result.data);
                break;

            case WIADataTypes.WIFI:
                content.innerHTML = this.renderWiFi(result.data);
                break;

            case WIADataTypes.SMS:
            case WIADataTypes.SMS_ACTION:
                content.innerHTML = this.renderSMS(result.data);
                break;

            case WIADataTypes.EMAIL:
                content.innerHTML = this.renderEmail(result.data);
                break;

            case WIADataTypes.MEDICAL:
                content.innerHTML = this.renderMedical(result.data);
                break;

            case WIADataTypes.LOCATION:
                content.innerHTML = this.renderLocation(result.data);
                break;

            case WIADataTypes.HTML_PAGE:
                content.innerHTML = `<iframe srcdoc="${this.escapeHTML(result.data.html)}" style="width: 100%; height: 500px; border: 1px solid #ddd;"></iframe>`;
                break;

            case WIADataTypes.JPEG_IMAGE:
            case WIADataTypes.WEBP_IMAGE:
                content.innerHTML = `<img src="${result.data.image}" alt="${result.data.title || 'Image'}" style="max-width: 100%; height: auto;" />`;
                break;

            default:
                content.innerHTML = `<pre>${JSON.stringify(result.data, null, 2)}</pre>`;
        }

        wrapper.appendChild(content);
        container.appendChild(wrapper);
    }

    static renderVCard(vcard) {
        return `
            <div style="font-family: sans-serif;">
                <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">${this.escapeHTML(vcard.name || '')}</div>
                ${vcard.title ? `<div style="color: #666; margin-bottom: 5px;">${this.escapeHTML(vcard.title)}</div>` : ''}
                ${vcard.org ? `<div style="color: #666; margin-bottom: 15px;">${this.escapeHTML(vcard.org)}</div>` : ''}
                ${vcard.phone ? `<div>📞 ${this.escapeHTML(vcard.phone)}</div>` : ''}
                ${vcard.email ? `<div>📧 ${this.escapeHTML(vcard.email)}</div>` : ''}
                ${vcard.url ? `<div>🔗 <a href="${vcard.url}" target="_blank">${this.escapeHTML(vcard.url)}</a></div>` : ''}
                ${vcard.address ? `<div>🏠 ${this.escapeHTML(vcard.address)}</div>` : ''}
            </div>
        `;
    }

    static renderWiFi(wifi) {
        return `
            <div style="font-family: sans-serif;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">📶 ${this.escapeHTML(wifi.ssid)}</div>
                <div>보안: ${this.escapeHTML(wifi.security)}</div>
                <div>비밀번호: <code>${this.escapeHTML(wifi.password)}</code></div>
                ${wifi.hidden ? '<div style="color: #ff9800;">⚠️ 숨겨진 네트워크</div>' : ''}
            </div>
        `;
    }

    static renderSMS(sms) {
        return `
            <div style="font-family: sans-serif;">
                <div style="font-size: 16px; margin-bottom: 10px;">받는 사람: <strong>${this.escapeHTML(sms.phone)}</strong></div>
                <div style="background: #e3f2fd; padding: 10px; border-radius: 5px;">${this.escapeHTML(sms.message)}</div>
            </div>
        `;
    }

    static renderEmail(email) {
        return `
            <div style="font-family: sans-serif;">
                <div><strong>To:</strong> ${this.escapeHTML(email.to)}</div>
                <div><strong>Subject:</strong> ${this.escapeHTML(email.subject)}</div>
                <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                    ${this.escapeHTML(email.body)}
                </div>
            </div>
        `;
    }

    static renderMedical(medical) {
        return `
            <div style="font-family: sans-serif;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">🩸 혈액형: ${this.escapeHTML(medical.bloodType || 'N/A')}</div>
                ${medical.allergies && medical.allergies.length > 0 ? `<div>⚠️ 알레르기: ${medical.allergies.join(', ')}</div>` : ''}
                ${medical.medications && medical.medications.length > 0 ? `<div>💊 복용약: ${medical.medications.join(', ')}</div>` : ''}
                ${medical.conditions && medical.conditions.length > 0 ? `<div>🏥 질환: ${medical.conditions.join(', ')}</div>` : ''}
                ${medical.emergencyContact ? `<div style="margin-top: 15px; padding: 10px; background: #ffebee; border-radius: 5px;">
                    🚨 <strong>응급 연락처</strong><br>
                    ${this.escapeHTML(medical.emergencyContact)}: ${this.escapeHTML(medical.emergencyPhone || '')}
                </div>` : ''}
            </div>
        `;
    }

    static renderLocation(location) {
        const mapUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
        return `
            <div style="font-family: sans-serif;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">${this.escapeHTML(location.name || '위치')}</div>
                ${location.address ? `<div style="margin-bottom: 10px;">${this.escapeHTML(location.address)}</div>` : ''}
                <div>📍 ${location.latitude}, ${location.longitude}</div>
                ${location.plusCode ? `<div>Plus Code: ${this.escapeHTML(location.plusCode)}</div>` : ''}
                <div style="margin-top: 10px;">
                    <a href="${mapUrl}" target="_blank" style="color: #667eea;">🗺️ 지도에서 보기</a>
                </div>
            </div>
        `;
    }

    static escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

console.log('🎁 WIA Multi-Format System 로드 완료!');
console.log('  - Generator: WIAMultiFormat');
console.log('  - Renderer: WIARenderer');
console.log('  - Phase 1 & 4 모두 지원');
