# WIA Address 프로젝트 분석 요청

## 📋 분석을 위해 필요한 정보:

서버에서 다음 명령어를 실행해서 결과를 보내주세요:

```bash
cd /var/www/wiaaddress

# 1. 프로젝트 구조
tree -L 2 -I 'node_modules|venv|__pycache__|data'

# 또는
ls -la
ls -la api/ 2>/dev/null || echo "api 디렉토리 없음"

# 2. Python 파일 목록
find . -name "*.py" -type f | head -20

# 3. 메인 파일들
ls -lh *.py *.html index.* 2>/dev/null

# 4. 정부 API 사용 코드 검색
grep -r "juso.go.kr\|vworld\|API" --include="*.py" --include="*.js" | head -10
```

## 🎯 특히 중요한 파일:

다음 파일들의 내용을 보내주세요:
- 메인 진입점 (index.html, main.py, app.py 등)
- 정부 API 호출 코드
- 다국어 번역 로직
- 설정 파일 (.env.example)
