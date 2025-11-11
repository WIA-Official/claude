/**
 * ♿ WIA Accessibility System
 *
 * **"모든 인간을 위한 기술"** - Universal Design
 *
 * 시각 장애인, 청각 장애인, 노인, 어린이
 * 누구나 WIA Neural Code를 사용할 수 있어야 합니다.
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

class WIAAccessibility {
    constructor(options = {}) {
        this.options = {
            screenReader: options.screenReader !== false,  // 스크린 리더 지원
            audioFeedback: options.audioFeedback !== false,  // 음성 피드백
            hapticFeedback: options.hapticFeedback !== false,  // 진동 피드백
            highContrast: options.highContrast || false,  // 고대비 모드
            largeText: options.largeText || false,  // 큰 텍스트
            slowMotion: options.slowMotion || false,  // 슬로우 모션
            ...options
        };

        // 음성 합성
        this.synth = window.speechSynthesis;
        this.voices = [];

        // 음성 로드
        if (this.synth) {
            this.loadVoices();
            this.synth.addEventListener('voiceschanged', () => this.loadVoices());
        }

        // AudioContext for audio feedback
        this.audioContext = null;
        if (typeof AudioContext !== 'undefined') {
            this.audioContext = new AudioContext();
        }

        console.log('♿ WIA Accessibility System 초기화');
        console.log('  - 스크린 리더:', this.options.screenReader ? '✅' : '❌');
        console.log('  - 음성 피드백:', this.options.audioFeedback ? '✅' : '❌');
        console.log('  - 진동 피드백:', this.options.hapticFeedback ? '✅' : '❌');
    }

    /**
     * 🔊 음성 로드
     */
    loadVoices() {
        this.voices = this.synth.getVoices();
        // 한국어 음성 우선
        this.koreanVoice = this.voices.find(v => v.lang.startsWith('ko')) || this.voices[0];
        console.log('🔊 음성 로드:', this.voices.length, '개');
    }

    /**
     * 🗣️ 텍스트 읽기 (TTS - Text To Speech)
     *
     * @param {string} text - 읽을 텍스트
     * @param {Object} options - { lang, rate, pitch, volume }
     */
    speak(text, options = {}) {
        if (!this.options.audioFeedback || !this.synth) {
            console.log('🔇 음성 피드백 비활성화');
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            // 진행 중인 음성 중단
            this.synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = options.lang || 'ko-KR';
            utterance.rate = options.rate || 1.0;  // 속도 (0.1 ~ 10)
            utterance.pitch = options.pitch || 1.0;  // 음높이 (0 ~ 2)
            utterance.volume = options.volume || 1.0;  // 볼륨 (0 ~ 1)

            // 한국어 음성 사용
            if (this.koreanVoice && utterance.lang.startsWith('ko')) {
                utterance.voice = this.koreanVoice;
            }

            utterance.onend = () => resolve();
            utterance.onerror = (e) => {
                console.error('❌ TTS 오류:', e);
                resolve();
            };

            this.synth.speak(utterance);
            console.log('🗣️ 음성 출력:', text);
        });
    }

    /**
     * 📢 WIA 코드 설명 읽기
     */
    async describeWIACode(result) {
        const typeName = result.typeName || '알 수 없는 타입';
        const reliability = result.reliability || '알 수 없음';

        let description = `WIA Neural Code가 감지되었습니다. `;
        description += `타입은 ${typeName}입니다. `;
        description += `신뢰도는 ${reliability}입니다. `;

        // 타입별 상세 설명
        switch (result.typeId) {
            case 0x01: // TEXT
                description += `텍스트 내용: ${result.data}`;
                break;

            case 0x02: // SMS
                description += `문자 메시지입니다. `;
                description += `받는 사람: ${result.data.phone}. `;
                description += `내용: ${result.data.message}`;
                break;

            case 0x03: // WiFi
                description += `와이파이 설정입니다. `;
                description += `네트워크 이름: ${result.data.ssid}. `;
                description += `보안: ${result.data.security}`;
                break;

            case 0x04: // vCard
                description += `명함입니다. `;
                description += `이름: ${result.data.name}. `;
                if (result.data.phone) description += `전화번호: ${result.data.phone}. `;
                if (result.data.email) description += `이메일: ${result.data.email}. `;
                if (result.data.org) description += `소속: ${result.data.org}`;
                break;

            case 0x07: // Medical
                description += `의료 정보입니다. `;
                description += `혈액형: ${result.data.bloodType}. `;
                if (result.data.allergies && result.data.allergies.length > 0) {
                    description += `알레르기: ${result.data.allergies.join(', ')}. `;
                }
                if (result.data.emergencyContact) {
                    description += `응급 연락처: ${result.data.emergencyContact}, ${result.data.emergencyPhone}`;
                }
                break;

            case 0x11: // URL
                description += `웹사이트 링크입니다. 주소: ${result.data}`;
                break;

            case 0x12: // Email
                description += `이메일 작성입니다. `;
                description += `받는 사람: ${result.data.to}. `;
                description += `제목: ${result.data.subject}`;
                break;

            default:
                description += `데이터를 확인하세요.`;
        }

        await this.speak(description);
        return description;
    }

    /**
     * 🔔 비프음 (Beep)
     *
     * @param {number} frequency - 주파수 (Hz)
     * @param {number} duration - 지속 시간 (ms)
     * @param {number} volume - 볼륨 (0~1)
     */
    beep(frequency = 440, duration = 200, volume = 0.3) {
        if (!this.audioContext) {
            console.log('🔇 AudioContext 지원 안됨');
            return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }

    /**
     * ✅ 성공 사운드
     */
    playSuccessSound() {
        this.beep(523, 100, 0.2);  // C5
        setTimeout(() => this.beep(659, 100, 0.2), 100);  // E5
        setTimeout(() => this.beep(784, 200, 0.2), 200);  // G5
    }

    /**
     * ❌ 오류 사운드
     */
    playErrorSound() {
        this.beep(400, 100, 0.2);
        setTimeout(() => this.beep(350, 100, 0.2), 100);
        setTimeout(() => this.beep(300, 200, 0.2), 200);
    }

    /**
     * ⚠️ 경고 사운드
     */
    playWarningSound() {
        this.beep(600, 150, 0.2);
        setTimeout(() => this.beep(600, 150, 0.2), 300);
    }

    /**
     * 📳 진동 피드백 (Haptic Feedback)
     *
     * @param {number|Array} pattern - 진동 패턴 (ms)
     */
    vibrate(pattern = 200) {
        if (!this.options.hapticFeedback) {
            return;
        }

        if (navigator.vibrate) {
            navigator.vibrate(pattern);
            console.log('📳 진동:', pattern);
        }
    }

    /**
     * ✅ 성공 진동
     */
    vibrateSuccess() {
        this.vibrate([100, 50, 100]);
    }

    /**
     * ❌ 오류 진동
     */
    vibrateError() {
        this.vibrate([200, 100, 200]);
    }

    /**
     * 🎨 고대비 모드 적용
     */
    applyHighContrast(element) {
        if (!this.options.highContrast) return;

        element.style.filter = 'contrast(150%) brightness(110%)';
        element.style.fontWeight = 'bold';
        console.log('🎨 고대비 모드 적용');
    }

    /**
     * 📏 큰 텍스트 모드
     */
    applyLargeText(element) {
        if (!this.options.largeText) return;

        const currentSize = parseFloat(window.getComputedStyle(element).fontSize);
        element.style.fontSize = (currentSize * 1.5) + 'px';
        console.log('📏 큰 텍스트 모드 적용');
    }

    /**
     * ⌨️ 키보드 네비게이션
     *
     * 마우스 없이도 사용 가능
     */
    enableKeyboardNavigation(elements) {
        elements.forEach((element, index) => {
            element.setAttribute('tabindex', index);
            element.setAttribute('role', 'button');
            element.setAttribute('aria-label', element.textContent || `요소 ${index + 1}`);

            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    element.click();
                    this.speak(`${element.getAttribute('aria-label')} 선택됨`);
                }
            });
        });

        console.log('⌨️ 키보드 네비게이션 활성화:', elements.length, '개');
    }

    /**
     * 🔍 포커스 인디케이터
     */
    addFocusIndicator(element) {
        element.style.outline = '3px solid #667eea';
        element.style.outlineOffset = '2px';
    }

    /**
     * 📱 ARIA 레이블 추가
     */
    addARIALabel(element, label, description) {
        element.setAttribute('aria-label', label);
        if (description) {
            element.setAttribute('aria-describedby', description);
        }
    }

    /**
     * 🎬 스크린 리더 알림
     */
    announceToScreenReader(message) {
        if (!this.options.screenReader) return;

        // Live region 생성
        let liveRegion = document.getElementById('wia-sr-live');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'wia-sr-live';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = message;
        console.log('📢 스크린 리더:', message);
    }

    /**
     * 🎯 WIA 코드 스캔 안내
     */
    async guideScanning() {
        await this.speak('WIA Neural Code 스캔을 시작합니다. 카메라를 코드에 맞춰주세요.');
        this.announceToScreenReader('스캔 시작');
    }

    /**
     * ✅ 스캔 성공 안내
     */
    async guideScanSuccess(result) {
        this.playSuccessSound();
        this.vibrateSuccess();
        await this.speak('스캔 성공!');
        await this.describeWIACode(result);
        this.announceToScreenReader('스캔 성공: ' + result.typeName);
    }

    /**
     * ❌ 스캔 실패 안내
     */
    async guideScanError(error) {
        this.playErrorSound();
        this.vibrateError();
        await this.speak('스캔 실패. 다시 시도해주세요.');
        this.announceToScreenReader('스캔 실패: ' + error);
    }

    /**
     * 🎨 접근성 오버레이 생성
     *
     * 모든 페이지에 접근성 옵션 추가
     */
    createAccessibilityOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'wia-accessibility-overlay';
        overlay.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border: 2px solid #667eea;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
        `;

        overlay.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #667eea; font-size: 16px;">
                ♿ 접근성 옵션
            </h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="wia-a11y-audio" ${this.options.audioFeedback ? 'checked' : ''}>
                    <span>🔊 음성 피드백</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="wia-a11y-haptic" ${this.options.hapticFeedback ? 'checked' : ''}>
                    <span>📳 진동 피드백</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="wia-a11y-contrast" ${this.options.highContrast ? 'checked' : ''}>
                    <span>🎨 고대비 모드</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="wia-a11y-large" ${this.options.largeText ? 'checked' : ''}>
                    <span>📏 큰 텍스트</span>
                </label>
                <button id="wia-a11y-test" style="
                    margin-top: 10px;
                    padding: 8px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    🔊 음성 테스트
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // 이벤트 리스너
        document.getElementById('wia-a11y-audio').addEventListener('change', (e) => {
            this.options.audioFeedback = e.target.checked;
            if (e.target.checked) {
                this.speak('음성 피드백이 활성화되었습니다');
            }
        });

        document.getElementById('wia-a11y-haptic').addEventListener('change', (e) => {
            this.options.hapticFeedback = e.target.checked;
            if (e.target.checked) {
                this.vibrate(200);
            }
        });

        document.getElementById('wia-a11y-contrast').addEventListener('change', (e) => {
            this.options.highContrast = e.target.checked;
            if (e.target.checked) {
                document.body.style.filter = 'contrast(150%) brightness(110%)';
            } else {
                document.body.style.filter = '';
            }
        });

        document.getElementById('wia-a11y-large').addEventListener('change', (e) => {
            this.options.largeText = e.target.checked;
            if (e.target.checked) {
                document.body.style.fontSize = '18px';
            } else {
                document.body.style.fontSize = '';
            }
        });

        document.getElementById('wia-a11y-test').addEventListener('click', async () => {
            await this.speak('WIA 접근성 시스템이 정상적으로 작동하고 있습니다. 모든 인간을 위한 기술입니다.');
            this.playSuccessSound();
            this.vibrateSuccess();
        });

        console.log('🎨 접근성 오버레이 생성 완료');
        return overlay;
    }

    /**
     * 🌍 다국어 지원
     */
    setLanguage(lang) {
        this.options.lang = lang;
        console.log('🌍 언어 설정:', lang);
    }

    /**
     * 📊 접근성 보고서
     */
    getAccessibilityReport() {
        return {
            screenReaderSupport: this.options.screenReader,
            audioFeedback: this.options.audioFeedback,
            hapticFeedback: this.options.hapticFeedback,
            highContrast: this.options.highContrast,
            largeText: this.options.largeText,
            voicesAvailable: this.voices.length,
            audioContextSupport: this.audioContext !== null,
            vibrateSupport: typeof navigator.vibrate !== 'undefined',
            speechSynthesisSupport: typeof speechSynthesis !== 'undefined'
        };
    }
}

/**
 * 🎯 WIA 접근성 감지기
 *
 * 사용자의 접근성 요구사항을 자동 감지
 */
class WIAAccessibilityDetector {
    /**
     * 🔍 시스템 설정 감지
     */
    static detectPreferences() {
        const prefs = {
            reducedMotion: false,
            highContrast: false,
            darkMode: false,
            largeText: false
        };

        // Reduced Motion (애니메이션 감소)
        if (window.matchMedia) {
            prefs.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            prefs.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
            prefs.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        // 폰트 크기 감지
        const fontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
        prefs.largeText = fontSize > 16;

        return prefs;
    }

    /**
     * 🎨 자동 최적화
     */
    static autoOptimize() {
        const prefs = this.detectPreferences();
        const options = {};

        if (prefs.reducedMotion) {
            options.slowMotion = true;
            console.log('♿ Reduced Motion 감지 - 슬로우 모션 활성화');
        }

        if (prefs.highContrast) {
            options.highContrast = true;
            console.log('♿ High Contrast 감지 - 고대비 모드 활성화');
        }

        if (prefs.largeText) {
            options.largeText = true;
            console.log('♿ Large Text 감지 - 큰 텍스트 모드 활성화');
        }

        return new WIAAccessibility(options);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WIAAccessibility, WIAAccessibilityDetector };
}

console.log('♿ WIA Accessibility System 로드 완료!');
console.log('  - 음성 합성 (TTS) ✅');
console.log('  - 오디오 피드백 ✅');
console.log('  - 진동 피드백 ✅');
console.log('  - 스크린 리더 지원 ✅');
console.log('  - 키보드 네비게이션 ✅');
console.log('  - "모든 인간을 위한 기술" 🌍');
