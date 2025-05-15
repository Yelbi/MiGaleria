import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function VideoPlayerSeekBar({ 
  currentTime, 
  duration, 
  onSeekBarPress,
  formatTime 
}) {
  const getProgressPercentage = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
      
      <TouchableOpacity 
        style={styles.seekBarContainer} 
        onPress={onSeekBarPress}
      >
        <View style={styles.seekBar}>
          <View 
            style={[
              styles.seekProgress, 
              { width: `${getProgressPercentage()}%` }
            ]} 
          />
          <View 
            style={[
              styles.seekThumb,
              { left: `${getProgressPercentage()}%` }
            ]}
          />
        </View>
      </TouchableOpacity>
      
      <Text style={styles.timeText}>{formatTime(duration)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  timeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    minWidth: 44,
    textAlign: 'center',
  },
  seekBarContainer: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  seekBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    position: 'relative',
  },
  seekProgress: {
    height: 6,
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  seekThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    backgroundColor: '#007AFF',
    borderRadius: 9,
    transform: [{ translateX: -9 }],
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});