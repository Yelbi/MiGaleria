import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function LoadingOverlay() {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="white" />
      <Text style={styles.loadingText}>Cargando...</Text>
    </View>
  );
}

export function VolumeIndicator({ opacity, isMuted, volume }) {
  return (
    <Animated.View
      style={[
        styles.volumeIndicator,
        { opacity }
      ]}
    >
      <Ionicons 
        name={isMuted ? "volume-mute" : "volume-high"} 
        size={32} 
        color="white" 
      />
      <Text style={styles.volumeText}>
        {isMuted ? 'Silenciado' : `${Math.round(volume * 100)}%`}
      </Text>
    </Animated.View>
  );
}

export function SeekIndicator({ opacity, isForward }) {
  return (
    <Animated.View
      style={[
        styles.seekIndicator,
        { opacity, transform: [{ scale: opacity }] },
      ]}
    >
      <Ionicons 
        name={isForward ? "play-forward" : "play-back"} 
        size={48} 
        color="white" 
      />
      <Text style={styles.seekText}>
        {isForward ? '+10s' : '-10s'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  volumeIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -40 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
    minWidth: 100,
  },
  volumeText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
  },
  seekIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
  },
  seekText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
  },
});