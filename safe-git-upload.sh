#!/bin/bash

################################################################################
# WIA 프로젝트 안전 GitHub 업로드 스크립트
# 민감정보는 서버에 보관하고, 코드만 GitHub에 업로드
################################################################################

set -e  # 에러 발생 시 즉시 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 프로젝트 디렉토리 입력받기
echo ""
echo "=========================================="
echo "  WIA 안전 GitHub 업로드 스크립트"
echo "=========================================="
echo ""

read -p "프로젝트 디렉토리 경로를 입력하세요 (예: /var/www/myproject): " PROJECT_DIR

# 디렉토리 존재 확인
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "디렉토리가 존재하지 않습니다: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
log_success "디렉토리 이동: $PROJECT_DIR"

# GitHub 레포지토리 URL 입력
read -p "GitHub 레포지토리 URL (예: https://github.com/WIA-Official/project.git): " GITHUB_URL

echo ""
log_info "========================================"
log_info "Step 1: 민감정보 파일 백업"
log_info "========================================"

# 백업 디렉토리 생성
BACKUP_DIR="$HOME/wia-secrets-backup/$(basename $PROJECT_DIR)_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 민감정보 파일 목록
SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    ".env.development"
    "config/database.js"
    "config/secrets.js"
    "config/credentials.json"
    "*.pem"
    "*.key"
    "*.cert"
    "secrets/"
    "private/"
)

# 민감정보 파일 백업
log_info "민감정보 파일을 백업합니다..."
for pattern in "${SENSITIVE_FILES[@]}"; do
    # 파일이 존재하는지 확인
    files=$(find . -maxdepth 2 -name "$pattern" 2>/dev/null || true)
    if [ -n "$files" ]; then
        while IFS= read -r file; do
            if [ -f "$file" ] || [ -d "$file" ]; then
                cp -r "$file" "$BACKUP_DIR/" 2>/dev/null || true
                log_success "백업: $file"
            fi
        done <<< "$files"
    fi
done

log_success "백업 완료: $BACKUP_DIR"

echo ""
log_info "========================================"
log_info "Step 2: .gitignore 생성"
log_info "========================================"

# .gitignore 파일 생성
cat > .gitignore << 'EOF'
# ============================================
# WIA 프로젝트 - 민감정보 보호
# ============================================

# 환경변수 및 설정 파일
.env
.env.*
!.env.example
*.local
config/database.js
config/secrets.js
config/credentials.json

# 인증 키 및 인증서
*.pem
*.key
*.cert
*.p12
*.pfx
secrets/
private/
certs/

# 데이터베이스
*.db
*.sqlite
*.sqlite3
*.sql
dump.sql

# 로그 파일
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 의존성
node_modules/
vendor/
bower_components/
jspm_packages/

# 빌드 결과물
dist/
build/
out/
.next/
.nuxt/

# 캐시
.cache/
.parcel-cache/
.vscode-test/
*.tmp
*.temp

# IDE 설정
.vscode/
.idea/
*.swp
*.swo
*.swn
.DS_Store

# OS 관련
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
Desktop.ini

# 테스트 커버리지
coverage/
.nyc_output/

# 백업 파일
*.bak
*.backup
*~

# 사용자 업로드 파일 (선택사항)
# uploads/
# public/uploads/

# AWS 및 클라우드 설정
.aws/
.elasticbeanstalk/

# Docker 비밀정보
docker-compose.override.yml
.dockerignore

# Python
__pycache__/
*.py[cod]
*$py.class
.Python
env/
venv/
ENV/
.venv

# Ruby
*.gem
.bundle/

# Java
*.class
*.jar
*.war

# PHP
composer.phar
vendor/

# WordPress (해당되는 경우)
wp-config.php
.htaccess

EOF

log_success ".gitignore 파일 생성 완료"

echo ""
log_info "========================================"
log_info "Step 3: .env.example 생성"
log_info "========================================"

