import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
  Platform,
  Share,
  Image,
  ScrollView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface CapturedRoomData {
  timestamp: number;
  preview: string;
}

export default function RoomCaptureScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResults, setFinalResults] = useState<CapturedRoomData | null>(null);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  
  const exportButtonOpacity = useRef(new Animated.Value(0)).current;
  const navButtonsColor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await requestPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (isScanning) {
      setActiveNavBar();
    } else {
      setCompleteNavBar();
    }
  }, [isScanning]);

  const setActiveNavBar = () => {
    Animated.parallel([
      Animated.timing(exportButtonOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(navButtonsColor, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const setCompleteNavBar = () => {
    Animated.parallel([
      Animated.timing(exportButtonOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(navButtonsColor, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const toggleCameraType = () => {
    setCameraType(current => current === 'back' ? 'front' : 'back');
  };

  const handleDone = async () => {
    if (isScanning) {
      setIsProcessing(true);
      setIsScanning(false);
      
      if (cameraRef) {
        try {
          const photo = await cameraRef.takePictureAsync();
          const roomData: CapturedRoomData = {
            timestamp: Date.now(),
            preview: photo.uri,
          };
          setFinalResults(roomData);
          setCapturedImages(prev => [...prev, photo.uri]);
        } catch (error) {
          console.error('Error capturing room:', error);
        } finally {
          setIsProcessing(false);
        }
      }
    } else {
      handleCancel();
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleExport = async () => {
    if (!finalResults) return;

    try {
      const destinationFolder = `${FileSystem.documentDirectory}Export/`;
      const roomDataPath = `${destinationFolder}Room.json`;
      
      await FileSystem.makeDirectoryAsync(destinationFolder, { intermediates: true });
      await FileSystem.writeAsStringAsync(roomDataPath, JSON.stringify(finalResults));

      await Share.share({
        url: roomDataPath,
        message: 'Room Capture Data',
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const buttonTintColor = navButtonsColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#007AFF', '#FFFFFF'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {isScanning ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={cameraType}
            ref={ref => setCameraRef(ref)}
          />
          <TouchableOpacity 
            style={styles.flipButton}
            onPress={toggleCameraType}
          >
            <Ionicons name="camera-reverse" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <ScrollView horizontal style={styles.imageScroll}>
            {capturedImages.map((uri, index) => (
              <View key={index} style={styles.imageCard}>
                <Image source={{ uri }} style={styles.previewImage} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.navbar}>
        <Animated.View style={[styles.navButton, { opacity: 1 }]}>
          <TouchableOpacity onPress={handleCancel}>
            <Animated.Text style={[styles.navButtonText, { color: buttonTintColor }]}>
              Cancel
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={[styles.navButton, { opacity: 1 }]}>
          <TouchableOpacity onPress={handleDone}>
            <Animated.Text style={[styles.navButtonText, { color: buttonTintColor }]}>
              {isScanning ? 'Capture' : 'Close'}
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>Processing Image...</Text>
        </View>
      )}

      <Animated.View 
        style={[
          styles.exportButtonContainer,
          { opacity: exportButtonOpacity }
        ]}
        pointerEvents={isScanning ? 'none' : 'auto'}
      >
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExport}
          disabled={!finalResults || isScanning}
        >
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </Animated.View>
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
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  flipButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 30,
  },
  navbar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  exportButtonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    width: 200,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  imageScroll: {
    padding: 10,
  },
  imageCard: {
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#2c2c2e',
  },
  previewImage: {
    width: 200,
    height: 300,
    borderRadius: 10,
  },
  message: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 25,
    width: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});