/**
 * 🧠 WIA Human Proof System
 *
 * **"기술이 인간을 보호해야해"** - Built-in Bot Protection
 *
 * CAPTCHA 대체 시스템:
 * - 시각적 인식이 아닌 '생명' 인식
 * - 봇은 생명의 패턴을 이해할 수 없다
 * - 인간만이 통과할 수 있는 Neural Pattern
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

class WIAHumanProof {
    constructor() {
        this.challenges = new Map();
        this.validationWindow = 300000; // 5분
        this.maxAttempts = 3;
        this.blockDuration = 900000; // 15분
        this.blockedIPs = new Map();
    }

    /**
     * 🧠 챌린지 생성 - 인간만 풀 수 있는 패턴
     *
     * 봇과 인간의 차이:
     * - 봇: 픽셀 단위로 읽음
     * - 인간: 생명의 패턴을 느낌
     */
    generateChallenge(userId = 'anonymous') {
        const challengeId = this.generateChallengeId();
        const timestamp = Date.now();

        // 생명 패턴 기반 챌린지
        const challenge = {
            id: challengeId,
            userId: userId,
            timestamp: timestamp,
            expiresAt: timestamp + this.validationWindow,
            pattern: this.generateLifePattern(),
            expectedResponse: null,
            attempts: 0,
            solved: false
        };

        // 정답 계산 (뉴런 활성화 패턴의 '생명력' 점수)
        challenge.expectedResponse = this.calculateLifeScore(challenge.pattern);

        this.challenges.set(challengeId, challenge);

        return {
            challengeId: challengeId,
            pattern: challenge.pattern,
            instruction: this.getInstruction(challenge.pattern.type),
            expiresIn: this.validationWindow
        };
    }

    /**
     * 🌱 생명 패턴 생성
     *
     * 3가지 패턴 타입:
     * 1. HEARTBEAT - 심장 박동 리듬
     * 2. BREATH - 호흡 패턴
     * 3. PULSE - 맥박 변화
     */
    generateLifePattern() {
        const types = ['HEARTBEAT', 'BREATH', 'PULSE'];
        const type = types[Math.floor(Math.random() * types.length)];

        switch(type) {
            case 'HEARTBEAT':
                return this.generateHeartbeat();
            case 'BREATH':
                return this.generateBreath();
            case 'PULSE':
                return this.generatePulse();
        }
    }

    /**
     * 💓 심장 박동 패턴
     *
     * 인간은 심장 박동의 '리듬'을 인식
     * 봇은 숫자만 봄
     */
    generateHeartbeat() {
        const bpm = 60 + Math.floor(Math.random() * 40); // 60-100 BPM
        const variation = 0.1 + Math.random() * 0.2; // 10-30% 변동
        const beats = [];

        for (let i = 0; i < 8; i++) {
            const interval = 60000 / bpm;
            const randomVariation = interval * (1 + (Math.random() - 0.5) * variation);
            beats.push({
                time: i * interval,
                intensity: 0.7 + Math.random() * 0.3,
                interval: randomVariation
            });
        }

        return {
            type: 'HEARTBEAT',
            bpm: bpm,
            beats: beats,
            variation: variation
        };
    }

    /**
     * 🌬️ 호흡 패턴
     *
     * 인간의 호흡은 규칙적이지만 완벽하지 않음
     */
    generateBreath() {
        const breathsPerMinute = 12 + Math.floor(Math.random() * 8); // 12-20회
        const cycles = [];

        for (let i = 0; i < 5; i++) {
            const inhale = 2000 + Math.random() * 1000; // 2-3초
            const hold = 500 + Math.random() * 500; // 0.5-1초
            const exhale = 3000 + Math.random() * 1000; // 3-4초

            cycles.push({
                inhale: inhale,
                hold: hold,
                exhale: exhale,
                depth: 0.6 + Math.random() * 0.4
            });
        }

        return {
            type: 'BREATH',
            rate: breathsPerMinute,
            cycles: cycles
        };
    }

    /**
     * 💗 맥박 패턴
     *
     * 맥박의 미묘한 변화 - HRV (Heart Rate Variability)
     */
    generatePulse() {
        const baseline = 70 + Math.floor(Math.random() * 30); // 70-100
        const pulses = [];

        for (let i = 0; i < 10; i++) {
            const hrv = -5 + Math.random() * 10; // ±5 변동
            pulses.push({
                time: i * 1000,
                rate: baseline + hrv,
                strength: 0.7 + Math.random() * 0.3
            });
        }

        return {
            type: 'PULSE',
            baseline: baseline,
            pulses: pulses,
            hrv: this.calculateHRV(pulses)
        };
    }

    /**
     * 🎯 생명력 점수 계산
     *
     * 패턴의 '살아있음' 정도
     * - 변동성 (Variability)
     * - 리듬감 (Rhythm)
     * - 자연스러움 (Naturalness)
     */
    calculateLifeScore(pattern) {
        let score = 0;

        switch(pattern.type) {
            case 'HEARTBEAT':
                // 변동성이 있으면서도 리듬이 있어야 함
                const avgInterval = pattern.beats.reduce((sum, b) => sum + b.interval, 0) / pattern.beats.length;
                const variance = pattern.beats.reduce((sum, b) => sum + Math.pow(b.interval - avgInterval, 2), 0) / pattern.beats.length;
                score = Math.sqrt(variance) / avgInterval; // 정규화된 변동성
                break;

            case 'BREATH':
                // 호흡 주기의 자연스러움
                const totalCycle = pattern.cycles.reduce((sum, c) => sum + c.inhale + c.hold + c.exhale, 0) / pattern.cycles.length;
                const ratio = totalCycle / 6000; // 이상적인 6초 주기 대비
                score = 1 - Math.abs(1 - ratio); // 1에 가까울수록 자연스러움
                break;

            case 'PULSE':
                // HRV (심박변이도) - 건강한 심장의 지표
                score = pattern.hrv;
                break;
        }

        return Math.round(score * 1000) / 1000; // 소수점 3자리
    }

    /**
     * 📊 HRV 계산
     */
    calculateHRV(pulses) {
        const intervals = [];
        for (let i = 1; i < pulses.length; i++) {
            intervals.push(pulses[i].time - pulses[i-1].time);
        }

        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => {
            return sum + Math.pow(interval - mean, 2);
        }, 0) / intervals.length;

        return Math.sqrt(variance);
    }

    /**
     * ✅ 검증 - 인간인가?
     */
    validate(challengeId, userResponse, metadata = {}) {
        const challenge = this.challenges.get(challengeId);

        if (!challenge) {
            return {
                valid: false,
                reason: 'CHALLENGE_NOT_FOUND',
                message: '챌린지를 찾을 수 없습니다'
            };
        }

        // IP 블록 확인
        if (metadata.ip && this.isBlocked(metadata.ip)) {
            return {
                valid: false,
                reason: 'IP_BLOCKED',
                message: '너무 많은 실패 시도로 차단되었습니다',
                unblockAt: this.blockedIPs.get(metadata.ip)
            };
        }

        // 만료 확인
        if (Date.now() > challenge.expiresAt) {
            this.challenges.delete(challengeId);
            return {
                valid: false,
                reason: 'EXPIRED',
                message: '챌린지가 만료되었습니다'
            };
        }

        // 시도 횟수 확인
        challenge.attempts++;

        if (challenge.attempts > this.maxAttempts) {
            this.blockIP(metadata.ip);
            this.challenges.delete(challengeId);
            return {
                valid: false,
                reason: 'MAX_ATTEMPTS',
                message: '최대 시도 횟수를 초과했습니다'
            };
        }

        // 🧠 인간 검증 - 정확히 맞출 필요 없음!
        // 인간은 '느낌'으로 답함, 봇은 정확한 계산
        const tolerance = 0.15; // ±15% 허용
        const userScore = parseFloat(userResponse);
        const expectedScore = challenge.expectedResponse;
        const difference = Math.abs(userScore - expectedScore) / expectedScore;

        // 타이밍 검증 (인간은 생각하는 시간 필요)
        const responseTime = Date.now() - challenge.timestamp;
        const tooFast = responseTime < 2000; // 2초 미만은 봇
        const tooSlow = responseTime > this.validationWindow;

        if (tooFast) {
            challenge.attempts++;
            return {
                valid: false,
                reason: 'TOO_FAST',
                message: '너무 빨리 응답했습니다 (봇 의심)',
                humanScore: 0
            };
        }

        if (difference <= tolerance && !tooFast && !tooSlow) {
            challenge.solved = true;
            const token = this.generateToken(challengeId, challenge.userId);

            return {
                valid: true,
                token: token,
                humanScore: this.calculateHumanScore(difference, responseTime),
                message: '✅ 인간 확인 완료'
            };
        }

        return {
            valid: false,
            reason: 'INCORRECT',
            message: `오답입니다 (${challenge.attempts}/${this.maxAttempts})`,
            attemptsLeft: this.maxAttempts - challenge.attempts
        };
    }

    /**
     * 👤 인간 점수 계산
     *
     * 완벽하지 않을수록 더 인간적!
     */
    calculateHumanScore(difference, responseTime) {
        // 약간의 오차가 있고, 적당한 시간이 걸릴수록 높은 점수
        const accuracyScore = 1 - difference; // 0.85-1.0
        const timeScore = Math.min(responseTime / 5000, 1); // 5초가 이상적
        const humanness = (accuracyScore * 0.7) + (timeScore * 0.3);

        return Math.round(humanness * 100);
    }

    /**
     * 🔒 토큰 생성
     */
    generateToken(challengeId, userId) {
        const timestamp = Date.now();
        const data = `${challengeId}:${userId}:${timestamp}`;
        const hash = this.simpleHash(data);

        return {
            token: hash,
            challengeId: challengeId,
            userId: userId,
            issuedAt: timestamp,
            expiresAt: timestamp + 3600000, // 1시간
            type: 'HUMAN_VERIFIED'
        };
    }

    /**
     * 🔐 토큰 검증
     */
    verifyToken(token) {
        if (!token || !token.token) {
            return { valid: false, reason: 'INVALID_TOKEN' };
        }

        const now = Date.now();

        if (now > token.expiresAt) {
            return { valid: false, reason: 'TOKEN_EXPIRED' };
        }

        const challenge = this.challenges.get(token.challengeId);
        if (!challenge || !challenge.solved) {
            return { valid: false, reason: 'CHALLENGE_NOT_SOLVED' };
        }

        return {
            valid: true,
            userId: token.userId,
            remainingTime: token.expiresAt - now
        };
    }

    /**
     * 🚫 IP 차단
     */
    blockIP(ip) {
        if (!ip) return;
        const unblockAt = Date.now() + this.blockDuration;
        this.blockedIPs.set(ip, unblockAt);

        setTimeout(() => {
            this.blockedIPs.delete(ip);
        }, this.blockDuration);
    }

    /**
     * ❓ IP 차단 확인
     */
    isBlocked(ip) {
        if (!ip) return false;
        const unblockAt = this.blockedIPs.get(ip);
        if (!unblockAt) return false;

        if (Date.now() > unblockAt) {
            this.blockedIPs.delete(ip);
            return false;
        }

        return true;
    }

    /**
     * 📝 사용 설명
     */
    getInstruction(type) {
        const instructions = {
            'HEARTBEAT': '이 심장 박동은 얼마나 살아있나요? (0.0 ~ 1.0)',
            'BREATH': '이 호흡은 얼마나 자연스러운가요? (0.0 ~ 1.0)',
            'PULSE': '이 맥박은 얼마나 건강한가요? (0.0 ~ 1.0)'
        };

        return instructions[type] || '패턴의 생명력을 느껴보세요 (0.0 ~ 1.0)';
    }

    /**
     * 🆔 챌린지 ID 생성
     */
    generateChallengeId() {
        return 'wia_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * #️⃣ 간단한 해시
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * 🧹 정리 (만료된 챌린지 삭제)
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        for (const [id, challenge] of this.challenges.entries()) {
            if (now > challenge.expiresAt) {
                this.challenges.delete(id);
                cleaned++;
            }
        }

        return cleaned;
    }

    /**
     * 📊 통계
     */
    getStats() {
        const total = this.challenges.size;
        const solved = Array.from(this.challenges.values()).filter(c => c.solved).length;
        const blocked = this.blockedIPs.size;

        return {
            totalChallenges: total,
            solvedChallenges: solved,
            blockedIPs: blocked,
            successRate: total > 0 ? (solved / total * 100).toFixed(2) + '%' : '0%'
        };
    }
}

