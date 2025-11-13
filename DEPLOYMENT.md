# 🚀 WIA Neural Code 배포 가이드

## 📱 PWA 배포 체크리스트

### ✅ 필수 요구사항
- [x] HTTPS 지원 (PWA 필수)
- [x] Service Worker 등록
- [x] manifest.json 설정
- [x] 모든 아이콘 파일 (72x72 ~ 512x512)
- [x] 오프라인 지원

### 🌍 라이브 URL
- **PWA Reader**: https://wiacode.com/wia-reader.html
- **Manifest**: https://wiacode.com/manifest.json
- **Service Worker**: https://wiacode.com/service-worker.js

## 🔧 배포 옵션

### 1. GitHub Pages
```bash
# GitHub Pages 브랜치 생성
git checkout -b gh-pages
git push origin gh-pages

# Settings > Pages > Source: gh-pages
# URL: https://[username].github.io/[repo-name]
```

### 2. Netlify
```bash
# netlify.toml 생성
[build]
  publish = "/"

# Drag & Drop 또는 Git 연동
# URL: https://[site-name].netlify.app
```

### 3. Vercel
```bash
# vercel.json 생성
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/wia-reader.html" }
  ]
}

# Deploy with Vercel CLI
vercel --prod
```

### 4. Firebase Hosting
```bash
# Firebase 초기화
firebase init hosting

# 배포
firebase deploy --only hosting
```

### 5. AWS S3 + CloudFront
```bash
# S3 버킷 생성 (정적 웹사이트 호스팅)
aws s3 sync . s3://wia-neural-code --delete

# CloudFront 배포 (HTTPS)
aws cloudfront create-distribution
```

## 📊 성능 최적화

### CDN 설정
```nginx
# Nginx 캐시 설정
location ~* \.(jpg|jpeg|png|gif|ico|svg)$ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}

location ~* \.(js|css)$ {
    expires 30d;
    add_header Cache-Control "public";
}

location /service-worker.js {
    expires 0;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### Cloudflare 설정
1. DNS 설정
2. SSL/TLS: Full (strict)
3. Page Rules:
   - `/*` - Cache Level: Standard
   - `/service-worker.js` - Cache Level: Bypass

## 🔒 보안 설정

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: blob:; 
               connect-src 'self';">
```

### CORS 설정
```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
```

## 📱 PWA 설치 테스트

### Desktop Chrome
1. https://wiacode.com/wia-reader.html 접속
2. 주소창 오른쪽 ⊕ 아이콘 클릭
3. "설치" 클릭

### Mobile Chrome/Safari
1. https://wiacode.com/wia-reader.html 접속
2. 메뉴 → "홈 화면에 추가"
3. 앱 이름 확인 후 "추가"

### 오프라인 테스트
1. PWA 설치 후 실행
2. 비행기 모드 활성화
3. 앱이 정상 작동하는지 확인

## 📈 모니터링

### Google Analytics
```javascript
// wia-reader.html에 추가
gtag('config', 'GA_MEASUREMENT_ID', {
  'page_title': 'WIA Neural Code Reader',
  'page_path': '/wia-reader.html'
});
```

### Lighthouse 점수
```bash
# Chrome DevTools > Lighthouse
# 목표 점수:
# - Performance: 90+
# - Accessibility: 100
# - Best Practices: 100  
# - SEO: 100
# - PWA: 100
```

## 🚀 런칭 체크리스트

- [ ] HTTPS 인증서 확인
- [ ] 모든 아이콘 파일 접근 가능
- [ ] Service Worker 등록 성공
- [ ] 오프라인 모드 테스트
- [ ] 카메라 권한 테스트
- [ ] PWA 설치 배너 표시
- [ ] 크로스 브라우저 테스트
- [ ] 모바일 반응형 확인
- [ ] 성능 최적화 완료
- [ ] 보안 헤더 설정

## 📞 지원

문제 발생 시:
- GitHub Issues: https://github.com/WIA-Official/claude/issues
- Email: support@wiacode.com
- Documentation: https://wiacode.com/docs

---

**"100년 후에도 존재할 수 있는 우리들의 코드"** 🌍
