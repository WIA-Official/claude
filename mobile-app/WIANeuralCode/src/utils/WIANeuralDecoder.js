/**
 * WIA Neural Decoder - React Native Version
 * 이미지에서 WIA Neural Code를 디코딩
 */

import { Image } from 'react-native';

export class WIANeuralDecoder {
  constructor() {
    this.VERSION = '1.0.0';
    this.GRID_SIZE = 480;
    this.NEURON_COUNT = 144;
    this.ERROR_THRESHOLD = 0.1;
  }

  async decodeFromImage(imagePath) {
    try {
      console.log('[Decoder] 디코딩 시작:', imagePath);

      // 이미지 데이터 추출
      const imageData = await this.loadImageData(imagePath);

      // 뉴런 감지
      const neurons = this.detectNeurons(imageData);

      if (neurons.length === 0) {
        throw new Error('WIA Neural Code를 감지할 수 없습니다.');
      }

      // 연결선 추적
      const connections = this.traceConnections(imageData, neurons);

      // 바이트 복원
      const bytes = this.reconstructBytes(neurons, connections);

      // 오류 정정
      const correctedBytes = this.applyErrorCorrection(bytes);

      // 문자열 변환
      const decodedString = this.bytesToString(correctedBytes);

      // 데이터 파싱
      const result = this.parseDecodedData(decodedString);

      console.log('[Decoder] 디코딩 완료:', result.type);
      return result;

    } catch (error) {
      console.error('[Decoder] 오류:', error);
      throw error;
    }
  }

  async loadImageData(imagePath) {
    // React Native에서 이미지 데이터 로딩
    // 실제로는 react-native-image-resizer 등을 사용
    return new Promise((resolve, reject) => {
      Image.getSize(
        imagePath,
        (width, height) => {
          // 간단한 Mock 데이터
          // 실제로는 Canvas나 이미지 처리 라이브러리 사용
          resolve({
            width,
            height,
            data: new Uint8ClampedArray(width * height * 4),
          });
        },
        reject
      );
    });
  }

  detectNeurons(imageData) {
    const neurons = [];
    const { width, height, data } = imageData;

    const gridSize = Math.sqrt(this.NEURON_COUNT);
    const spacing = width / (gridSize + 1);

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const expectedX = Math.round((j + 1) * spacing);
        const expectedY = Math.round((i + 1) * spacing);

        const neuron = this.findNeuronNear(
          data,
          width,
          height,
          expectedX,
          expectedY,
          10
        );

        if (neuron) {
          neurons.push({
            id: i * gridSize + j,
            x: neuron.x,
            y: neuron.y,
            intensity: neuron.intensity,
          });
        }
      }
    }

    console.log(`[Decoder] ${neurons.length}개 뉴런 감지됨`);
    return neurons;
  }

  findNeuronNear(data, width, height, centerX, centerY, radius) {
    let maxIntensity = 0;
    let neuronX = centerX;
    let neuronY = centerY;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;

        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // WIA 보라색 감지
        const isWIAColor =
          r > 80 && r < 150 &&
          g > 100 && g < 150 &&
          b > 200 && b < 250;

        if (isWIAColor) {
          const intensity = (r + g + b) / 3 / 255;
          if (intensity > maxIntensity) {
            maxIntensity = intensity;
            neuronX = x;
            neuronY = y;
          }
        }
      }
    }

    return maxIntensity > 0.3
      ? { x: neuronX, y: neuronY, intensity: maxIntensity }
      : null;
  }

  traceConnections(imageData, neurons) {
    const connections = [];

    for (let i = 0; i < neurons.length - 1; i++) {
      const start = neurons[i];
      const end = neurons[i + 1];

      connections.push({
        startId: start.id,
        endId: end.id,
        strength: (start.intensity + end.intensity) / 2,
      });
    }

    console.log(`[Decoder] ${connections.length}개 연결선 감지됨`);
    return connections;
  }

  reconstructBytes(neurons, connections) {
    const bytes = [];

    for (const neuron of neurons) {
      const byteValue = Math.round(neuron.intensity * 255);
      bytes.push(byteValue);
    }

    for (const conn of connections) {
      const byteValue = Math.round(conn.strength * 255);
      bytes.push(byteValue);
    }

    console.log(`[Decoder] ${bytes.length} 바이트 복원됨`);
    return bytes;
  }

  applyErrorCorrection(bytes) {
    const eccLength = Math.floor(bytes.length * 0.3);
    const dataLength = bytes.length - eccLength;
    return bytes.slice(0, dataLength);
  }

  bytesToString(bytes) {
    let str = '';
    let i = 0;

    while (i < bytes.length) {
      const byte1 = bytes[i++];

      if (byte1 < 0x80) {
        str += String.fromCharCode(byte1);
      } else if (byte1 < 0xe0) {
        const byte2 = bytes[i++];
        str += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
      } else {
        const byte2 = bytes[i++];
        const byte3 = bytes[i++];
        str += String.fromCharCode(
          ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f)
        );
      }
    }

    return str;
  }

  parseDecodedData(str) {
    if (!str) {
      throw new Error('디코딩된 데이터가 비어있습니다.');
    }

    // 자동 타입 감지
    if (str.startsWith('WIFI:')) {
      return this.parseWiFi(str);
    } else if (str.startsWith('BEGIN:VCARD')) {
      return this.parseVCard(str);
    } else if (str.startsWith('mailto:')) {
      return this.parseEmail(str);
    } else if (str.startsWith('tel:')) {
      return { type: 'phone', data: str.replace('tel:', '') };
    } else if (str.startsWith('sms:')) {
      return this.parseSMS(str);
    } else if (str.startsWith('http://') || str.startsWith('https://')) {
      return { type: 'link', data: str };
    } else {
      return { type: 'text', data: str };
    }
  }

  parseWiFi(str) {
    const match = str.match(/WIFI:T:(.*?);S:(.*?);P:(.*?);;/);
    if (match) {
      return {
        type: 'wifi',
        data: {
          security: match[1],
          ssid: match[2],
          password: match[3],
        },
      };
    }
    return { type: 'wifi', data: str };
  }

  parseVCard(str) {
    const lines = str.split('\n');
    const data = {};

    lines.forEach(line => {
      if (line.startsWith('FN:')) data.name = line.substring(3);
      if (line.startsWith('TEL:')) data.phone = line.substring(4);
      if (line.startsWith('EMAIL:')) data.email = line.substring(6);
      if (line.startsWith('ORG:')) data.organization = line.substring(4);
    });

    return { type: 'vcard', data };
  }

  parseEmail(str) {
    const match = str.match(/mailto:(.*?)(?:\?subject=(.*?)&body=(.*?))?$/);
    if (match) {
      return {
        type: 'email',
        data: {
          email: match[1],
          subject: decodeURIComponent(match[2] || ''),
          body: decodeURIComponent(match[3] || ''),
        },
      };
    }
    return { type: 'email', data: str };
  }

  parseSMS(str) {
    const match = str.match(/sms:(.*?)(?:\?body=(.*?))?$/);
    if (match) {
      return {
        type: 'sms',
        data: {
          phone: match[1],
          message: decodeURIComponent(match[2] || ''),
        },
      };
    }
    return { type: 'sms', data: str };
  }
}
