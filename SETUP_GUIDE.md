# 🚀 WIA Neural Code - 전체 시스템 설치 가이드

## 📍 파일 위치 및 구조

### 로컬 경로
```
/home/user/claude/
├── 📦 압축 파일
│   ├── wia-neural-code-system.tar.gz           (17KB) - 웹 시스템
│   └── mobile-app/
│       └── WIANeuralCode-mobile-app.tar.gz     (10KB) - 모바일 앱
│
├── 🌐 웹 시스템
│   ├── assets/
│   │   └── js/
│   │       ├── wia-neural-encoder.js           (11KB)
│   │       ├── wia-neural-decoder.js           (15KB)
│   │       └── wia-engine.js                   (13KB)
│   ├── wia-neural-reader.html                  (23KB) - 스캔 페이지
│   └── test-wia-system.html                    (14KB) - 테스트 페이지
│
└── 📱 모바일 앱
    └── mobile-app/WIANeuralCode/
        ├── App.js                              - 메인 앱
        ├── package.json                        - 의존성
        ├── src/utils/
        │   ├── WIANeuralEncoder.js             - 모바일 인코더
        │   └── WIANeuralDecoder.js             - 모바일 디코더
        └── README.md                           - 모바일 설치 가이드
```

### GitHub 저장소
```
저장소: https://github.com/WIA-Official/claude
브랜치: claude/wia-neural-code-reader-011CUxhiVRkWVAGH8f7SmyHt
```

---

## 🖥️ 웹 시스템 서버 업로드

### 방법 1: GitHub에서 직접 Clone (추천)

```bash
# 서버 SSH 접속
ssh ec2-user@YOUR_SERVER_IP

# 작업 디렉토리로 이동
cd /home/ec2-user/wiacode/

# GitHub에서 Clone
git clone https://github.com/WIA-Official/claude.git wia-neural-code
cd wia-neural-code
git checkout claude/wia-neural-code-reader-011CUxhiVRkWVAGH8f7SmyHt

# 파일 확인
ls -la assets/js/
ls -la *.html
```

### 방법 2: 압축 파일 직접 업로드

```bash
# 로컬에서 서버로 압축 파일 전송
scp /home/user/claude/wia-neural-code-system.tar.gz \
    ec2-user@YOUR_SERVER_IP:/home/ec2-user/wiacode/

# 서버에서 압축 해제
ssh ec2-user@YOUR_SERVER_IP
cd /home/ec2-user/wiacode/
tar -xzf wia-neural-code-system.tar.gz
```

### 방법 3: 개별 파일 업로드

```bash
# assets 폴더 업로드
scp -r /home/user/claude/assets \
    ec2-user@YOUR_SERVER_IP:/home/ec2-user/wiacode/

# HTML 파일 업로드
scp /home/user/claude/wia-neural-reader.html \
    ec2-user@YOUR_SERVER_IP:/home/ec2-user/wiacode/

scp /home/user/claude/test-wia-system.html \
    ec2-user@YOUR_SERVER_IP:/home/ec2-user/wiacode/
```

### 웹 서버 실행

