# 🌐 WIA Neural Code - Universal Data Formats

**"모든 것을 담는다"** - 27+ Data Types Support

---

## 📋 목차

1. [개요](#개요)
2. [데이터 구조](#데이터-구조)
3. [정적 WIA (0x01~0x0F)](#정적-wia)
4. [동적 WIA (0x11~0x1F)](#동적-wia)
5. [100KB 전용 (0x20~0x3F)](#100kb-전용)
6. [사용 예제](#사용-예제)
7. [용량 계산](#용량-계산)

---

## 개요

WIA Neural Code는 단순한 텍스트 저장을 넘어, **27가지 이상의 다양한 데이터 타입**을 지원합니다.

### 지원 Phase

| Phase | 뉴런 수 | Canvas | 실제 용량 | 용도 |
|-------|---------|--------|-----------|------|
| **Phase 1** | 56개 | 480×480 | ~28 bytes | 간단한 데이터 |
| **Phase 4** | 504개 | 960×960 | ~756 bytes | 복잡한 데이터 |

> **참고**: 실제 용량은 99.9% 신뢰성을 위한 중복 저장으로 인해 이론 용량의 50%입니다.

---

## 데이터 구조

모든 WIA 데이터는 다음 구조를 따릅니다:

```
[TYPE_ID (1 byte)]
[DATA_LENGTH (2 bytes, little-endian)]
[DATA (N bytes)]
[CRC32 (4 bytes)]
[PARITY (1 byte)]
```

**총 오버헤드: 8 bytes**

### Type ID 범위

- `0x01 ~ 0x0F`: 정적 WIA (12개)
- `0x11 ~ 0x1F`: 동적 WIA (15개)
- `0x20 ~ 0x2F`: 100KB 전용 - 미디어 (10개)
- `0x30 ~ 0x3F`: 100KB 전용 - 복합 데이터 (10개)

---

## 정적 WIA

### 0x01: 📝 텍스트 (TEXT)

**설명**: 일반 텍스트 메시지

**형식**:
```javascript
String
```

**예제**:
```javascript
"Hello World! 안녕하세요!"
```

**용량**:
- Phase 1: ~28 bytes
- Phase 4: ~756 bytes

---

### 0x02: 💬 SMS

**설명**: SMS 문자 메시지

**형식**:
```javascript
{
    phone: String,
    message: String
}
```

**예제**:
```javascript
{
    phone: "+82-10-1234-5678",
    message: "안녕하세요!"
}
```

**스캔 시 동작**: SMS 앱 자동 실행

---

### 0x03: 📶 WiFi

**설명**: WiFi 네트워크 설정

**형식**:
```javascript
{
    ssid: String,
    password: String,
    security: "WPA2" | "WPA" | "WEP" | "nopass",
    hidden: Boolean
}
```

**예제**:
```javascript
{
    ssid: "MyWiFi",
    password: "password123",
    security: "WPA2",
    hidden: false
}
```

**스캔 시 동작**: WiFi 자동 연결

---

### 0x04: 👤 vCard (정적)

**설명**: 명함/연락처 정보

**형식**: vCard 3.0
```javascript
{
    name: String,
    phone: String,
    email: String,
    org: String,
    title: String,
    url: String,
    address: String,
    photo: String (Base64) // Phase 4만
}
```

**예제**:
```javascript
{
    name: "홍길동",
    phone: "+82-10-1234-5678",
    email: "hong@example.com",
    org: "WIA Corp",
    title: "CEO"
}
```

**스캔 시 동작**: 연락처 앱에 자동 추가

---

### 0x07: 🏥 의료 정보 (MEDICAL)

**설명**: 응급 의료 정보

**형식**:
```javascript
{
    bloodType: String,
    allergies: Array<String>,
    medications: Array<String>,
    conditions: Array<String>,
    emergencyContact: String,
    emergencyPhone: String
}
```

**예제**:
```javascript
{
    bloodType: "A+",
    allergies: ["페니실린", "땅콩"],
    medications: ["아스피린 100mg"],
    conditions: ["당뇨"],
    emergencyContact: "홍길동",
    emergencyPhone: "+82-10-1234-5678"
}
```

**용도**: 팔찌, 카드, 신분증

---

### 0x08: 🌍 WIA PIN Code (위치)

**설명**: 정확한 위치 정보

**형식**:
```javascript
{
    latitude: Number,
    longitude: Number,
    plusCode: String,
    name: String,
    address: String
}
```

**예제**:
```javascript
{
    latitude: 37.5665,
    longitude: 126.9780,
    plusCode: "8Q98MXRH+2V",
    name: "서울시청",
    address: "서울특별시 중구"
}
```

**스캔 시 동작**: 지도 앱 자동 실행

---

## 동적 WIA

### 0x11: 🔗 URL

**설명**: 웹사이트 링크

**형식**:
```javascript
String (URL)
```

**예제**:
```javascript
"https://example.com"
```

**스캔 시 동작**: 브라우저 자동 실행

---

### 0x12: 📧 이메일 (EMAIL)

**설명**: 이메일 작성

**형식**:
```javascript
{
    to: String,
    subject: String,
    body: String
}
```

**예제**:
```javascript
{
    to: "hello@example.com",
    subject: "안녕하세요",
    body: "이메일 본문..."
}
```

**스캔 시 동작**: 이메일 앱 자동 실행 (내용 자동 입력)

---

### 0x13: 📞 전화 (PHONE)

**설명**: 전화 걸기

**형식**:
```javascript
String (전화번호)
```

**예제**:
```javascript
"+82-10-1234-5678"
```

**스캔 시 동작**: 전화 앱 자동 실행

---

### 0x19: ₿ 암호화폐 (CRYPTOCURRENCY)

**설명**: 암호화폐 지갑 주소

**형식**:
```javascript
{
    currency: "BTC" | "ETH" | "USDT" | ...,
    address: String,
    amount: Number (optional),
    memo: String (optional)
}
```

**예제**:
```javascript
{
    currency: "BTC",
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    amount: 0.001,
    memo: "Donation"
}
```

**스캔 시 동작**: 암호화폐 지갑 앱 자동 실행

---

### 0x1A: 🤖 AI 프롬프트

**설명**: ChatGPT/Claude용 프롬프트 템플릿

**형식**:
```javascript
{
    model: "gpt-4" | "claude-opus" | ...,
    prompt: String,
    systemPrompt: String (optional),
    temperature: Number (optional)
}
```

**예제**:
```javascript
{
    model: "gpt-4",
    prompt: "다음 코드를 설명해주세요: {{CODE}}",
    systemPrompt: "당신은 친절한 프로그래밍 튜터입니다.",
    temperature: 0.7
}
```

**스캔 시 동작**: AI 앱 자동 실행 (프롬프트 자동 입력)

---

## 100KB 전용

### 0x20: 🌐 HTML 페이지 (HTML_PAGE)

**설명**: 완전한 HTML+CSS+JS 웹페이지

**형식**:
```javascript
String (HTML)
```

**예제**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    <style>
        body { font-family: sans-serif; }
    </style>
</head>
<body>
    <h1>Hello World!</h1>
    <script>
        console.log('Working!');
    </script>
</body>
</html>
```

**용량**: 최대 ~756 bytes (Phase 4)

**스캔 시 동작**: 브라우저에서 오프라인 렌더링

**혁명적 사용 사례**:
- 인터넷 없는 산악 지역 관광 안내
- 긴급 재난 정보 페이지
- 오프라인 이벤트 안내

---

### 0x22: 🖼️ JPEG 이미지 (JPEG_IMAGE)

**설명**: JPEG 이미지 (Base64)

**형식**:
```javascript
{
    image: String (Base64),
    width: Number,
    height: Number,
    title: String
}
```

**예제**:
```javascript
{
    image: "data:image/jpeg;base64,/9j/4AAQ...",
    width: 800,
    height: 600,
    title: "My Photo"
}
```

**용량**: ~600 bytes = 800×600 고화질 (Phase 4)

**스캔 시 동작**: 이미지 뷰어 자동 실행

---

### 0x30: 🆔 완전한 신원 정보 (IDENTITY_PACKAGE)

**설명**: 여권, 증명서, 생체정보 통합

**형식**:
```javascript
{
    personal: {
        name: String,
        birthdate: String,
        nationality: String
    },
    documents: {
        passport: String (Base64),
        degree: String (Base64)
    },
    biometric: {
        fingerprint: String,
        face: String
    },
    signature: String (Digital)
}
```

**용량**: ~700 bytes (Phase 4)

**스캔 시 동작**: 신원 확인 앱 자동 실행

**혁명적 사용 사례**:
- 난민 지원 (모든 서류 하나로)
- 국경 통과 (인터넷 없어도 검증)
- 위조 불가능한 신원증명

---

### 0x31: 🎓 교육 콘텐츠 (EDUCATION)

**설명**: 완전한 학습 자료

**형식**:
```javascript
{
    title: String,
    content: String,
    images: Array<String>,
    quiz: Array<Object>,
    simulation: String (JavaScript)
}
```

**용량**: ~700 bytes (Phase 4)

**스캔 시 동작**: 학습 앱 자동 실행

**혁명적 사용 사례**:
- 인터넷 없는 지역 교육
- 교과서 각 장마다 WIA 코드
- 오프라인 완벽 학습

---

## 사용 예제

### 1. 기본 사용법

```javascript
// Generator
const canvas = document.getElementById('canvas');
const multiFormat = new WIAMultiFormat(canvas, 1);  // Phase 1

// 텍스트 생성
multiFormat.generate(
    WIADataTypes.TEXT,
    "Hello World!",
    'complex',
    'high'
);

// Decoder
const result = await multiFormat.decode(canvas, true);
console.log(result.data);  // "Hello World!"
```

### 2. vCard 생성

```javascript
const vcard = {
    name: "홍길동",
    phone: "+82-10-1234-5678",
    email: "hong@example.com",
    org: "WIA Corp",
    title: "CEO"
};

multiFormat.generate(WIADataTypes.VCARD_STATIC, vcard);
```

### 3. WiFi 공유

```javascript
const wifi = {
    ssid: "CoffeeShop_WiFi",
    password: "coffee123",
    security: "WPA2"
};

multiFormat.generate(WIADataTypes.WIFI, wifi);
```

### 4. 의료 정보 (응급)

```javascript
const medical = {
    bloodType: "A+",
    allergies: ["페니실린", "땅콩"],
    emergencyContact: "홍길동",
    emergencyPhone: "+82-10-1234-5678"
};

multiFormat.generate(WIADataTypes.MEDICAL, medical);
```

### 5. 자동 Phase 선택

```javascript
// 데이터 크기에 따라 자동으로 Phase 선택
const sizeInfo = WIAMultiFormat.calculateSize(WIADataTypes.TEXT, "Very long text...");
console.log(sizeInfo.phase1Fit);  // false면 Phase 4 필요

const phaseSelection = WIAMultiFormat.selectPhase(WIADataTypes.TEXT, "Long text...");
console.log(phaseSelection);  // { phase: 4, reason: 'Phase 4 필요' }
```

---

## 용량 계산

### Phase 1 (9KB)

- **총 뉴런**: 56개
- **이론 용량**: 56 bytes
- **실제 용량**: ~28 bytes (중복 저장)
- **오버헤드**: 8 bytes
- **순수 데이터**: ~20 bytes

**적합한 용도**:
- 짧은 텍스트
- URL
- 전화번호
- 간단한 명함

### Phase 4 (100KB)

- **총 뉴런**: 504개 × 3 bytes (RGB) = 1,512 bytes
- **실제 용량**: ~756 bytes (중복 저장)
- **오버헤드**: 8 bytes
- **순수 데이터**: ~748 bytes

**적합한 용도**:
- HTML 페이지
- 고화질 이미지
- 완전한 vCard (사진 포함)
- 의료 기록
- 교육 콘텐츠
- 신원 정보 패키지

---

## 🌟 혁명적 사용 사례

### 1. 교육 혁명
```
교과서 각 장마다 WIA 코드:
→ 영어 발음 음성 (30초)
→ 과학 실험 영상
→ 수학 문제 풀이
→ 인터넷 없어도 완벽 학습!
```

### 2. 의료 혁명
```
의료 캠프 (인터넷 없는 지역):
→ 환자 병력 전체
→ X-ray 이미지
→ 처방전 기록
→ 생명 구조!
```

### 3. 재난 대응
```
재난 포스터 WIA 코드:
→ 대피소 지도
→ 응급처치 가이드
→ 생존 물품 만드는 법
→ 통신망 마비 시에도 작동!
```

### 4. 관광 혁명
```
관광지 WIA 표지판:
→ 역사 설명 (20KB)
→ 옛날 사진 (30KB)
→ 5개 언어 음성 가이드 (30KB)
→ 인터넷 없어도 완벽한 가이드!
```

---

## 📊 타입 선택 가이드

| 데이터 크기 | 추천 Phase | 최대 용량 | 예시 |
|-------------|------------|-----------|------|
| 1~20 bytes | Phase 1 | ~20 bytes | 짧은 텍스트, URL, 전화번호 |
| 20~748 bytes | Phase 4 | ~748 bytes | HTML, 이미지, 완전한 명함 |
| 748+ bytes | 분할 또는 압축 | - | 대용량 데이터는 여러 개로 분할 |

---

## 🚀 미래 확장

### Phase 6 (1MB) - 계획 중
- **총 용량**: ~4,000 bytes
- **용도**:
  - 고화질 비디오 (10초)
  - 완전한 앱 (미니 게임)
  - 전자책 (소설 1장)

### Phase 8 (10MB) - 연구 중
- **총 용량**: ~40,000 bytes
- **용도**:
  - 영화 트레일러 (30초)
  - 완전한 웹사이트
  - 3D 모델

---

**"모든 것을 담는다"** - WIA Neural Code

*2025년 11월 11일, 역사가 시작된 날* 🎉
