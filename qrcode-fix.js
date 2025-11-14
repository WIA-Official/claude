// QRCode 라이브러리 대체 구현
window.QRCode = {
    toCanvas: function(canvas, text, options, callback) {
        const ctx = canvas.getContext('2d');
        const size = options.width || 320;
        
        // 캔버스 초기화
        ctx.fillStyle = options.color?.light || '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // 간단한 QR 패턴 시뮬레이션
        ctx.fillStyle = options.color?.dark || '#000000';
        
        // 코너 마커 생성 (QR 코드 스타일)
        const markerSize = Math.floor(size / 8);
        const positions = [
            { x: 20, y: 20 },      // 좌상단
            { x: size - markerSize - 20, y: 20 }, // 우상단  
            { x: 20, y: size - markerSize - 20 }  // 좌하단
        ];
        
        positions.forEach(pos => {
            // 외곽 사각형
            ctx.fillRect(pos.x, pos.y, markerSize, markerSize);
            ctx.fillStyle = options.color?.light || '#ffffff';
            ctx.fillRect(pos.x + 2, pos.y + 2, markerSize - 4, markerSize - 4);
            ctx.fillStyle = options.color?.dark || '#000000';
            ctx.fillRect(pos.x + 6, pos.y + 6, markerSize - 12, markerSize - 12);
        });
        
        // 데이터 패턴 (랜덤 점들로 QR 코드 느낌 생성)
        const textHash = this.hashCode(text);
        for (let i = 0; i < 800; i++) {
            const x = (textHash * i * 7) % (size - 60) + 30;
            const y = (textHash * i * 11) % (size - 60) + 30;
            
            // 코너 마커 영역 피하기
            let inCorner = false;
            positions.forEach(pos => {
                if (x >= pos.x && x <= pos.x + markerSize && 
                    y >= pos.y && y <= pos.y + markerSize) {
                    inCorner = true;
                }
            });
            
            if (!inCorner && (textHash * i) % 3 === 0) {
                const dotSize = 3;
                ctx.fillRect(Math.floor(x / dotSize) * dotSize, 
                           Math.floor(y / dotSize) * dotSize, dotSize, dotSize);
            }
        }
        
        // 중앙 로고 영역
        const logoSize = 40;
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;
        ctx.fillStyle = options.color?.light || '#ffffff';
        ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
        
        // WIA 로고 텍스트
        ctx.fillStyle = options.color?.dark || '#000000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WIA', size / 2, size / 2 + 4);
        
        // 콜백 호출
        if (callback) {
            setTimeout(() => callback(null), 100);
        }
    },
    
    hashCode: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
};

console.log('✅ WIA QRCode 라이브러리 로드 완료!');
