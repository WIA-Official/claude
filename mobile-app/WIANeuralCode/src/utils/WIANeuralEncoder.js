/**
 * WIA Neural Encoder - React Native Version
 * 웹 버전을 모바일에 맞게 최적화
 */

export class WIANeuralEncoder {
  constructor() {
    this.VERSION = '1.0.0';
    this.MAX_DATA_SIZE = 9216; // 9KB
    this.GRID_SIZE = 480;
    this.NEURON_COUNT = 144;
    this.ERROR_CORRECTION_LEVEL = 0.3;
  }

  encode(dataType, data) {
    try {
      console.log(`[Encoder] 인코딩 시작: ${dataType}`);

      const formattedData = this.formatDataByType(dataType, data);
      const bytes = this.stringToBytes(formattedData);

      if (bytes.length > this.MAX_DATA_SIZE) {
        throw new Error(`데이터가 너무 큽니다: ${bytes.length} bytes`);
      }

      const encodedBytes = this.addErrorCorrection(bytes);
      const neuralPattern = this.bytesToNeuralPattern(encodedBytes);

      neuralPattern.metadata = {
        version: this.VERSION,
        dataType: dataType,
        timestamp: Date.now(),
        dataSize: bytes.length,
        encodedSize: encodedBytes.length,
        neuronCount: this.NEURON_COUNT,
      };

      console.log('[Encoder] 인코딩 완료');
      return neuralPattern;

    } catch (error) {
      console.error('[Encoder] 오류:', error);
      throw error;
    }
  }

  formatDataByType(type, data) {
    switch (type) {
      case 'text':
        return data.content || data.text || String(data);
      case 'link':
      case 'url':
        return data.url || data.link || String(data);
      case 'wifi':
        return this.formatWiFi(data);
      case 'vcard':
        return this.formatVCard(data);
      case 'email':
        return this.formatEmail(data);
      case 'phone':
        return `tel:${data.phone || data}`;
      case 'sms':
        return this.formatSMS(data);
      default:
        return JSON.stringify(data);
    }
  }

  formatWiFi(data) {
    const ssid = data.ssid || '';
    const password = data.password || '';
    const security = data.security || 'WPA';
    return `WIFI:T:${security};S:${ssid};P:${password};;`;
  }

  formatVCard(data) {
    return `BEGIN:VCARD
VERSION:3.0
FN:${data.name || ''}
TEL:${data.phone || ''}
EMAIL:${data.email || ''}
ORG:${data.organization || ''}
END:VCARD`;
  }

  formatEmail(data) {
    const email = data.email || '';
    const subject = encodeURIComponent(data.subject || '');
    const body = encodeURIComponent(data.body || '');
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  formatSMS(data) {
    const phone = data.phone || '';
    const message = encodeURIComponent(data.message || '');
    return `sms:${phone}?body=${message}`;
  }

  stringToBytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6));
        bytes.push(0x80 | (code & 0x3f));
      } else {
        bytes.push(0xe0 | (code >> 12));
        bytes.push(0x80 | ((code >> 6) & 0x3f));
        bytes.push(0x80 | (code & 0x3f));
      }
    }
    return bytes;
  }

  addErrorCorrection(bytes) {
    const eccLength = Math.ceil(bytes.length * this.ERROR_CORRECTION_LEVEL);
    const eccBytes = [];

    for (let i = 0; i < eccLength; i++) {
      let checksum = 0;
      for (let j = 0; j < bytes.length; j++) {
        checksum ^= bytes[j] << (i % 8);
      }
      eccBytes.push(checksum % 256);
    }

    return [...bytes, ...eccBytes];
  }

  bytesToNeuralPattern(bytes) {
    const pattern = {
      neurons: [],
      connections: [],
      data: bytes,
    };

    const gridSize = Math.sqrt(this.NEURON_COUNT);
    const spacing = this.GRID_SIZE / (gridSize + 1);

    // 뉴런 생성
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const neuronIndex = i * gridSize + j;
        const byteIndex = neuronIndex % bytes.length;
        const byteValue = bytes[byteIndex];

        pattern.neurons.push({
          id: neuronIndex,
          x: (j + 1) * spacing,
          y: (i + 1) * spacing,
          value: byteValue,
          intensity: byteValue / 255,
        });
      }
    }

    // 연결선 생성
    for (let i = 0; i < bytes.length - 1; i++) {
      const startNeuron = pattern.neurons[i % this.NEURON_COUNT];
      const endNeuron = pattern.neurons[(i + 1) % this.NEURON_COUNT];

      if (startNeuron && endNeuron) {
        pattern.connections.push({
          start: { x: startNeuron.x, y: startNeuron.y },
          end: { x: endNeuron.x, y: endNeuron.y },
          strength: (bytes[i] + bytes[i + 1]) / 510,
          data: bytes[i],
        });
      }
    }

    return pattern;
  }
}
