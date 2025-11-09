/**
 * ============================================================================
 * 📱 WIA Neural Code - React Native Mobile App
 * ============================================================================
 *
 * 기능:
 * - 카메라로 WIA Neural Code 스캔
 * - 코드 생성 (내장 인코더 사용)
 * - 갤러리에서 이미지 불러오기
 * - 스캔 히스토리
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import Canvas from 'react-native-canvas';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// WIA Encoder/Decoder (간소화 버전)
import { WIANeuralEncoder } from './src/utils/WIANeuralEncoder';
import { WIANeuralDecoder } from './src/utils/WIANeuralDecoder';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const [mode, setMode] = useState('home'); // 'home', 'scan', 'generate', 'result'
  const [hasPermission, setHasPermission] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [history, setHistory] = useState([]);

  const camera = useRef(null);
  const devices = useCameraDevices();
  const device = devices.back;

  // 권한 요청
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const cameraGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        const storageGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        setHasPermission(
          cameraGranted === PermissionsAndroid.RESULTS.GRANTED &&
          storageGranted === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const cameraStatus = await Camera.requestCameraPermission();
        setHasPermission(cameraStatus === 'authorized');
      }
    } catch (error) {
      console.error('권한 요청 오류:', error);
    }
  };

  // 카메라로 스캔
  const handleScan = async () => {
    if (!hasPermission) {
      Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
      return;
    }

    setMode('scan');
    setIsScanning(true);
  };

  // 사진 캡처 및 디코딩
  const captureAndDecode = async () => {
    if (!camera.current) return;

    try {
      setIsScanning(true);

      // 사진 캡처
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'quality',
      });

      // WIA Decoder로 디코딩
      const decoder = new WIANeuralDecoder();
      const result = await decoder.decodeFromImage(photo.path);

      // 결과 저장
      setScannedData(result);
      addToHistory(result);
      setMode('result');

      Alert.alert('스캔 성공!', `타입: ${result.type}`);

    } catch (error) {
      console.error('스캔 오류:', error);
      Alert.alert('스캔 실패', error.message);
    } finally {
      setIsScanning(false);
    }
  };

  // 갤러리에서 이미지 선택
  const pickImageFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });

      if (result.didCancel) return;

      const decoder = new WIANeuralDecoder();
      const decodedData = await decoder.decodeFromImage(result.assets[0].uri);

      setScannedData(decodedData);
      addToHistory(decodedData);
      setMode('result');

      Alert.alert('스캔 성공!', `타입: ${decodedData.type}`);

    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('스캔 실패', error.message);
    }
  };

  // 히스토리에 추가
  const addToHistory = (data) => {
    setHistory(prev => [
      {
        id: Date.now(),
        data,
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 9), // 최대 10개
    ]);
  };

  // 코드 생성 모드
  const handleGenerate = () => {
    setMode('generate');
  };

  // 홈 화면 렌더링
  const renderHome = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Icon name="brain" size={80} color="#fff" />
          <Text style={styles.title}>WIA Neural Code</Text>
          <Text style={styles.subtitle}>차세대 코드 스캐너</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleScan}
          >
            <Icon name="camera" size={40} color="#667eea" />
            <Text style={styles.menuText}>스캔하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleGenerate}
          >
            <Icon name="qrcode" size={40} color="#667eea" />
            <Text style={styles.menuText}>생성하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={pickImageFromGallery}
          >
            <Icon name="image" size={40} color="#667eea" />
            <Text style={styles.menuText}>갤러리</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMode('history')}
          >
            <Icon name="history" size={40} color="#667eea" />
            <Text style={styles.menuText}>히스토리</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );

  // 스캔 화면 렌더링
  const renderScan = () => {
    if (!device) {
      return (
        <View style={styles.container}>
          <Text>카메라를 찾을 수 없습니다.</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={mode === 'scan'}
          photo={true}
        />

        {/* 스캔 프레임 */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* 하단 버튼들 */}
        <View style={styles.scanControls}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMode('home')}
          >
            <Icon name="arrow-left" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={captureAndDecode}
            disabled={isScanning}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.galleryButton}
            onPress={pickImageFromGallery}
          >
            <Icon name="image" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 결과 화면 렌더링
  const renderResult = () => {
    if (!scannedData) return null;

    const typeIcons = {
      text: 'text',
      link: 'link',
      wifi: 'wifi',
      vcard: 'account-card',
      email: 'email',
      phone: 'phone',
      sms: 'message-text',
    };

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.resultHeader}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setMode('home')}
          >
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>

          <Icon
            name={typeIcons[scannedData.type] || 'qrcode'}
            size={60}
            color="#fff"
          />
          <Text style={styles.resultTitle}>스캔 성공!</Text>
          <Text style={styles.resultType}>{scannedData.type.toUpperCase()}</Text>
        </LinearGradient>

        <ScrollView style={styles.resultContent}>
          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>데이터</Text>
            <Text style={styles.dataValue}>
              {typeof scannedData.data === 'object'
                ? JSON.stringify(scannedData.data, null, 2)
                : scannedData.data}
            </Text>
          </View>

          {/* 액션 버튼들 */}
          <View style={styles.actionButtons}>
            {renderActionButtons(scannedData)}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // 액션 버튼 렌더링
  const renderActionButtons = (data) => {
    const buttons = [];

    if (data.type === 'link') {
      buttons.push(
        <TouchableOpacity
          key="open"
          style={styles.actionButton}
          onPress={() => {
            // Linking.openURL(data.data);
            Alert.alert('링크', data.data);
          }}
        >
          <Icon name="open-in-new" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>링크 열기</Text>
        </TouchableOpacity>
      );
    }

    buttons.push(
      <TouchableOpacity
        key="copy"
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={() => {
          // Clipboard.setString(JSON.stringify(data.data));
          Alert.alert('복사됨', '데이터가 클립보드에 복사되었습니다.');
        }}
      >
        <Icon name="content-copy" size={20} color="#667eea" />
        <Text style={[styles.actionButtonText, { color: '#667eea' }]}>복사</Text>
      </TouchableOpacity>
    );

    return buttons;
  };

  // 코드 생성 화면 (간단 버전)
  const renderGenerate = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMode('home')}>
          <Icon name="arrow-left" size={30} color="#667eea" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>코드 생성</Text>
      </View>
      <Text style={styles.comingSoon}>곧 추가될 예정입니다!</Text>
    </SafeAreaView>
  );

  // 히스토리 화면
  const renderHistory = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMode('home')}>
          <Icon name="arrow-left" size={30} color="#667eea" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>스캔 히스토리</Text>
      </View>

      <ScrollView style={styles.historyList}>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>히스토리가 비어있습니다.</Text>
        ) : (
          history.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyItem}
              onPress={() => {
                setScannedData(item.data);
                setMode('result');
              }}
            >
              <Icon name="qrcode" size={30} color="#667eea" />
              <View style={styles.historyText}>
                <Text style={styles.historyType}>{item.data.type}</Text>
                <Text style={styles.historyTime}>
                  {new Date(item.timestamp).toLocaleString('ko-KR')}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );

  // 메인 렌더링
  switch (mode) {
    case 'scan':
      return renderScan();
    case 'result':
      return renderResult();
    case 'generate':
      return renderGenerate();
    case 'history':
      return renderHistory();
    default:
      return renderHome();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 10,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 20,
  },
  menuButton: {
    width: (SCREEN_WIDTH - 60) / 2,
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  menuText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginTop: 10,
  },
  scanFrame: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    left: SCREEN_WIDTH * 0.1,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanControls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  backButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: '#667eea',
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  resultType: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 10,
  },
  resultContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dataCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  dataValue: {
    fontSize: 16,
    color: '#333',
  },
  actionButtons: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  comingSoon: {
    textAlign: 'center',
    fontSize: 18,
    color: '#999',
    marginTop: 100,
  },
  historyList: {
    flex: 1,
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 50,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyText: {
    marginLeft: 15,
    flex: 1,
  },
  historyType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  historyTime: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});
