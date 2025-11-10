#!/bin/bash

################################################################################
# WIA 프로젝트 민감정보 자동 제거 + GitHub 업로드 스크립트
# 민감정보를 환경변수로 자동 변환하고 안전하게 업로드
################################################################################

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_action() { echo -e "${CYAN}[ACTION]${NC} $1"; }

echo ""
echo "=========================================="
echo "  WIA 민감정보 자동 제거 + GitHub 업로드"
echo "=========================================="
echo ""

read -p "프로젝트 디렉토리 경로: " PROJECT_DIR

if [ ! -d "$PROJECT_DIR" ]; then
    log_error "디렉토리가 존재하지 않습니다: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
log_success "디렉토리 이동: $PROJECT_DIR"

read -p "GitHub 레포지토리 URL: " GITHUB_URL

# 백업 디렉토리 생성
BACKUP_DIR="$HOME/wia-secrets-backup/$(basename $PROJECT_DIR)_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/original_files"

log_success "백업 디렉토리: $BACKUP_DIR"

echo ""
log_info "========================================"
log_info "Step 1: 민감정보 자동 감지 및 제거"
log_info "========================================"

# .env 파일 생성 (없으면)
if [ ! -f ".env" ]; then
    touch .env
    log_success ".env 파일 생성"
fi

# 환경변수 카운터
ENV_COUNTER=0

# Python 파일에서 민감정보 자동 변환
log_info "Python 파일 검사 중..."

# DB 비밀번호 패턴
find . -type f -name "*.py" \
    -not -path "./venv/*" \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" | while read file; do

    # 원본 백업
    if grep -q "password='wiatrip2025'" "$file" 2>/dev/null || \
       grep -q 'password="wiatrip2025"' "$file" 2>/dev/null; then

        cp "$file" "$BACKUP_DIR/original_files/$(basename $file).bak"
        log_action "발견: $file - DB 비밀번호 하드코딩"

        # .env에 추가 (중복 방지)
        if ! grep -q "DB_PASSWORD=" .env; then
            echo "DB_PASSWORD=wiatrip2025" >> .env
            log_success ".env에 DB_PASSWORD 추가"
        fi

        # Python 파일 수정
        sed -i.bak "s/password='wiatrip2025'/password=os.getenv('DB_PASSWORD')/g" "$file"
        sed -i.bak 's/password="wiatrip2025"/password=os.getenv("DB_PASSWORD")/g' "$file"

        # import 문 추가 (없으면)
        if ! grep -q "import os" "$file"; then
            sed -i.bak '1s/^/import os\n/' "$file"
        fi

        log_success "수정 완료: $file"
        ENV_COUNTER=$((ENV_COUNTER + 1))
    fi

    # Kakao API 키
    if grep -q 'KAKAO_REST_API_KEY = "ed44ee03c2133a6ce17f62f399503443"' "$file" 2>/dev/null; then

        cp "$file" "$BACKUP_DIR/original_files/$(basename $file)_kakao.bak" 2>/dev/null || true
        log_action "발견: $file - Kakao API 키 하드코딩"

        # .env에 추가
        if ! grep -q "KAKAO_REST_API_KEY=" .env; then
            echo "KAKAO_REST_API_KEY=ed44ee03c2133a6ce17f62f399503443" >> .env
            log_success ".env에 KAKAO_REST_API_KEY 추가"
        fi

        # Python 파일 수정
        sed -i.bak 's/KAKAO_REST_API_KEY = "ed44ee03c2133a6ce17f62f399503443"/KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY")/g' "$file"

        # import 문 추가
        if ! grep -q "import os" "$file"; then
            sed -i.bak '1s/^/import os\n/' "$file"
        fi

        log_success "수정 완료: $file"
        ENV_COUNTER=$((ENV_COUNTER + 1))
    fi
done

# .bak 파일 삭제
find . -name "*.bak" -delete