# .env 파일이 존재하면 .env.example 생성
if [ -f ".env" ]; then
    log_info ".env 파일을 기반으로 .env.example 생성 중..."

    # .env의 키만 추출하고 값은 예시로 변경
    while IFS='=' read -r key value; do
        # 주석이나 빈 줄은 그대로 유지
        if [[ $key =~ ^#.*$ ]] || [[ -z $key ]]; then
            echo "$key" >> .env.example
        else
            # 값을 예시로 변경
            echo "${key}=your_${key,,}_here" >> .env.example
        fi
    done < .env

    log_success ".env.example 생성 완료"
else
    log_warning ".env 파일이 없습니다. .env.example을 수동으로 생성해주세요."
fi

echo ""
log_info "========================================"
log_info "Step 4: 민감정보 검사"
log_info "========================================"

# 위험한 패턴 검사
log_info "민감정보가 코드에 하드코딩되어 있는지 검사합니다..."

DANGEROUS_PATTERNS=(
    "password.*=.*['\"].*['\"]"
    "api[_-]?key.*=.*['\"].*['\"]"
    "secret.*=.*['\"].*['\"]"
    "token.*=.*['\"].*['\"]"
    "aws[_-]?access[_-]?key"
    "private[_-]?key.*=.*['\"].*['\"]"
)

FOUND_ISSUES=0

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
    # .git, node_modules 등 제외하고 검색
    results=$(grep -r -i -E "$pattern" . \
        --exclude-dir={.git,node_modules,vendor,dist,build,.next,.nuxt} \
        --exclude={*.min.js,*.map,package-lock.json,yarn.lock} \
        2>/dev/null || true)

    if [ -n "$results" ]; then
        log_warning "⚠️  하드코딩된 민감정보 발견:"
        echo "$results" | head -5
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    fi
done

if [ $FOUND_ISSUES -gt 0 ]; then
    log_warning "⚠️  $FOUND_ISSUES 개의 잠재적 민감정보가 발견되었습니다."
    log_warning "계속 진행하기 전에 확인하세요!"
    read -p "계속 진행하시겠습니까? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        log_error "사용자가 중단했습니다."
        exit 1
    fi
else
    log_success "✓ 하드코딩된 민감정보가 발견되지 않았습니다."
fi

echo ""
log_info "========================================"
log_info "Step 5: Git 초기화"
log_info "========================================"

# 기존 .git 디렉토리 확인
if [ -d ".git" ]; then
    log_warning ".git 디렉토리가 이미 존재합니다."
    read -p "기존 Git 저장소를 삭제하고 새로 시작하시겠습니까? (yes/no): " RESET_GIT
    if [ "$RESET_GIT" = "yes" ]; then
        # 기존 .git 백업
        mv .git "$BACKUP_DIR/.git_backup"
        log_success "기존 .git을 백업했습니다: $BACKUP_DIR/.git_backup"
        git init
        log_success "Git 저장소를 새로 초기화했습니다."
    else
        log_info "기존 Git 저장소를 유지합니다."
    fi
else
    git init
    log_success "Git 저장소 초기화 완료"
fi

echo ""
log_info "========================================"
log_info "Step 6: Git 사용자 설정"
log_info "========================================"

# Git 사용자 정보 확인
GIT_USER=$(git config user.name 2>/dev/null || echo "")
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")

if [ -z "$GIT_USER" ]; then
    read -p "Git 사용자 이름을 입력하세요: " GIT_USER
    git config user.name "$GIT_USER"
fi

if [ -z "$GIT_EMAIL" ]; then
    read -p "Git 이메일을 입력하세요: " GIT_EMAIL
    git config user.email "$GIT_EMAIL"
fi

log_success "Git 사용자 설정 완료: $GIT_USER <$GIT_EMAIL>"

echo ""
log_info "========================================"
log_info "Step 7: 파일 추가 및 커밋"
log_info "========================================"

# 모든 파일 추가 (.gitignore에 의해 필터링됨)
git add .

# 상태 확인
log_info "추가된 파일 목록:"
git status --short | head -20

# 민감정보가 스테이징 영역에 있는지 최종 확인
STAGED_SENSITIVE=$(git status --short | grep -E '\.env$|\.pem$|\.key$|secrets/' || true)
if [ -n "$STAGED_SENSITIVE" ]; then
    log_error "⛔ 민감정보 파일이 스테이징 영역에 있습니다:"
    echo "$STAGED_SENSITIVE"
    log_error "중단합니다. .gitignore를 확인하세요."
    exit 1
fi

log_success "✓ 민감정보 파일이 스테이징 영역에 없습니다."

# 커밋
COMMIT_MESSAGE="🚀 Initial commit - WIA Project (secrets excluded)

- ✅ 프로젝트 코드 업로드
- 🔒 민감정보 제외 (.env, *.key 등)
- 📝 .gitignore 추가
- 📋 .env.example 추가
- 💾 민감정보 백업: $BACKUP_DIR
"

git commit -m "$COMMIT_MESSAGE"
log_success "커밋 완료"

echo ""
log_info "========================================"
log_info "Step 8: GitHub 레포지토리 연결"
log_info "========================================"

# 기존 remote 확인
EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [ -n "$EXISTING_REMOTE" ]; then
    log_warning "기존 remote origin이 설정되어 있습니다: $EXISTING_REMOTE"
    read -p "새 URL로 변경하시겠습니까? (yes/no): " CHANGE_REMOTE
    if [ "$CHANGE_REMOTE" = "yes" ]; then
        git remote set-url origin "$GITHUB_URL"
        log_success "Remote URL 변경 완료"
    fi
else
    git remote add origin "$GITHUB_URL"
    log_success "Remote origin 추가 완료"
fi

echo ""
log_info "========================================"
log_info "Step 9: GitHub에 푸시"
log_info "========================================"

log_info "GitHub에 푸시합니다..."

# 기본 브랜치 이름 확인
DEFAULT_BRANCH=$(git branch --show-current)
if [ -z "$DEFAULT_BRANCH" ]; then
    DEFAULT_BRANCH="main"
    git branch -M main
fi

# 푸시
read -p "지금 GitHub에 푸시하시겠습니까? (yes/no): " DO_PUSH
if [ "$DO_PUSH" = "yes" ]; then
    git push -u origin "$DEFAULT_BRANCH"
    log_success "✓ GitHub 푸시 완료!"
else
    log_info "푸시를 건너뛰었습니다. 나중에 수동으로 실행하세요:"
    log_info "  git push -u origin $DEFAULT_BRANCH"
fi

echo ""
log_success "========================================"
log_success "🎉 완료!"
log_success "========================================"
echo ""
log_info "📋 요약:"
log_info "  - 프로젝트: $(basename $PROJECT_DIR)"
log_info "  - 백업 위치: $BACKUP_DIR"
log_info "  - GitHub: $GITHUB_URL"
log_info "  - 브랜치: $DEFAULT_BRANCH"
echo ""
log_warning "⚠️  중요 알림:"
log_warning "  1. 민감정보 백업: $BACKUP_DIR"
log_warning "  2. .env 파일은 서버에만 보관됩니다"
log_warning "  3. GitHub에 올라간 내용을 반드시 확인하세요"
log_warning "  4. 다른 개발자는 .env.example을 복사하여 사용해야 합니다"
echo ""
log_info "📌 다음 단계:"
log_info "  1. GitHub에서 레포지토리 확인"
log_info "  2. .env 파일이 없는지 재확인"
log_info "  3. README.md 파일 추가 권장"
echo ""

# README 생성 제안
read -p "README.md 파일을 생성하시겠습니까? (yes/no): " CREATE_README
if [ "$CREATE_README" = "yes" ]; then
    cat > README.md << EOF
# $(basename $PROJECT_DIR)

## 🚀 프로젝트 설명

이 프로젝트는 WIA 시스템의 일부입니다.

## 📦 설치 방법

\`\`\`bash
# 레포지토리 클론
git clone $GITHUB_URL
cd $(basename $PROJECT_DIR)

# 의존성 설치
npm install  # 또는 yarn install

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어서 실제 값으로 수정하세요
\`\`\`

## ⚙️ 환경변수 설정

\`.env.example\` 파일을 참고하여 다음 환경변수를 설정하세요:

- \`DB_HOST\`: 데이터베이스 호스트
- \`DB_USER\`: 데이터베이스 사용자
- \`DB_PASSWORD\`: 데이터베이스 비밀번호
- \`API_KEY\`: API 키
- 기타 필요한 설정...

## 🏃 실행 방법

\`\`\`bash
npm start  # 또는 node app.js
\`\`\`

## 📝 라이선스

© $(date +%Y) WIA Family

## 🔒 보안

민감한 정보(.env 파일 등)는 절대 커밋하지 마세요!
EOF

    git add README.md
    git commit -m "📝 Add README.md"

    if [ "$DO_PUSH" = "yes" ]; then
        git push origin "$DEFAULT_BRANCH"
    fi

    log_success "README.md 생성 완료"
fi

echo ""
log_success "✨ 모든 작업이 완료되었습니다! ✨"
echo ""
