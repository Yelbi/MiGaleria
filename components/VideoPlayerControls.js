import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VideoPlayerSeekBar from './VideoPlayerSeekBar';

export function TopBar({ 
  onClose, 
  playbackRate, 
  onSpeedPress, 
  isFullscreen, 
  onFullscreenPress 
}) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={28} color="white" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.speedButton}
        onPress={onSpeedPress}
      >
        <Text style={styles.speedText}>{playbackRate}x</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.fullscreenButton} onPress={onFullscreenPress}>
        <Ionicons 
          name={isFullscreen ? "contract" : "expand"} 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  );
}

export function BottomBar({ 
  isMuted, 
  volume, 
  onMutePress,
  currentTime,
  duration,
  onSeekBarPress,
  formatTime
}) {
  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity style={styles.volumeButton} onPress={onMutePress}>
        <Ionicons 
          name={isMuted ? "volume-mute" : volume > 0.5 ? "volume-high" : "volume-low"} 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>
      
      <VideoPlayerSeekBar
        currentTime={currentTime}
        duration={duration}
        onSeekBarPress={onSeekBarPress}
        formatTime={formatTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 22,
  },
  speedButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  speedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  volumeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});