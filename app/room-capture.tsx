import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Image, Platform, Animated } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RoomCapture() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [roomData, setRoomData] = useState<any>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await requestPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [isScanning]);

  if (!permission?.granted) {
    return (
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.container}
      >
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const handleDone = () => {
    setIsScanning(false);
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const analyzeRoomFromImage = (imageUri: string) => {
    return {
      roomColor: 'White',
      lighting: 'Bright',
      dimensions: '4m x 5m',
      features: ['Window', 'Door', 'Ceiling Light']
    };
  };

  const handleTakePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        setCapturedImages(prev => [...prev, photo.uri]);
        const analysis = analyzeRoomFromImage(photo.uri);
        setRoomData(analysis);
        handleDone();
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const dataToExport = roomData || { room: 'No data available' };
      const fileUri = `${FileSystem.documentDirectory}room_scan.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(dataToExport));
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {isScanning ? (
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            facing={facing}
            ref={ref => setCameraRef(ref)}
          >
            <TouchableOpacity 
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse" size={30} color="#fff" />
            </TouchableOpacity>
            <View style={styles.captureContainer}>
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={handleTakePicture}
              >
                <View style={styles.captureInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      ) : (
        <Animated.View 
          style={[styles.resultsContainer, {
            opacity: fadeAnim
          }]}
        >
          <LinearGradient
            colors={['#2c3e50', '#3498db']}
            style={styles.gradient}
          >
            {roomData && (
              <View style={styles.roomDataCard}>
                <Text style={styles.cardTitle}>Room Analysis</Text>
                <View style={styles.dataRow}>
                  <Ionicons name="color-palette" size={24} color="#007AFF" />
                  <Text style={styles.cardText}>Color: {roomData.roomColor}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Ionicons name="sunny" size={24} color="#007AFF" />
                  <Text style={styles.cardText}>Lighting: {roomData.lighting}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Ionicons name="resize" size={24} color="#007AFF" />
                  <Text style={styles.cardText}>Dimensions: {roomData.dimensions}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Ionicons name="list" size={24} color="#007AFF" />
                  <Text style={styles.cardText}>Features: {roomData.features.join(', ')}</Text>
                </View>
                
                <Text style={styles.cardTitle}>Captured Images</Text>
                <View style={styles.imageContainer}>
                  {capturedImages.map((uri, index) => (
                    <Image 
                      key={index}
                      source={{ uri }}
                      style={styles.capturedImage}
                    />
                  ))}
                </View>
              </View>
            )}
            {isExporting ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={handleExport}
              >
                <Ionicons name="share-outline" size={24} color="#fff" style={styles.exportIcon} />
                <Text style={styles.buttonText}>Export Results</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  flipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 40,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  resultsContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    padding: 20,
  },
  roomDataCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginTop: Platform.OS === 'ios' ? 60 : 40,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#34495e',
    marginLeft: 10,
    flex: 1,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
  },
  capturedImage: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#2ecc71',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  exportIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  permissionText: {
    color: '#fff', 
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});