# 📱 WIA Neural Code - React Native Mobile App

30년 앞선 QR 코드를 대체하는 차세대 코드 시스템의 모바일 앱 버전입니다.

## 🎯 주요 기능

- ✅ **실시간 카메라 스캔** - WIA Neural Code를 카메라로 스캔
- ✅ **코드 생성** - 내장 인코더로 직접 코드 생성
- ✅ **갤러리 지원** - 저장된 이미지에서 코드 읽기
- ✅ **스캔 히스토리** - 최근 10개 스캔 기록 저장
- ✅ **다양한 데이터 타입** - Text, Link, WiFi, vCard, Email, SMS 등

## 🛠️ 기술 스택

- **React Native 0.72** - 크로스 플랫폼 모바일 프레임워크
- **React Native Vision Camera** - 고성능 카메라 API
- **React Native Image Picker** - 갤러리 접근
- **React Native Linear Gradient** - 그라디언트 UI
- **React Native Vector Icons** - 아이콘

## 📦 설치 방법

### 1. 사전 요구사항

```bash
# Node.js 16 이상 필요
node --version  # v16.x.x 이상

# React Native 개발 환경 설정
# Android: Android Studio + SDK
# iOS: Xcode (macOS만)
```

### 2. 프로젝트 설치

```bash
# 의존성 설치
cd mobile-app/WIANeuralCode
npm install

# iOS 의존성 설치 (macOS만)
cd ios
pod install
cd ..
```

### 3. 실행

```bash
# Android
npm run android

# iOS (macOS만)
npm run ios
```

## 📱 Android 빌드

```bash
# 디버그 APK 생성
cd android
./gradlew assembleDebug

# 생성된 APK 위치:
# android/app/build/outputs/apk/debug/app-debug.apk

# 릴리즈 APK 생성 (서명 필요)
./gradlew assembleRelease
```

## 🍎 iOS 빌드

```bash
# Xcode에서 빌드
open ios/WIANeuralCode.xcworkspace

# 또는 명령줄에서
cd ios
xcodebuild -workspace WIANeuralCode.xcworkspace \
  -scheme WIANeuralCode \
  -configuration Release \
  -archivePath build/WIANeuralCode.xcarchive archive
```

## 🔑 권한 설정

### Android (`android/app/src/main/AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### iOS (`ios/WIANeuralCode/Info.plist`)

```xml
<key>NSCameraUsageDescription</key>
<string>WIA Neural Code를 스캔하기 위해 카메라 접근이 필요합니다.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>저장된 WIA Neural Code 이미지를 읽기 위해 갤러리 접근이 필요합니다.</string>
```

## 📂 프로젝트 구조

```
WIANeuralCode/
├── App.js                          # 메인 앱
├── src/
│   └── utils/
│       ├── WIANeuralEncoder.js     # 인코더
│       └── WIANeuralDecoder.js     # 디코더
├── android/                        # Android 네이티브 코드
├── ios/                            # iOS 네이티브 코드
├── package.json                    # 의존성 목록
└── README.md                       # 이 파일
```

## 🎨 화면 구성

1. **홈 화면** - 스캔/생성/갤러리/히스토리 메뉴
2. **스캔 화면** - 실시간 카메라 뷰 + 스캔 프레임
3. **결과 화면** - 디코딩된 데이터 표시 + 액션 버튼
4. **히스토리 화면** - 최근 스캔 기록

## 🔧 주요 컴포넌트

### WIANeuralEncoder
```javascript
import { WIANeuralEncoder } from './src/utils/WIANeuralEncoder';

const encoder = new WIANeuralEncoder();
const pattern = encoder.encode('text', { content: 'Hello WIA!' });
```

### WIANeuralDecoder
```javascript
import { WIANeuralDecoder } from './src/utils/WIANeuralDecoder';

const decoder = new WIANeuralDecoder();
const result = await decoder.decodeFromImage(imagePath);
console.log(result.type, result.data);
```

## 🐛 트러블슈팅

### 카메라가 작동하지 않음
```bash
# 권한 확인
# Android: 설정 > 앱 > WIA Neural Code > 권한
# iOS: 설정 > 개인정보 보호 > 카메라

# 권한 재설정
npm run android -- --reset-cache
```

### Metro bundler 오류
```bash
# 캐시 삭제
npm start -- --reset-cache

# node_modules 재설치
rm -rf node_modules
npm install
```

### Android 빌드 오류
```bash
# Gradle 캐시 삭제
cd android
./gradlew clean

# 빌드 재시도
./gradlew assembleDebug
```

## 📊 성능 최적화

- **이미지 크기 최적화** - 카메라 해상도 조절
- **디코딩 속도** - 백그라운드 스레드에서 처리
- **메모리 관리** - 스캔 후 이미지 즉시 해제

## 🚀 다음 단계

- [ ] 코드 생성 UI 완성
- [ ] 배치 스캔 기능
- [ ] QR 코드 호환 모드
- [ ] 클라우드 동기화
- [ ] 다국어 지원 (211개 언어)

## 📝 라이선스

Copyright © 2025 WIA Family. All rights reserved.

## 🤝 기여

버그 리포트 및 기능 제안은 이슈로 등록해주세요!

## 📧 문의

- Email: support@wiacode.com
- Website: https://wiacode.com
