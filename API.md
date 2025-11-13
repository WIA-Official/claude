# 📚 WIA Neural Code API Documentation

## 🧠 Core Components

### WIAMultiFormat
**Purpose**: 다양한 데이터 형식 인코딩/디코딩

```javascript
const multiFormat = new WIAMultiFormat();

// 데이터 인코딩
const encoded = multiFormat.encode({
  type: 'URL',
  data: 'https://wiacode.com'
});

// 데이터 디코딩
const decoded = multiFormat.decode(encoded);
```

**지원 형식 (27+)**:
- TEXT: 일반 텍스트
- URL: 웹 주소
- EMAIL: 이메일 주소
- PHONE: 전화번호
- SMS: SMS 메시지
- VCARD: 연락처 정보
- WIFI: WiFi 설정
- GEO: GPS 좌표
- EVENT: 캘린더 이벤트
- MEDICAL: 의료 정보 (응급)
- HTML: HTML 콘텐츠
- IMAGE: 이미지 (base64)
- AUDIO: 오디오 (base64)
- JSON: JSON 데이터
- CRYPTO: 암호화폐 주소

### WIAReedSolomon
**Purpose**: 99.999% 신뢰성을 위한 오류 정정

```javascript
const rs = new WIAReedSolomon();

// ECC 생성 (30% 복구 가능)
const protected = rs.encode(data, {
  errorCorrectionLevel: 'HIGH'
});

// 손상된 데이터 복구
const recovered = rs.decode(damaged);

// 신뢰성 레벨
const levels = {
  LOW: '7% 복구',
  MEDIUM: '15% 복구',
  HIGH: '30% 복구',
  ULTRA: '50% 복구'
};
```

### WIAHumanProof
**Purpose**: 봇 차단 및 인간 검증

```javascript
const humanProof = new WIAHumanProof();

// 생명 패턴 생성
const pattern = humanProof.generateLifePattern({
  heartbeat: [60, 72, 68, 75],
  breathing: [12, 16, 14],
  movement: 'natural'
});

// 인간 검증
const isHuman = humanProof.verify(userInput, pattern);

// 봇 감지
humanProof.on('bot-detected', (event) => {
  console.log('Bot blocked:', event.reason);
});
```

### WIAAccessibility
**Purpose**: 모든 사람을 위한 접근성

```javascript
const accessibility = new WIAAccessibility();

// 음성 출력 (TTS)
accessibility.speak('WIA 코드가 감지되었습니다');

// 진동 피드백
accessibility.vibrate([100, 50, 100]); // 패턴

// 스크린 리더 지원
accessibility.announceForScreenReader('코드 스캔 완료');

// 고대비 모드
accessibility.enableHighContrast();

// 큰 글씨 모드
accessibility.setFontSize('large');
```

### WIAEmergency
**Purpose**: 응급 상황 지원

```javascript
const emergency = new WIAEmergency();

// 응급 모드 활성화
emergency.activate({
  type: 'MEDICAL',
  location: navigator.geolocation,
  contact: '+82-119'
});

// 응급 타입
const types = [
  'MEDICAL',      // 의료 응급
  'ALLERGY',      // 알레르기
  'BLOOD_TYPE',   // 혈액형
  'MEDICATION',   // 복용 약물
  'DISASTER',     // 재난
  'EVACUATION',   // 대피
  'CONTACT',      // 긴급 연락처
  'HELP'          // 도움 요청
];

// 오프라인 저장
emergency.saveOffline(data);
```

### WIAPrivacy
**Purpose**: 개인정보 보호

```javascript
const privacy = new WIAPrivacy();

// 데이터 암호화
const encrypted = privacy.encrypt(sensitiveData, {
  algorithm: 'AES-256-GCM',
  key: userKey
});

// PII 마스킹
const masked = privacy.maskPII({
  name: '홍길동',
  phone: '010-1234-5678',
  ssn: '123456-1234567'
});
// 결과: { name: '홍**', phone: '010-****-5678', ssn: '******-*******' }

// 익명화
const anonymized = privacy.anonymize(userData);

// 데이터 만료
privacy.setExpiration(data, '24h');
```

## 🎨 Neural Pattern Generation

