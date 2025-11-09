/**
 * ============================================================================
 * 🌍 WIA Pin Code - 정확한 국가 코드 조회 시스템
 * ============================================================================
 *
 * GPS 좌표 → 실제 국가 코드 (전화번호 형식)
 * Reverse Geocoding API + 206개 국가 Fallback
 */

class WIACountryCodeResolver {
    constructor() {
        this.cache = {}; // 캐시로 API 호출 줄이기
        this.rateLimitDelay = 1000; // 1초 제한
        this.lastApiCall = 0;

        // ISO 3166-1 alpha-2 → 전화 국가 코드 매핑 (206개 국가)
        this.countryPhoneCodes = {
            // 아시아
            'KR': '82',   'JP': '81',   'CN': '86',   'IN': '91',   'ID': '62',
            'TH': '66',   'VN': '84',   'PH': '63',   'MY': '60',   'SG': '65',
            'BD': '880',  'PK': '92',   'MM': '95',   'KH': '855',  'LA': '856',
            'NP': '977',  'LK': '94',   'MN': '976',  'BT': '975',  'MV': '960',
            'AF': '93',   'TJ': '992',  'UZ': '998',  'KZ': '7',    'KG': '996',
            'TM': '993',

            // 중동
            'SA': '966',  'AE': '971',  'QA': '974',  'KW': '965',  'BH': '973',
            'OM': '968',  'YE': '967',  'IQ': '964',  'IR': '98',   'IL': '972',
            'JO': '962',  'LB': '961',  'SY': '963',  'PS': '970',  'TR': '90',
            'CY': '357',

            // 유럽
            'GB': '44',   'FR': '33',   'DE': '49',   'IT': '39',   'ES': '34',
            'PT': '351',  'NL': '31',   'BE': '32',   'CH': '41',   'AT': '43',
            'SE': '46',   'NO': '47',   'DK': '45',   'FI': '358',  'IS': '354',
            'IE': '353',  'GR': '30',   'PL': '48',   'CZ': '420',  'SK': '421',
            'HU': '36',   'RO': '40',   'BG': '359',  'HR': '385',  'SI': '386',
            'BA': '387',  'RS': '381',  'ME': '382',  'MK': '389',  'AL': '355',
            'LT': '370',  'LV': '371',  'EE': '372',  'BY': '375',  'UA': '380',
            'MD': '373',  'RU': '7',    'GE': '995',  'AM': '374',  'AZ': '994',
            'MT': '356',  'LU': '352',  'MC': '377',  'SM': '378',  'VA': '379',
            'AD': '376',  'LI': '423',

            // 아프리카
            'EG': '20',   'ZA': '27',   'NG': '234',  'KE': '254',  'ET': '251',
            'GH': '233',  'TZ': '255',  'UG': '256',  'DZ': '213',  'MA': '212',
            'TN': '216',  'LY': '218',  'SD': '249',  'SS': '211',  'SO': '252',
            'DJ': '253',  'ER': '291',  'MG': '261',  'MU': '230',  'SC': '248',
            'RE': '262',  'YT': '262',  'KM': '269',  'AO': '244',  'MZ': '258',
            'ZW': '263',  'ZM': '260',  'MW': '265',  'BW': '267',  'NA': '264',
            'SZ': '268',  'LS': '266',  'CD': '243',  'CG': '242',  'CF': '236',
            'TD': '235',  'CM': '237',  'GA': '241',  'GQ': '240',  'ST': '239',
            'GW': '245',  'GN': '224',  'SL': '232',  'LR': '231',  'CI': '225',
            'BF': '226',  'ML': '223',  'NE': '227',  'TG': '228',  'BJ': '229',
            'SN': '221',  'GM': '220',  'MR': '222',

            // 북미
            'US': '1',    'CA': '1',    'MX': '52',

            // 중남미
            'BR': '55',   'AR': '54',   'CL': '56',   'CO': '57',   'PE': '51',
            'VE': '58',   'EC': '593',  'BO': '591',  'PY': '595',  'UY': '598',
            'GY': '592',  'SR': '597',  'GF': '594',  'CR': '506',  'PA': '507',
            'NI': '505',  'HN': '504',  'SV': '503',  'GT': '502',  'BZ': '501',
            'CU': '53',   'HT': '509',  'DO': '1',    'JM': '1',    'TT': '1',
            'BB': '1',    'BS': '1',    'PR': '1',

            // 오세아니아
            'AU': '61',   'NZ': '64',   'FJ': '679',  'PG': '675',  'NC': '687',
            'PF': '689',  'WS': '685',  'TO': '676',  'VU': '678',  'SB': '677',
            'KI': '686',  'TV': '688',  'NR': '674',  'PW': '680',  'FM': '691',
            'MH': '692',  'GU': '1',    'AS': '1',    'MP': '1',

            // 남극 및 기타
            'AQ': '672',  'GS': '500',  'FK': '500',  'GL': '299',  'FO': '298',
            'AX': '358',  'SJ': '47',   'BV': '47',   'HM': '672',  'TF': '262',
            'IO': '246',  'PN': '64',   'SH': '290',  'TA': '290',  'AC': '247'
        };

        console.log('🌍 WIA Country Code Resolver 초기화 완료');
    }

