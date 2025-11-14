#!/usr/bin/env node
// WIA Neural Decoder 간단 테스트 스크립트

console.log("🔬 WIA Neural Decoder 테스트 시작...\n");

// 주요 설정 확인
const fs = require('fs');
const decoderPath = '/var/www/wiacode/assets/js/wia-neural-decoder.js';
const content = fs.readFileSync(decoderPath, 'utf8');

// 설정값 추출
const tolerance = content.match(/NEURON_TOLERANCE = (\d+)/);
const radius = content.match(/findNeuronNear.*?,\s*(\d+)\s*\/\/ 넓은/);
const intensity = content.match(/maxIntensity > ([\d.]+)/);
const alpha = content.match(/a > (\d+)/);

console.log("📊 현재 설정값:");
console.log(`  - NEURON_TOLERANCE: ${tolerance ? tolerance[1] : '?'}`);
console.log(`  - Search Radius: ${radius ? radius[1] : '?'}px`);
console.log(`  - Min Intensity: ${intensity ? intensity[1] : '?'}`);
console.log(`  - Alpha Threshold: ${alpha ? alpha[1] : '?'}`);

// 기대값 검증
const expected = {
    tolerance: '50',
    radius: '25',
    intensity: '0.3',
    alpha: '100'
};

let allGood = true;
if (tolerance && tolerance[1] === expected.tolerance) {
    console.log("✅ NEURON_TOLERANCE 정상");
} else {
    console.log("❌ NEURON_TOLERANCE 불일치");
    allGood = false;
}

if (radius && radius[1] === expected.radius) {
    console.log("✅ Search Radius 정상");
} else {
    console.log("❌ Search Radius 불일치");
    allGood = false;
}

if (intensity && intensity[1] === expected.intensity) {
    console.log("✅ Min Intensity 정상");
} else {
    console.log("❌ Min Intensity 불일치");
    allGood = false;
}

if (alpha && alpha[1] === expected.alpha) {
    console.log("✅ Alpha Threshold 정상");
} else {
    console.log("❌ Alpha Threshold 불일치");
    allGood = false;
}

console.log("\n" + (allGood ? "🎉 모든 설정이 완벽합니다!" : "⚠️ 일부 설정 확인 필요"));