```javascript
class WIANeuralPattern {
  constructor(phase) {
    this.phase = phase; // 1, 2, 3, or 4
    this.neurons = this.calculateNeurons();
    this.canvas = this.createCanvas();
  }
  
  calculateNeurons() {
    // Phase 1: 56 neurons (7×8)
    // Phase 2: 72 neurons (8×9)
    // Phase 3: 90 neurons (9×10)
    // Phase 4: 504 neurons (21×24)
    const configs = {
      1: { rows: 7, cols: 8, size: 480 },
      2: { rows: 8, cols: 9, size: 640 },
      3: { rows: 9, cols: 10, size: 800 },
      4: { rows: 21, cols: 24, size: 960 }
    };
    return configs[this.phase];
  }
  
  generate(data) {
    // 뉴럴 패턴 생성
    const pattern = this.encodeToNeurons(data);
    this.drawPattern(pattern);
    return this.canvas;
  }
}
```

## 📱 PWA Integration

```javascript
// Service Worker 등록
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('SW registered'))
    .catch(err => console.error('SW failed', err));
}

// 카메라 스캔
async function scanWIACode() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  });
  
  const video = document.querySelector('video');
  video.srcObject = stream;
  
  // 실시간 감지
  const scanner = new WIAScanner(video);
  scanner.on('code-detected', (code) => {
    const decoded = WIADecoder.decode(code);
    console.log('Decoded:', decoded);
  });
}

// 오프라인 캐싱
const cache = await caches.open('wia-v1');
await cache.addAll([
  '/wia-reader.html',
  '/assets/js/wia-neural-decoder.js',
  '/manifest.json'
]);
```

## 🔄 Complete Example

```javascript
// WIA Neural Code 완전한 예제
async function createWIACode() {
  // 1. 데이터 준비
  const data = {
    type: 'MEDICAL',
    name: '홍길동',
    bloodType: 'A+',
    allergies: ['페니실린'],
    emergency: '010-1234-5678'
  };
  
  // 2. 프라이버시 보호
  const privacy = new WIAPrivacy();
  const protected = privacy.maskPII(data);
  
  // 3. 포맷 인코딩
  const format = new WIAMultiFormat();
  const encoded = format.encode(protected);
  
  // 4. 오류 정정 추가
  const rs = new WIAReedSolomon();
  const reliable = rs.encode(encoded, { level: 'HIGH' });
  
  // 5. 뉴럴 패턴 생성
  const neural = new WIANeuralPattern(4);
  const pattern = neural.generate(reliable);
  
  // 6. 캔버스에 렌더링
  document.getElementById('output').appendChild(pattern);
  
  // 7. 다운로드 링크 생성
  const link = document.createElement('a');
  link.download = 'wia-code.png';
  link.href = pattern.toDataURL();
  link.click();
}

// 실행
createWIACode();
```

## 📊 Performance Metrics

```javascript
// 성능 측정
const benchmark = {
  encoding: {
    phase1: '~10ms',
    phase2: '~15ms',
    phase3: '~20ms',
    phase4: '~50ms'
  },
  decoding: {
    phase1: '~5ms',
    phase2: '~8ms',
    phase3: '~12ms',
    phase4: '~30ms'
  },
  reedSolomon: {
    encode: '~20ms',
    decode: '~25ms',
    recover: '~100ms'
  },
  memory: {
    phase1: '~1MB',
    phase2: '~1.5MB',
    phase3: '~2MB',
    phase4: '~5MB'
  }
};
```

## 🌍 Browser Support

```javascript
const support = {
  chrome: '90+',
  firefox: '88+',
  safari: '14+',
  edge: '90+',
  mobile: {
    android: '8+',
    ios: '14+'
  }
};

// 기능 감지
const features = {
  serviceWorker: 'serviceWorker' in navigator,
  camera: 'mediaDevices' in navigator,
  canvas: !!document.createElement('canvas').getContext,
  webgl: !!document.createElement('canvas').getContext('webgl'),
  speechSynthesis: 'speechSynthesis' in window,
  vibration: 'vibrate' in navigator,
  geolocation: 'geolocation' in navigator
};
```

## 📝 License

MIT License - 100년 후에도 자유롭게 사용 가능

---

**"기술이 인간을 보호해야해..따로 놀면 안되는거야"** 💜
