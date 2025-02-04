import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Onboarding: undefined;
  RoomCapture: {
    presentation?: 'fullScreen';
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp>();

  const startScan = () => {
    navigation.navigate('RoomCapture', {
      presentation: 'fullScreen'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RoomPlan</Text>
      <Text style={styles.description}>
        To scan your room, point your device at all the walls, windows, doors, and furniture in your space until your scan is complete.
        {'\n\n'}
        You can see a preview of your scan at the bottom of the screen so you can make sure your scan is correct.
      </Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={startScan}
      >
        <Text style={styles.buttonText}>Start Scanning</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 130,
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 40,
    lineHeight: 24,
  },
  button: {
    position: 'absolute',
    bottom: 33,
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
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