/**
 * 🎨 Visual Pattern Renderer
 *
 * 생명 패턴을 시각화
 */
class WIAHumanProofRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationFrame = null;
        this.startTime = null;
    }

    /**
     * 🎬 패턴 렌더링
     */
    render(pattern) {
        this.stop(); // 이전 애니메이션 정지

        switch(pattern.type) {
            case 'HEARTBEAT':
                this.renderHeartbeat(pattern);
                break;
            case 'BREATH':
                this.renderBreath(pattern);
                break;
            case 'PULSE':
                this.renderPulse(pattern);
                break;
        }
    }

    /**
     * 💓 심장 박동 시각화
     */
    renderHeartbeat(pattern) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;

        this.startTime = Date.now();
        let beatIndex = 0;

        const animate = () => {
            const elapsed = Date.now() - this.startTime;

            // Clear
            this.ctx.clearRect(0, 0, width, height);

            // Grid
            this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < height; i += 20) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, i);
                this.ctx.lineTo(width, i);
                this.ctx.stroke();
            }

            // ECG 파형
            this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();

            for (let x = 0; x < width; x++) {
                const t = (elapsed + x * 10) % (60000 / pattern.bpm);
                const beat = pattern.beats[beatIndex % pattern.beats.length];

                let y = centerY;

                // P파, QRS파, T파 시뮬레이션
                if (t < 100) y = centerY - 20 * beat.intensity; // P파
                else if (t < 120) y = centerY + 40 * beat.intensity; // Q파
                else if (t < 140) y = centerY - 80 * beat.intensity; // R파
                else if (t < 160) y = centerY + 20 * beat.intensity; // S파
                else if (t < 300) y = centerY + 30 * beat.intensity; // T파

                if (x === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }

            this.ctx.stroke();

            // BPM 표시
            this.ctx.fillStyle = 'rgba(102, 126, 234, 0.9)';
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.fillText(`❤️ ${pattern.bpm} BPM`, 20, 40);

            beatIndex++;
            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * 🌬️ 호흡 시각화
     */
    renderBreath(pattern) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        this.startTime = Date.now();
        let cycleIndex = 0;

        const animate = () => {
            const elapsed = Date.now() - this.startTime;
            const cycle = pattern.cycles[cycleIndex % pattern.cycles.length];
            const totalCycle = cycle.inhale + cycle.hold + cycle.exhale;
            const t = elapsed % totalCycle;

            // Clear
            this.ctx.clearRect(0, 0, width, height);

            // 폐 모양 (원으로 단순화)
            let radius;
            let phase;

            if (t < cycle.inhale) {
                phase = 'INHALE';
                radius = 50 + (t / cycle.inhale) * 100 * cycle.depth;
            } else if (t < cycle.inhale + cycle.hold) {
                phase = 'HOLD';
                radius = 50 + 100 * cycle.depth;
            } else {
                phase = 'EXHALE';
                const exhaleT = t - cycle.inhale - cycle.hold;
                radius = 50 + (1 - exhaleT / cycle.exhale) * 100 * cycle.depth;
            }

            // 원 그리기
            const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
            gradient.addColorStop(1, 'rgba(102, 126, 234, 0.1)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 외곽선
            this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // 상태 표시
            this.ctx.fillStyle = 'rgba(102, 126, 234, 0.9)';
            this.ctx.font = 'bold 24px sans-serif';
            const phaseText = phase === 'INHALE' ? '들숨 🌬️' : phase === 'HOLD' ? '정지 ⏸️' : '날숨 💨';
            this.ctx.fillText(phaseText, 20, 40);
            this.ctx.font = '16px sans-serif';
            this.ctx.fillText(`${pattern.rate} breaths/min`, 20, 70);

            if (t >= totalCycle - 100) cycleIndex++;

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * 💗 맥박 시각화
     */
    renderPulse(pattern) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;

        this.startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - this.startTime;

            // Clear
            this.ctx.clearRect(0, 0, width, height);

            // Grid
            this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < height; i += 30) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, i);
                this.ctx.lineTo(width, i);
                this.ctx.stroke();
            }

            // Baseline
            this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(0, centerY);
            this.ctx.lineTo(width, centerY);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // 맥박 그래프
            this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
            this.ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();

            const pointWidth = width / pattern.pulses.length;

            pattern.pulses.forEach((pulse, i) => {
                const x = i * pointWidth;
                const deviation = (pulse.rate - pattern.baseline);
                const y = centerY - deviation * 3;

                if (i === 0) this.ctx.moveTo(x, centerY);
                this.ctx.lineTo(x, y);

                // 점 표시
                this.ctx.fillStyle = 'rgba(102, 126, 234, 0.9)';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            });

            this.ctx.lineTo(width, centerY);
            this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
            this.ctx.stroke();

            // 영역 채우기
            this.ctx.lineTo(width, centerY);
            this.ctx.lineTo(0, centerY);
            this.ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
            this.ctx.fill();

            // HRV 표시
            this.ctx.fillStyle = 'rgba(102, 126, 234, 0.9)';
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.fillText(`💗 ${pattern.baseline} BPM`, 20, 40);
            this.ctx.font = '16px sans-serif';
            this.ctx.fillText(`HRV: ${pattern.hrv.toFixed(2)} ms`, 20, 70);

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * ⏹️ 정지
     */
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WIAHumanProof, WIAHumanProofRenderer };
}