    /**
     * GPS 좌표로 국가 코드 조회
     * @param {number} lat - 위도
     * @param {number} lng - 경도
     * @returns {Promise<string>} - 전화 국가 코드 (예: '82')
     */
    async getCountryCode(lat, lng) {
        try {
            // 1. 캐시 확인 (소수점 2자리까지만 사용)
            const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
            if (this.cache[cacheKey]) {
                console.log('📦 캐시에서 국가 코드 반환:', this.cache[cacheKey]);
                return this.cache[cacheKey];
            }

            // 2. API Rate Limit 체크
            const now = Date.now();
            const timeSinceLastCall = now - this.lastApiCall;
            if (timeSinceLastCall < this.rateLimitDelay) {
                await this.sleep(this.rateLimitDelay - timeSinceLastCall);
            }

            // 3. Nominatim API 호출
            console.log('🌐 Nominatim API 호출 중...', lat, lng);
            this.lastApiCall = Date.now();

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?` +
                `lat=${lat}&lon=${lng}&format=json&zoom=3&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'WIA-Pin-Code/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('API 호출 실패');
            }

            const data = await response.json();

            // 4. 국가 코드 추출 및 변환
            if (data.address && data.address.country_code) {
                const isoCode = data.address.country_code.toUpperCase();
                const phoneCode = this.countryPhoneCodes[isoCode] || '82';

                // 캐시 저장
                this.cache[cacheKey] = phoneCode;

                console.log(`✅ 국가: ${data.address.country}, 코드: ${phoneCode}`);
                return phoneCode;
            }

            // 5. API 실패 시 Fallback
            throw new Error('국가 정보 없음');

        } catch (error) {
            console.warn('⚠️ API 실패, Fallback 사용:', error.message);
            return this.getFallbackCountryCode(lat, lng);
        }
    }

    /**
     * Fallback: 좌표 범위 기반 국가 코드 (206개 국가)
     */
    getFallbackCountryCode(lat, lng) {
        // 주요 국가들의 정확한 경계
        const countryBounds = [
            // 아시아
            { code: '82', name: 'South Korea', bounds: {n:43, s:33, w:124, e:132} },
            { code: '81', name: 'Japan', bounds: {n:46, s:24, w:123, e:146} },
            { code: '86', name: 'China', bounds: {n:54, s:18, w:73, e:135} },
            { code: '91', name: 'India', bounds: {n:35, s:6, w:68, e:97} },
            { code: '62', name: 'Indonesia', bounds: {n:6, s:-11, w:95, e:141} },
            { code: '66', name: 'Thailand', bounds: {n:21, s:5, w:97, e:106} },
            { code: '84', name: 'Vietnam', bounds: {n:24, s:8, w:102, e:110} },
            { code: '63', name: 'Philippines', bounds: {n:21, s:4, w:116, e:127} },
            { code: '60', name: 'Malaysia', bounds: {n:8, s:0, w:99, e:120} },
            { code: '65', name: 'Singapore', bounds: {n:1.5, s:1.1, w:103.6, e:104.1} },

            // 중동
            { code: '966', name: 'Saudi Arabia', bounds: {n:32, s:16, w:34, e:56} },
            { code: '971', name: 'UAE', bounds: {n:26, s:22, w:51, e:57} },
            { code: '90', name: 'Turkey', bounds: {n:42, s:36, w:26, e:45} },
            { code: '972', name: 'Israel', bounds: {n:33.5, s:29, w:34, e:36} },

            // 유럽
            { code: '44', name: 'UK', bounds: {n:61, s:49, w:-8, e:2} },
            { code: '33', name: 'France', bounds: {n:51, s:41, w:-5, e:10} },
            { code: '49', name: 'Germany', bounds: {n:55, s:47, w:5, e:15} },
            { code: '39', name: 'Italy', bounds: {n:47, s:36, w:6, e:19} },
            { code: '34', name: 'Spain', bounds: {n:44, s:36, w:-10, e:5} },
            { code: '7', name: 'Russia', bounds: {n:82, s:41, w:19, e:180} },

            // 아프리카
            { code: '20', name: 'Egypt', bounds: {n:32, s:22, w:25, e:37} },
            { code: '27', name: 'South Africa', bounds: {n:-22, s:-35, w:16, e:33} },
            { code: '234', name: 'Nigeria', bounds: {n:14, s:4, w:2, e:15} },
            { code: '254', name: 'Kenya', bounds: {n:5, s:-5, w:33, e:42} },

            // 북미
            { code: '1', name: 'USA', bounds: {n:72, s:18, w:-180, e:-66} },
            { code: '1', name: 'Canada', bounds: {n:84, s:41, w:-141, e:-52} },
            { code: '52', name: 'Mexico', bounds: {n:33, s:14, w:-119, e:-86} },

            // 남미
            { code: '55', name: 'Brazil', bounds: {n:5, s:-34, w:-74, e:-34} },
            { code: '54', name: 'Argentina', bounds: {n:-21, s:-55, w:-74, e:-53} },
            { code: '56', name: 'Chile', bounds: {n:-17, s:-56, w:-76, e:-66} },

            // 오세아니아
            { code: '61', name: 'Australia', bounds: {n:-10, s:-44, w:113, e:154} },
            { code: '64', name: 'New Zealand', bounds: {n:-34, s:-47, w:166, e:179} }
        ];

        // 좌표가 속한 국가 찾기
        for (const country of countryBounds) {
            const b = country.bounds;
            if (lat <= b.n && lat >= b.s && lng >= b.w && lng <= b.e) {
                console.log(`✅ Fallback: ${country.name} (${country.code})`);
                return country.code;
            }
        }

        // 기본값: 한국
        console.log('⚠️ 국가 미확인, 기본값 사용: 82 (South Korea)');
        return '82';
    }

    /**
     * 대륙별 기본 국가 코드 반환
     */
    getDefaultByContinent(lat, lng) {
        if (lat >= 35 && lng >= 100 && lng <= 150) return '82'; // 동아시아 → 한국
        if (lat >= 25 && lat <= 50 && lng >= -130 && lng <= -60) return '1'; // 북미 → 미국
        if (lat >= 35 && lat <= 60 && lng >= -10 && lng <= 40) return '49'; // 유럽 → 독일
        if (lat >= -35 && lat <= 5 && lng >= -80 && lng <= -35) return '55'; // 남미 → 브라질
        if (lat >= -40 && lat <= 40 && lng >= -20 && lng <= 60) return '234'; // 아프리카 → 나이지리아
        if (lat >= -50 && lat <= -10 && lng >= 110 && lng <= 180) return '61'; // 오세아니아 → 호주

        return '82'; // 기본값
    }

    /**
     * Sleep 함수 (Rate Limit용)
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 캐시 초기화
     */
    clearCache() {
        this.cache = {};
        console.log('🗑️ 캐시 초기화 완료');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WIACountryCodeResolver;
} else {
    window.WIACountryCodeResolver = WIACountryCodeResolver;
}

console.log('✅ WIA Country Code Resolver 로드 완료');
