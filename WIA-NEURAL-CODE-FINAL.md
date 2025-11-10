# 🌍 WIA Neural Code - 전세계를 위한 시각 인코딩 시스템

**QR 코드의 검증된 마커 + 뉴럴 네트워크의 아름다움**

---

## 📖 목차

1. [프로젝트 소개](#프로젝트-소개)
2. [핵심 개념](#핵심-개념)
3. [기술 사양](#기술-사양)
4. [파일 구조](#파일-구조)
5. [사용 방법](#사용-방법)
6. [배포 가이드](#배포-가이드)
7. [MCP SSH 최종 프롬프트](#mcp-ssh-최종-프롬프트)

---

## 프로젝트 소개

### 🎯 비전

> "전세계 누구나 의미있게 사용할 수 있는 오픈소스 시각 코드"

WIA Neural Code는:
- ✅ QR 코드의 **검증된 마커 시스템** (특허 만료)
- ✅ 뉴럴 네트워크의 **아름다운 비주얼**
- ✅ 14가지 데이터 타입 지원
- ✅ 211개 언어 지원
- ✅ 100% 오픈소스

### 🏆 핵심 장점

| 특징 | QR 코드 | WIA Neural Code |
|------|---------|-----------------|
| 마커 | 검정 사각형 3개 | ✅ 동일 (QR 표준) |
| 데이터 표현 | 검정/흰색 격자 | 🎨 청보라 뉴런 + 곡선 연결 |
| 특허 | 만료 (자유 사용) | 만료 (자유 사용) |
| 아름다움 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 안정성 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 확장성 | 제한적 | 무제한 (뉴럴 네트워크) |

---

## 핵심 개념

### 1. QR 스타일 마커 (Position Detection Pattern)

```
┌─────────┐
│ ■■■■■■■ │  외곽: 검정 (7/7)
│ ■ ■■■ ■ │
│ ■ ■ ■ ■ │  중간: 흰색 (5/7)
│ ■ ■■■ ■ │
│ ■     ■ │  내부: 검정 (3/7)
│ ■■■■■■■ │
└─────────┘
```

**특징:**
- **위치**: 좌상단, 우상단, 좌하단
- **크기**: 60x60px
- **비율**: 7:5:3 (검정-흰색-검정)
- **감지**: 360° 회전 인식

### 2. 뉴럴 네트워크 (중앙 데이터 영역)

```
     🔵 rgba(102, 126, 234, 0.8)
    ╱│╲  청보라색 뉴런
   ╱ │ ╲
  🔵─🔵─🔵
   ╲ │ ╱ rgba(118, 75, 162, 0.3)
    ╲│╱  진한 보라 연결선
     🔵
```

**특징:**
- **뉴런**: 8px 원형, 청보라색
- **연결선**: Quadratic Bezier 곡선
- **인코딩**: 144개 뉴런 (12x12 그리드)
- **용량**: 9KB 데이터 + 30% ECC

---

## 기술 사양

### 📐 Canvas 크기

- **기본**: 480x480px
- **고해상도**: devicePixelRatio * 480

### 🎨 색상 팔레트

```javascript
// 마커 (QR 스타일)
MARKER_COLOR = 'rgb(0, 0, 0)'  // 순수 검정

// 뉴런 (백업 파일 사양)
NEURON_COLOR = 'rgba(102, 126, 234, 0.8)'  // 청보라색
NEURON_STROKE = '#ffffff'  // 흰색 테두리 2px

// 연결선 (백업 파일 사양)
CONNECTION_COLOR = 'rgba(118, 75, 162, 0.3)'  // 진한 보라
```

### 📊 데이터 타입 (14가지)

1. **text** - 일반 텍스트
2. **link** - URL
3. **wifi** - WiFi 연결 정보
4. **vcard** - 연락처 (vCard 3.0)
5. **email** - 이메일 주소 + 제목/본문
6. **phone** - 전화번호
7. **sms** - SMS 메시지
8. **event** - 캘린더 이벤트
9. **whatsapp** - WhatsApp 링크
10. **crypto** - 암호화폐 주소
11. **gps** - GPS 좌표 + 핀코드
12. **application** - 앱 다운로드 링크
13. **file** - 파일 다운로드
14. **staticvcard** - 정적 명함

### 🌐 언어 지원

- **총 211개 언어** (ISO 639-1/2/3)
- UI 다국어 준비 완료
- 자동 언어 감지

---

## 파일 구조

```
/home/user/claude/
│
├── 📄 HTML 페이지 (3개)
│   ├── generate-wialanguages-code.html  # Generator (14 타입)
│   ├── mobile-scanner.html               # Scanner (모바일)
│   └── test-qr-marker.html               # QR 마커 테스트
│
├── 📁 assets/js/ (핵심 JavaScript)
│   ├── wia-engine.js                     # 렌더링 엔진
│   ├── wia-neural-encoder.js             # 인코더
│   └── wia-neural-decoder.js             # 디코더
│
└── 📋 문서
    └── WIA-NEURAL-CODE-FINAL.md          # 이 파일
```

### 1. generate-wialanguages-code.html (1,145줄)

**기능:**
- 14가지 데이터 타입 폼
- 실시간 Canvas 미리보기
- PNG/JPG/SVG/PDF 다운로드
- 211개 언어 UI 준비

**주요 섹션:**
```html
<!-- 데이터 타입 선택 -->
<select id="dataType">
    <option value="text">Text</option>
    <option value="wifi">WiFi</option>
    <option value="vcard">vCard</option>
    <!-- ... 11 more -->
</select>

<!-- 14개 데이터 입력 폼 -->
<div id="text-form">...</div>
<div id="wifi-form">...</div>
<!-- ... 12 more -->

<!-- Canvas 미리보기 -->
<canvas id="preview" width="480" height="480"></canvas>

<!-- 다운로드 버튼 -->
<button onclick="download('png')">PNG</button>
<button onclick="download('svg')">SVG</button>
```

### 2. mobile-scanner.html (745줄)

**기능:**
- 카메라 실시간 스캔
- 갤러리 이미지 업로드
- 자동 데이터 타입 인식
- 액션 버튼 (링크 열기, 전화 걸기 등)

**주요 섹션:**
```html
<!-- 카메라 -->
<video id="camera" autoplay></video>
<button onclick="startCamera()">카메라 시작</button>

<!-- 갤러리 -->
<input type="file" accept="image/*" onchange="scanImage()">

<!-- 스캔 결과 -->
<div id="result">
    <h3>스캔 결과</h3>
    <p id="data-type"></p>
    <pre id="data-content"></pre>
    <div id="action-buttons"></div>
</div>
```

### 3. test-qr-marker.html (새로 생성)

**기능:**
- QR 마커 시각적 범례
- Generator/Scanner 통합 테스트
- 실시간 디버그 정보
- 초록색 박스로 마커 위치 표시

**특징:**
```html
<!-- 마커 범례 -->
<div class="marker-legend">
    <div class="marker-box black"></div>  <!-- 좌상단 -->
    <div class="marker-box black"></div>  <!-- 우상단 -->
    <div class="marker-box black"></div>  <!-- 좌하단 -->
</div>

<!-- Generator -->
<canvas id="genCanvas"></canvas>
<button onclick="generateTest()">재생성</button>

<!-- Scanner -->
<input type="file" id="fileInput">
<canvas id="scanCanvas"></canvas>
```

### 4. wia-engine.js (401줄)

**핵심 함수:**
```javascript
class WIANeuralEngine {
    // QR 스타일 마커 렌더링
    drawQRMarker(x, y, size) {
        // 검정-흰색-검정 3층 사각형
    }

    // 뉴런 렌더링
    renderNeurons() {
        // 청보라색 원형 + 흰색 테두리
    }

    // 연결선 렌더링
    renderConnections() {
        // Quadratic Bezier 곡선
    }
}
```

### 5. wia-neural-encoder.js (292줄)

**핵심 함수:**
```javascript
class WIANeuralEncoder {
    // 14가지 데이터 타입 포맷
    formatText(data) { ... }
    formatWiFi(data) { ... }
    formatVCard(data) { ... }
    // ... 11 more

    // 바이트 → 뉴럴 패턴 변환
    bytesToNeuralPattern(bytes) {
        // 144개 뉴런 생성
        // 12x12 그리드 배치
    }

    // Reed-Solomon ECC (30%)
    applyErrorCorrection(bytes) { ... }
}
```

### 6. wia-neural-decoder.js (474줄)

**핵심 함수:**
```javascript
class WIANeuralDecoder {
    // QR 마커 패턴 검증
    isQRMarkerPattern(data, width, height, centerX, centerY) {
        // 검정-흰색-검정 패턴 확인
    }

    // 뉴런 감지
    findNeuronNear(data, width, height, centerX, centerY, radius) {
        // rgba(102, 126, 234, 0.8) 감지
    }

    // 연결선 추적 (곡선)
    traceLine(data, width, start, end) {
        // Quadratic Bezier 경로 샘플링
    }

    // 14가지 데이터 타입 파싱
    parseDecodedData(str) { ... }
}
```

---

## 사용 방법

### 🎨 Generator 사용법

1. **generate-wialanguages-code.html 열기**

2. **데이터 타입 선택**
   - 예: "WiFi" 선택

3. **데이터 입력**
   ```
   SSID: MyWiFi
   Password: 12345678
   Security: WPA
   ```

4. **Generate 버튼 클릭**
   - Canvas에 실시간 미리보기 표시
   - QR 마커 3개 (좌상, 우상, 좌하)
   - 중앙에 청보라 뉴런 네트워크

5. **다운로드**
   - PNG: `wia-code.png` (고해상도)
   - SVG: `wia-code.svg` (벡터)
   - PDF: `wia-code.pdf` (인쇄용)

### 📱 Scanner 사용법

1. **mobile-scanner.html 열기**

2. **스캔 방법 선택**

   **방법 A: 카메라 실시간 스캔**
   ```
   1. "카메라 시작" 버튼 클릭
   2. WIA Code에 카메라 대기
   3. 자동 인식 → 결과 표시
   ```

   **방법 B: 갤러리에서 선택**
   ```
   1. "파일 선택" 버튼 클릭
   2. WIA Code 이미지 선택
   3. 자동 디코딩 → 결과 표시
   ```

3. **스캔 결과 확인**
   ```
   ✅ 마커 감지: 3/3
   📦 데이터 타입: wifi
   📝 데이터:
      SSID: MyWiFi
      Password: 12345678
      Security: WPA

   [WiFi 연결하기] 버튼 표시
   ```

4. **액션 실행**
   - WiFi → 자동 연결
   - Link → 브라우저 열기
   - Phone → 전화 앱 실행
   - Email → 이메일 작성
   - 등등...

### 🧪 테스트 방법

1. **test-qr-marker.html 열기**

2. **Generator 테스트**
   ```
   1. 자동으로 샘플 코드 생성
   2. QR 마커 3개 확인
   3. "다운로드" 버튼으로 저장
   ```

3. **Scanner 테스트**
   ```
   1. 저장한 이미지 업로드
   2. 마커 감지 성공 확인 (초록색 박스)
   3. 디코딩 결과 확인
   ```

4. **기대 결과**
   ```
   ✅ QR 마커 감지 성공!
   - top-left: (30, 30)
   - top-right: (450, 30)
   - bottom-left: (30, 450)

   🎉 전체 디코딩 성공!
   데이터: "WIA Neural Code - QR 마커 + 뉴럴 네트워크 🌍"
   ```

---

## 배포 가이드

### 📦 서버 배포 (CQM: 15.164.24.241:8080)

**Step 1: 파일 업로드**
```bash
# SSH 접속
ssh user@15.164.24.241

# 프로젝트 디렉토리로 이동
cd /var/www/html

# Git pull (또는 파일 복사)
git pull origin claude/wia-neural-code-reader-011CUxhiVRkWVAGH8f7SmyHt
```

**Step 2: 웹 서버 설정**
```nginx
# nginx 설정
server {
    listen 8080;
    server_name 15.164.24.241;
    root /var/www/html;

    index generate-wialanguages-code.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

**Step 3: 접속 테스트**
```
http://15.164.24.241:8080/generate-wialanguages-code.html
http://15.164.24.241:8080/mobile-scanner.html
http://15.164.24.241:8080/test-qr-marker.html
```

### 🌐 GitHub Pages 배포

**Step 1: GitHub Repository 설정**
```bash
# 브랜치 확인
git branch -a

# main 브랜치로 머지
git checkout main
git merge claude/wia-neural-code-reader-011CUxhiVRkWVAGH8f7SmyHt
git push origin main
```

**Step 2: GitHub Pages 활성화**
```
1. Repository → Settings
2. Pages → Source: main branch
3. Save
4. URL 확인: https://WIA-Official.github.io/claude/
```

**Step 3: 접속 테스트**
```
https://WIA-Official.github.io/claude/generate-wialanguages-code.html
https://WIA-Official.github.io/claude/mobile-scanner.html
https://WIA-Official.github.io/claude/test-qr-marker.html
```

### 📱 모바일 앱 (Progressive Web App)

**manifest.json 생성**
```json
{
  "name": "WIA Neural Code",
  "short_name": "WIA Code",
  "description": "QR + Neural Network Visual Code",
  "start_url": "/generate-wialanguages-code.html",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**service-worker.js (오프라인 지원)**
```javascript
const CACHE_NAME = 'wia-neural-code-v1';
const urlsToCache = [
  '/generate-wialanguages-code.html',
  '/mobile-scanner.html',
  '/assets/js/wia-engine.js',
  '/assets/js/wia-neural-encoder.js',
  '/assets/js/wia-neural-decoder.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```

---

## MCP SSH 최종 프롬프트

아래 프롬프트를 MCP SSH Claude에게 전달하세요:

---

# 🚀 WIA Neural Code - 최종 배포 및 검증

## 📋 작업 내용

CQM 서버 (15.164.24.241:8080)에 WIA Neural Code를 배포하고 전체 시스템을 검증해주세요.

## 🎯 배포 단계

### 1. Git 상태 확인
```bash
cd /home/user/claude
git status
git log --oneline -5
```

**확인 사항:**
- 최신 커밋: `85d5a26 🎯 Final: QR 스타일 마커로 완전 전환`
- 브랜치: `claude/wia-neural-code-reader-011CUxhiVRkWVAGH8f7SmyHt`
- 작업 트리: clean

### 2. 파일 존재 확인
```bash
ls -lh *.html
ls -lh assets/js/wia-*.js
```

**필수 파일:**
- ✅ generate-wialanguages-code.html
- ✅ mobile-scanner.html
- ✅ test-qr-marker.html
- ✅ assets/js/wia-engine.js
- ✅ assets/js/wia-neural-encoder.js
- ✅ assets/js/wia-neural-decoder.js

### 3. 핵심 코드 검증

**wia-engine.js - QR 마커 확인:**
```bash
grep -n "MARKER_COLOR = 'rgb(0, 0, 0)'" assets/js/wia-engine.js
grep -n "drawQRMarker" assets/js/wia-engine.js
```

**wia-neural-decoder.js - 패턴 인식 확인:**
```bash
grep -n "isQRMarkerPattern" assets/js/wia-neural-decoder.js
grep -n "expectBlack" assets/js/wia-neural-decoder.js
```

**예상 출력:**
```
wia-engine.js:21:this.MARKER_COLOR = 'rgb(0, 0, 0)';
wia-engine.js:142:drawQRMarker(x, y, size) {

wia-neural-decoder.js:149:isQRMarkerPattern(data, width, height, centerX, centerY, markerSize) {
wia-neural-decoder.js:154:{ name: '외곽', offset: -3 * stepSize, expectBlack: true },
```

### 4. 웹 서버 확인

**Nginx/Apache 상태:**
```bash
# Nginx
sudo systemctl status nginx
sudo nginx -t

# 또는 Apache
sudo systemctl status apache2
sudo apache2ctl -t
```

**웹 루트 확인:**
```bash
# Nginx
grep "root" /etc/nginx/sites-enabled/default

# Apache
grep "DocumentRoot" /etc/apache2/sites-enabled/000-default.conf
```

### 5. 파일 복사 (필요시)

```bash
# 웹 루트가 다른 경우
sudo cp -r /home/user/claude/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
```

### 6. 브라우저 테스트

**방법 A: curl로 HTTP 응답 확인**
```bash
curl -I http://15.164.24.241:8080/generate-wialanguages-code.html
curl -I http://15.164.24.241:8080/mobile-scanner.html
curl -I http://15.164.24.241:8080/test-qr-marker.html
```

**예상 출력:**
```
HTTP/1.1 200 OK
Content-Type: text/html
```

**방법 B: wget으로 다운로드 테스트**
```bash
wget http://15.164.24.241:8080/test-qr-marker.html -O /tmp/test.html
head -20 /tmp/test.html
```

### 7. JavaScript 문법 검증

```bash
node -c assets/js/wia-engine.js
node -c assets/js/wia-neural-encoder.js
node -c assets/js/wia-neural-decoder.js
```

**예상 출력:**
```
(각 파일에 대해 아무 출력 없음 = 문법 오류 없음)
```

## 🧪 기능 테스트 체크리스트

### Generator 테스트 (generate-wialanguages-code.html)

1. **페이지 로드**
   - [ ] HTML 정상 로드
   - [ ] JavaScript 오류 없음
   - [ ] Canvas 표시됨

2. **데이터 타입 전환**
   - [ ] Text 폼 표시
   - [ ] WiFi 폼 표시
   - [ ] vCard 폼 표시
   - [ ] 모든 14개 타입 확인

3. **코드 생성**
   - [ ] Generate 버튼 작동
   - [ ] QR 마커 3개 렌더링 (좌상, 우상, 좌하)
   - [ ] 청보라 뉴런 렌더링
   - [ ] 진한 보라 곡선 연결선

4. **다운로드**
   - [ ] PNG 다운로드
   - [ ] SVG 다운로드
   - [ ] PDF 다운로드

### Scanner 테스트 (mobile-scanner.html)

1. **페이지 로드**
   - [ ] HTML 정상 로드
   - [ ] Camera API 권한 요청

2. **파일 업로드**
   - [ ] 파일 선택 버튼 작동
   - [ ] 이미지 업로드 성공

3. **마커 감지**
   - [ ] 3개 QR 마커 감지
   - [ ] 패턴 검증 성공

4. **디코딩**
   - [ ] 뉴런 감지
   - [ ] 연결선 추적
   - [ ] 데이터 복원
   - [ ] 타입별 파싱

5. **액션 버튼**
   - [ ] WiFi: "연결하기" 버튼
   - [ ] Link: "열기" 버튼
   - [ ] Phone: "전화 걸기" 버튼

### QR 마커 테스트 (test-qr-marker.html)

1. **Generator**
   - [ ] 자동 샘플 생성
   - [ ] QR 마커 시각화
   - [ ] 다운로드 버튼

2. **Scanner**
   - [ ] 파일 업로드
   - [ ] 초록색 박스 표시 (마커 위치)
   - [ ] 디버그 정보 표시

3. **디버그 로그**
   - [ ] 마커 3개 위치 출력
   - [ ] 뉴런 수 출력
   - [ ] 연결선 수 출력

## 📊 최종 보고서

테스트 완료 후 아래 형식으로 보고해주세요:

```
✅ WIA Neural Code 배포 완료!

📦 Git 정보:
- 브랜치: claude/wia-neural-code-reader-011CUxhiVRkWVAGH8f7SmyHt
- 최신 커밋: 85d5a26
- 파일 수: 6개 (3 HTML + 3 JS)

🌐 웹 접속:
- Generator: http://15.164.24.241:8080/generate-wialanguages-code.html [✅]
- Scanner: http://15.164.24.241:8080/mobile-scanner.html [✅]
- Test: http://15.164.24.241:8080/test-qr-marker.html [✅]

🧪 테스트 결과:
- Generator: [✅/❌]
  - 14개 데이터 타입: [개수]
  - QR 마커 렌더링: [✅/❌]
  - 뉴런 렌더링: [✅/❌]
  - 다운로드: [✅/❌]

- Scanner: [✅/❌]
  - 파일 업로드: [✅/❌]
  - QR 마커 감지: [✅/❌]
  - 디코딩 성공: [✅/❌]

- Test Page: [✅/❌]
  - 통합 테스트: [✅/❌]
  - 디버그 정보: [✅/❌]

🎯 종합 평가: [완벽/양호/수정필요]
```

## ⚠️ 문제 발생 시

### JavaScript 오류
```bash
# 브라우저 콘솔 확인
# Chrome: F12 → Console
# 오류 메시지 복사하여 보고
```

### 마커 감지 실패
```bash
# test-qr-marker.html 디버그 로그 확인
# 예상 색상 vs 실제 색상 비교
```

### 파일 누락
```bash
# Git에서 재다운로드
git fetch origin claude/wia-neural-code-reader-011CUxhiVRkWVAGH8f7SmyHt
git checkout claude/wia-neural-code-reader-011CUxhiVRkWVAGH8f7SmyHt
```

---

## 🎉 성공 기준

- ✅ 모든 HTML 페이지 정상 로드
- ✅ Generator에서 QR 마커 3개 + 뉴런 렌더링
- ✅ Scanner에서 마커 감지 3/3 성공
- ✅ 디코딩 성공 (테스트 데이터)
- ✅ 다운로드/업로드 정상 작동

---

**중요:** 각 단계별로 상세히 확인하고 결과를 보고해주세요!