log_success "총 $ENV_COUNTER 개의 민감정보를 환경변수로 변환했습니다"

echo ""
log_info "========================================"
log_info "Step 2: .gitignore 생성"
log_info "========================================"

cat > .gitignore << 'EOF'
# ============================================
# WIA 프로젝트 - 민감정보 보호
# ============================================

# 환경변수
.env
.env.*
!.env.example

# 인증 정보
*.pem
*.key
*.cert
config/database.js
config/secrets.js
credentials.json

# 데이터베이스
*.db
*.sqlite
*.sql
dump.sql

# 백업 파일
*.bak
*.backup
*~

# Python
__pycache__/
*.py[cod]
*$py.class
.Python
venv/
env/
ENV/
.venv

# Node.js
node_modules/
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# 로그
logs/
*.log

# 빌드
dist/
build/
*.egg-info/

# Jupyter
.ipynb_checkpoints/

# 캐시
.cache/
*.tmp

# 대용량 데이터 파일 (선택사항)
# agoda_data/*.sql
# data/*.csv
EOF

log_success ".gitignore 생성 완료"

echo ""
log_info "========================================"
log_info "Step 3: .env.example 생성"
log_info "========================================"

if [ -f ".env" ] && [ -s ".env" ]; then
    # .env에서 키만 추출
    while IFS='=' read -r key value; do
        if [[ ! $key =~ ^#.*$ ]] && [[ -n $key ]]; then
            echo "${key}=your_${key,,}_here" >> .env.example
        fi
    done < .env

    log_success ".env.example 생성 완료"
else
    log_warning ".env 파일이 비어있습니다"
fi

echo ""
log_info "========================================"
log_info "Step 4: 대용량 파일 제외 옵션"
log_info "========================================"

# SQL/CSV 파일 크기 확인
LARGE_FILES=$(find . -type f \( -name "*.sql" -o -name "*.csv" \) -size +10M 2>/dev/null || true)

if [ -n "$LARGE_FILES" ]; then
    log_warning "10MB 이상의 대용량 파일 발견:"
    echo "$LARGE_FILES"
    echo ""
    read -p "이 파일들을 .gitignore에 추가하시겠습니까? (yes/no): " EXCLUDE_LARGE

    if [ "$EXCLUDE_LARGE" = "yes" ]; then
        echo "" >> .gitignore
        echo "# 대용량 데이터 파일" >> .gitignore
        echo "$LARGE_FILES" | while read file; do
            # ./ 제거
            clean_file=$(echo "$file" | sed 's|^\./||')
            echo "$clean_file" >> .gitignore
            log_success "제외: $clean_file"
        done
    fi
fi

echo ""
log_info "========================================"
log_info "Step 5: Git 초기화 및 커밋"
log_info "========================================"

if [ -d ".git" ]; then
    log_warning ".git 디렉토리가 이미 존재합니다"
    read -p "기존 Git 저장소를 유지하시겠습니까? (yes/no): " KEEP_GIT
    if [ "$KEEP_GIT" != "yes" ]; then
        mv .git "$BACKUP_DIR/.git_backup"
        git init
        log_success "Git 저장소 새로 초기화"
    fi
else
    git init
    log_success "Git 저장소 초기화"
fi

# Git 사용자 설정
GIT_USER=$(git config user.name 2>/dev/null || echo "")
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")

if [ -z "$GIT_USER" ]; then
    read -p "Git 사용자 이름: " GIT_USER
    git config user.name "$GIT_USER"
fi

if [ -z "$GIT_EMAIL" ]; then
    read -p "Git 이메일: " GIT_EMAIL
    git config user.email "$GIT_EMAIL"
fi

# 파일 추가
git add .

# 민감정보 최종 확인
STAGED_SENSITIVE=$(git diff --cached --name-only | grep -E '\.env$|\.pem$|\.key$|wiatrip2025|ed44ee03c2133a6ce17f62f399503443' || true)

if [ -n "$STAGED_SENSITIVE" ]; then
    log_error "⛔ 민감정보가 스테이징 영역에 있을 수 있습니다:"
    echo "$STAGED_SENSITIVE"
    read -p "계속 진행하시겠습니까? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        exit 1
    fi
fi

# 커밋
COMMIT_MESSAGE="🔒 민감정보 제거 및 환경변수화

변경사항:
- ✅ DB 비밀번호를 환경변수로 변환
- ✅ API 키를 환경변수로 변환
- 🔒 .env 파일에 민감정보 저장
- 📝 .env.example 템플릿 추가
- 🛡️ .gitignore 설정
- 💾 원본 파일 백업: $BACKUP_DIR

총 $ENV_COUNTER 개의 민감정보 처리 완료
"

git commit -m "$COMMIT_MESSAGE"
log_success "커밋 완료"

echo ""
log_info "========================================"
log_info "Step 6: GitHub 연결 및 푸시"
log_info "========================================"

EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [ -n "$EXISTING_REMOTE" ]; then
    git remote set-url origin "$GITHUB_URL"
else
    git remote add origin "$GITHUB_URL"
fi

DEFAULT_BRANCH=$(git branch --show-current || echo "main")
if [ -z "$DEFAULT_BRANCH" ]; then
    git branch -M main
    DEFAULT_BRANCH="main"
fi

read -p "GitHub에 푸시하시겠습니까? (yes/no): " DO_PUSH
if [ "$DO_PUSH" = "yes" ]; then
    git push -u origin "$DEFAULT_BRANCH"
    log_success "✓ GitHub 푸시 완료!"
fi

echo ""
log_success "========================================"
log_success "🎉 완료!"
log_success "========================================"
echo ""
log_info "📋 요약:"
log_info "  - 환경변수로 변환: $ENV_COUNTER 개"
log_info "  - 백업 위치: $BACKUP_DIR"
log_info "  - .env 파일: $(pwd)/.env"
log_info "  - GitHub: $GITHUB_URL"
echo ""
log_warning "⚠️  중요:"
log_warning "  1. .env 파일은 서버에만 보관됩니다"
log_warning "  2. 원본 파일 백업: $BACKUP_DIR/original_files/"
log_warning "  3. 수정된 코드가 정상 작동하는지 테스트하세요"
echo ""
log_info "🔧 서버에서 실행 방법:"
log_info "  1. .env 파일을 프로젝트 디렉토리에 복사"
log_info "  2. Python: python -m pip install python-dotenv"
log_info "  3. 코드 실행 전에 환경변수 로드"
echo ""

# README 추가 제안
read -p "사용 가이드를 README.md에 추가하시겠습니까? (yes/no): " ADD_README

if [ "$ADD_README" = "yes" ]; then
    cat >> README.md << EOF

## 🔧 환경 설정

### 1. 환경변수 설정

\`\`\`bash
# .env.example을 복사
cp .env.example .env

# .env 파일을 열어서 실제 값으로 수정
nano .env
\`\`\`

### 2. Python 환경변수 로드

\`\`\`bash
# python-dotenv 설치
pip install python-dotenv
\`\`\`

Python 코드에서 사용:
\`\`\`python
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 환경변수 사용
db_password = os.getenv('DB_PASSWORD')
api_key = os.getenv('KAKAO_REST_API_KEY')
\`\`\`

## 🔒 보안

- ⚠️ \`.env\` 파일은 절대 Git에 커밋하지 마세요
- ✅ \`.env.example\`만 커밋하세요
- 🔐 민감정보는 환경변수로 관리하세요
EOF

    git add README.md
    git commit -m "📝 환경변수 사용 가이드 추가"

    if [ "$DO_PUSH" = "yes" ]; then
        git push origin "$DEFAULT_BRANCH"
    fi

    log_success "README.md 업데이트 완료"
fi

echo ""
log_success "✨ 모든 작업이 완료되었습니다! ✨"
echo ""
