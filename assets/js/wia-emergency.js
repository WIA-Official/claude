/**
 * 🚨 WIA Emergency Mode
 *
 * **"생명을 구하는 기술"** - Life-Saving Technology
 *
 * 재난, 의료 응급 상황에서 인터넷 없이도 작동하는
 * 생명을 구하는 WIA Neural Code 긴급 시스템
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

class WIAEmergency {
    constructor(options = {}) {
        this.options = {
            autoDetect: options.autoDetect !== false,  // 자동 감지
            priority: options.priority || 'HIGH',  // HIGH, MEDIUM, LOW
            offlineMode: options.offlineMode !== false,  // 오프라인 모드
            gpsEnabled: options.gpsEnabled !== false,  // GPS 활성화
            ...options
        };

        // 긴급 타입
        this.EMERGENCY_TYPES = {
            MEDICAL: {
                code: 0xE1,
                name: '의료 응급',
                icon: '🏥',
                priority: 10,
                color: '#dc3545',
                sounds: [600, 100, 600, 100, 600]  // 3번 경보음
            },
            DISASTER: {
                code: 0xE2,
                name: '재난',
                icon: '⚠️',
                priority: 10,
                color: '#ff9800',
                sounds: [800, 200, 800, 200, 800]
            },
            RESCUE: {
                code: 0xE3,
                name: '구조 요청',
                icon: '🆘',
                priority: 10,
                color: '#f44336',
                sounds: [1000, 150, 1000, 150, 1000, 150, 1000]
            },
            FIRE: {
                code: 0xE4,
                name: '화재',
                icon: '🔥',
                priority: 10,
                color: '#ff5722',
                sounds: [900, 100, 900, 100, 900, 100, 900]
            },
            EARTHQUAKE: {
                code: 0xE5,
                name: '지진',
                icon: '🌍',
                priority: 10,
                color: '#8b4513',
                sounds: [400, 300, 400, 300, 400]
            },
            FLOOD: {
                code: 0xE6,
                name: '홍수',
                icon: '🌊',
                priority: 9,
                color: '#2196F3',
                sounds: [500, 250, 500, 250, 500]
            },
            MISSING_PERSON: {
                code: 0xE7,
                name: '실종자',
                icon: '👤',
                priority: 8,
                color: '#9c27b0',
                sounds: [700, 200, 700]
            },
            EVACUATION: {
                code: 0xE8,
                name: '대피 안내',
                icon: '🚪',
                priority: 7,
                color: '#4caf50',
                sounds: [600, 300, 600]
            }
        };

        // 현재 위치
        this.currentLocation = null;

        // AudioContext
        this.audioContext = null;
        if (typeof AudioContext !== 'undefined') {
            this.audioContext = new AudioContext();
        }

        console.log('🚨 WIA Emergency Mode 초기화');
        console.log('  - 자동 감지:', this.options.autoDetect ? '✅' : '❌');
        console.log('  - 오프라인 모드:', this.options.offlineMode ? '✅' : '❌');
        console.log('  - GPS:', this.options.gpsEnabled ? '✅' : '❌');
    }

    /**
     * 🚨 긴급 코드 생성
     *
     * @param {string} type - 긴급 타입 (MEDICAL, DISASTER, etc)
     * @param {Object} data - 긴급 데이터
     */
    createEmergency(type, data) {
        const emergencyType = this.EMERGENCY_TYPES[type];

        if (!emergencyType) {
            throw new Error(`알 수 없는 긴급 타입: ${type}`);
        }

        const emergency = {
            code: emergencyType.code,
            type: type,
            typeName: emergencyType.name,
            icon: emergencyType.icon,
            priority: emergencyType.priority,
            timestamp: Date.now(),
            location: this.currentLocation,
            data: data,

            // 긴급 연락처
            emergencyContacts: data.emergencyContacts || [],

            // 메시지
            message: data.message || '',

            // 상태
            status: 'ACTIVE',

            // UUID
            id: this.generateEmergencyId()
        };

        // 위치 정보 없으면 자동 감지 시도
        if (!emergency.location && this.options.gpsEnabled) {
            this.getCurrentLocation().then(location => {
                emergency.location = location;
            });
        }

        console.log('🚨 긴급 코드 생성:', emergency);

        return emergency;
    }

    /**
     * 📍 현재 위치 가져오기
     */
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('GPS를 지원하지 않습니다'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                        // Plus Code 계산 (간단한 버전)
                        plusCode: this.calculatePlusCode(
                            position.coords.latitude,
                            position.coords.longitude
                        )
                    };

                    this.currentLocation = location;
                    console.log('📍 위치 확인:', location);
                    resolve(location);
                },
                (error) => {
                    console.error('❌ GPS 오류:', error);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    }

    /**
     * 📏 Plus Code 계산 (간단한 버전)
     */
    calculatePlusCode(lat, lng) {
        // 실제 Plus Code 알고리즘은 복잡하므로 간단히 구현
        const latCode = Math.floor((lat + 90) * 8000).toString(36).toUpperCase();
        const lngCode = Math.floor((lng + 180) * 8000).toString(36).toUpperCase();
        return `${latCode}+${lngCode}`;
    }

    /**
     * 🆔 긴급 ID 생성
     */
    generateEmergencyId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `EMG_${timestamp}_${random}`.toUpperCase();
    }

    /**
     * 🚨 긴급 알림 발생
     */
    triggerAlert(emergency) {
        const type = this.EMERGENCY_TYPES[emergency.type];

        // 1. 사운드 경보
        this.playEmergencySound(type.sounds);

        // 2. 진동 경보
        this.vibrateEmergency(type.sounds);

        // 3. 음성 안내 (있다면)
        if (typeof speechSynthesis !== 'undefined') {
            const message = `${type.icon} ${type.name} 발생! ${emergency.message || ''}`;
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'ko-KR';
            utterance.rate = 1.2;  // 빠르게
            utterance.pitch = 1.5;  // 높게
            utterance.volume = 1.0;  // 최대
            speechSynthesis.speak(utterance);
        }

        // 4. 화면 깜빡임 (시각적 경보)
        this.flashScreen(type.color);

        console.log('🚨 긴급 알림 발생:', emergency);
    }

    /**
     * 🔊 긴급 사운드
     */
    playEmergencySound(pattern) {
        if (!this.audioContext) return;

        let time = this.audioContext.currentTime;

        for (let i = 0; i < pattern.length; i += 2) {
            const frequency = pattern[i];
            const duration = pattern[i + 1] / 1000;

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'square';  // 경보음 느낌

            gainNode.gain.setValueAtTime(0.5, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

            oscillator.start(time);
            oscillator.stop(time + duration);

            time += duration + 0.1;  // 간격
        }
    }

    /**
     * 📳 긴급 진동
     */
    vibrateEmergency(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * 💡 화면 깜빡임
     */
    flashScreen(color) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color};
            opacity: 0;
            z-index: 999999;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);

        // 깜빡임 애니메이션
        let opacity = 0;
        let increasing = true;
        let count = 0;
        const maxCount = 6;  // 3번 깜빡임

        const flash = setInterval(() => {
            if (increasing) {
                opacity += 0.1;
                if (opacity >= 0.7) {
                    increasing = false;
                    count++;
                }
            } else {
                opacity -= 0.1;
                if (opacity <= 0) {
                    increasing = true;
                }
            }

            overlay.style.opacity = opacity;

            if (count >= maxCount) {
                clearInterval(flash);
                document.body.removeChild(overlay);
            }
        }, 50);
    }

    /**
     * 🏥 의료 응급 (Medical Emergency)
     */
    createMedicalEmergency(data) {
        return this.createEmergency('MEDICAL', {
            patient: data.patient || {},
            condition: data.condition || '',
            bloodType: data.bloodType || '',
            allergies: data.allergies || [],
            medications: data.medications || [],
            emergencyContacts: data.emergencyContacts || [],
            message: data.message || '의료 응급 상황입니다!',
            vitals: {
                heartRate: data.heartRate,
                bloodPressure: data.bloodPressure,
                temperature: data.temperature,
                consciousness: data.consciousness
            }
        });
    }

    /**
     * ⚠️ 재난 (Disaster)
     */
    createDisasterEmergency(data) {
        return this.createEmergency('DISASTER', {
            disasterType: data.disasterType || '',
            severity: data.severity || 'HIGH',
            affectedArea: data.affectedArea || '',
            casualties: data.casualties || 0,
            evacuationRoute: data.evacuationRoute || '',
            shelters: data.shelters || [],
            message: data.message || '재난 발생!'
        });
    }

    /**
     * 🆘 구조 요청 (Rescue Request)
     */
    createRescueRequest(data) {
        return this.createEmergency('RESCUE', {
            victims: data.victims || 1,
            condition: data.condition || '',
            trapped: data.trapped || false,
            injuries: data.injuries || [],
            supplies: data.supplies || [],
            message: data.message || 'SOS! 구조 요청합니다!',
            urgency: data.urgency || 'CRITICAL'
        });
    }

    /**
     * 🔥 화재 (Fire)
     */
    createFireEmergency(data) {
        return this.createEmergency('FIRE', {
            fireSize: data.fireSize || '',
            spreading: data.spreading || false,
            buildingType: data.buildingType || '',
            peopleInside: data.peopleInside || 0,
            exits: data.exits || [],
            message: data.message || '화재 발생!'
        });
    }

    /**
     * 🌍 지진 (Earthquake)
     */
    createEarthquakeEmergency(data) {
        return this.createEmergency('EARTHQUAKE', {
            magnitude: data.magnitude || 0,
            depth: data.depth || 0,
            epicenter: data.epicenter || '',
            aftershocks: data.aftershocks || false,
            tsunamiRisk: data.tsunamiRisk || false,
            message: data.message || '지진 발생!'
        });
    }

    /**
     * 📦 긴급 데이터 패키징
     */
    packageEmergency(emergency) {
        return {
            // 헤더 (긴급 식별)
            header: 'WIA_EMERGENCY',
            version: '1.0',

            // 긴급 정보
            emergency: emergency,

            // 메타데이터
            metadata: {
                createdAt: emergency.timestamp,
                expiresAt: emergency.timestamp + (24 * 60 * 60 * 1000),  // 24시간
                offline: this.options.offlineMode,
                priority: emergency.priority
            },

            // 체크섬
            checksum: this.calculateChecksum(emergency)
        };
    }

    /**
     * #️⃣ 체크섬 계산
     */
    calculateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * 📱 긴급 알림 배너 표시
     */
    showEmergencyBanner(emergency) {
        const type = this.EMERGENCY_TYPES[emergency.type];

        const banner = document.createElement('div');
        banner.id = 'wia-emergency-banner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: ${type.color};
            color: white;
            padding: 20px;
            z-index: 999999;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0,0,0,0.5);
            animation: pulse 1s infinite;
        `;

        banner.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                <span style="font-size: 32px;">${type.icon}</span>
                <div style="text-align: left;">
                    <div style="font-size: 24px; margin-bottom: 5px;">${type.name}</div>
                    <div style="font-size: 16px; font-weight: normal;">${emergency.message}</div>
                    ${emergency.location ? `<div style="font-size: 14px; font-weight: normal; margin-top: 5px;">📍 ${emergency.location.latitude.toFixed(6)}, ${emergency.location.longitude.toFixed(6)}</div>` : ''}
                </div>
                <button onclick="document.getElementById('wia-emergency-banner').remove()" style="
                    background: white;
                    color: ${type.color};
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 14px;
                ">확인</button>
            </div>
        `;

        // CSS 애니메이션 추가
        if (!document.getElementById('wia-emergency-style')) {
            const style = document.createElement('style');
            style.id = 'wia-emergency-style';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(banner);

        return banner;
    }

    /**
     * 📊 긴급 상태 보고서
     */
    getEmergencyReport(emergency) {
        const type = this.EMERGENCY_TYPES[emergency.type];

        return {
            id: emergency.id,
            type: emergency.type,
            typeName: type.name,
            icon: type.icon,
            priority: type.priority,
            status: emergency.status,
            timestamp: new Date(emergency.timestamp).toISOString(),
            location: emergency.location,
            message: emergency.message,
            data: emergency.data
        };
    }

    /**
     * 🔄 긴급 상태 업데이트
     */
    updateEmergencyStatus(emergency, status) {
        emergency.status = status;
        emergency.updatedAt = Date.now();

        console.log('🔄 긴급 상태 업데이트:', emergency.id, status);

        return emergency;
    }

    /**
     * ✅ 긴급 해제
     */
    resolveEmergency(emergency) {
        return this.updateEmergencyStatus(emergency, 'RESOLVED');
    }

    /**
     * 📡 오프라인 저장 (PWA/Service Worker 활용 가능)
     */
    saveOffline(emergency) {
        const key = `wia_emergency_${emergency.id}`;
        const data = this.packageEmergency(emergency);

        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log('💾 오프라인 저장:', key);
            return true;
        } catch (error) {
            console.error('❌ 오프라인 저장 실패:', error);
            return false;
        }
    }

    /**
     * 📡 오프라인 로드
     */
    loadOffline(emergencyId) {
        const key = `wia_emergency_${emergencyId}`;

        try {
            const data = localStorage.getItem(key);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('❌ 오프라인 로드 실패:', error);
        }

        return null;
    }

    /**
     * 🗑️ 오프라인 삭제
     */
    deleteOffline(emergencyId) {
        const key = `wia_emergency_${emergencyId}`;
        localStorage.removeItem(key);
        console.log('🗑️ 오프라인 삭제:', key);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WIAEmergency };
}

console.log('🚨 WIA Emergency Mode 로드 완료!');
console.log('  - 8가지 긴급 타입 지원');
console.log('  - GPS 위치 추적');
console.log('  - 오프라인 저장');
console.log('  - "생명을 구하는 기술" 🌍');