```bash
# Python 3로 간단한 웹 서버 실행
cd /home/ec2-user/wiacode/
python3 -m http.server 8080

# Node.js가 있다면
npx http-server -p 8080

# 또는 Nginx 설정 (/etc/nginx/sites-available/wia)
server {
    listen 80;
    server_name wiacode.yourserver.com;
    root /home/ec2-user/wiacode;
    index wia-neural-reader.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 브라우저에서 접속

```
http://YOUR_SERVER_IP:8080/test-wia-system.html       (테스트)
http://YOUR_SERVER_IP:8080/wia-neural-reader.html     (리더기)
```

### 주의사항

1. **방화벽 설정** - 8080 포트 오픈 필요
   ```bash
   sudo ufw allow 8080
   # 또는 AWS Security Group에서 8080 포트 추가
   ```

2. **HTTPS 필요** (카메라 사용 시)
   - Let's Encrypt 사용: `sudo certbot --nginx`
   - 또는 CloudFlare 같은 CDN 사용

3. **파일 권한**
   ```bash
   chmod 644 *.html
   chmod 644 assets/js/*.js
   chmod 755 assets/js/
   ```

---

## 📱 모바일 앱 설치 및 빌드

### 1. 압축 파일 추출

```bash
# 로컬에서
cd /home/user/claude/mobile-app/
tar -xzf WIANeuralCode-mobile-app.tar.gz
cd WIANeuralCode/
```

### 2. 의존성 설치

```bash
# Node.js 패키지 설치
npm install

# iOS 의존성 (macOS만)
cd ios
pod install
cd ..
```

### 3. 개발 모드 실행

```bash
# Android
npm run android

# iOS (macOS만)
npm run ios
```

### 4. Android APK 빌드

```bash
# 디버그 APK
cd android
./gradlew assembleDebug

# 생성 위치
# android/app/build/outputs/apk/debug/app-debug.apk

# 릴리즈 APK (서명 필요)
./gradlew assembleRelease
```

### 5. iOS 빌드 (macOS만)

```bash
# Xcode에서 빌드
open ios/WIANeuralCode.xcworkspace

# Product > Archive > Distribute App
```

---

## 🔧 MCP SSH용 프롬프트

다른 Claude(MCP SSH 기능 있는)에게 전달할 프롬프트:

```markdown
WIA Neural Code 시스템을 서버에 업로드해주세요.

**서버 정보:**
- 주소: YOUR_SERVER_IP
- 사용자: ec2-user
- 경로: /home/ec2-user/wiacode/

**작업 내용:**

1. GitHub에서 Clone
```bash
ssh ec2-user@YOUR_SERVER_IP
cd /home/ec2-user/wiacode/
git clone https://github.com/WIA-Official/claude.git wia-neural-code
cd wia-neural-code
git checkout claude/wia-neural-code-reader-011CUxhiVRkWVAGH8f7SmyHt
```

2. 웹 서버 실행
```bash
python3 -m http.server 8080
```

3. 방화벽 설정
```bash
sudo ufw allow 8080
```

4. 브라우저 접속 테스트
- http://YOUR_SERVER_IP:8080/test-wia-system.html
- http://YOUR_SERVER_IP:8080/wia-neural-reader.html

완료 후 접속 URL과 결과를 알려주세요.
```

---

## 📊 시스템 테스트

### 웹 시스템 테스트

1. `test-wia-system.html` 열기
2. "🔄 전체 사이클 테스트" 버튼 클릭
3. 성공률 100% 확인

### 모바일 앱 테스트

1. 앱 실행
2. "스캔하기" 선택
3. 웹에서 생성한 WIA Neural Code 스캔
4. 데이터 정상 디코딩 확인

---

## 🆘 문제 해결

### 웹 시스템

**문제: 미리보기가 안 보임**
```bash
# 브라우저 콘솔 확인 (F12)
# JS 파일 경로 확인
ls -la assets/js/
```

**문제: CORS 오류**
```bash
# 다른 포트에서 실행
python3 -m http.server 8081
```

### 모바일 앱

**문제: 카메라 권한 오류**
```bash
# AndroidManifest.xml 확인
# Info.plist 확인
```

**문제: 빌드 오류**
```bash
# 캐시 삭제
npm start -- --reset-cache
rm -rf node_modules && npm install
```

---

## 📞 지원

- 이슈: https://github.com/WIA-Official/claude/issues
- 이메일: support@wiacode.com

---

## ✅ 체크리스트

### 웹 시스템 배포
- [ ] 서버에 파일 업로드 완료
- [ ] 웹 서버 실행 중
- [ ] 방화벽 포트 오픈
- [ ] 브라우저에서 접속 확인
- [ ] 테스트 페이지 정상 작동
- [ ] 리더기 카메라 작동 (HTTPS 필요)

### 모바일 앱 빌드
- [ ] 의존성 설치 완료
- [ ] 개발 모드 실행 성공
- [ ] Android APK 빌드 완료
- [ ] iOS 빌드 완료 (macOS만)
- [ ] 카메라 권한 작동
- [ ] 스캔 기능 테스트 완료

---

**생성 일시:** 2025-11-09
**버전:** 1.0.0
**작성자:** Claude AI
