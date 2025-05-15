import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VideoPlayerCenterControls({ 
  isPlaying, 
  onPlayPause, 
  onSeekBackward,
  onSeekForward 
}) {
  return (
    <View style={styles.centerControls}>
      <TouchableOpacity 
        style={styles.controlButton}
        onPress={onSeekBackward}
      >
        <Ionicons name="play-back" size={28} color="white" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.controlButton, styles.playButton]}
        onPress={onPlayPause}
      >
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={40} 
          color="white" 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.controlButton}
        onPress={onSeekForward}
      >
        <Ionicons name="play-forward" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centerControls: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -90 }, { translateY: -40 }],
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    marginHorizontal: 8,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
});