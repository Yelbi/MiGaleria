import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  StatusBar,
  Platform
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width, height } = Dimensions.get('window');

export default function VideoPlayer({ 
  videoUri, 
  visible = true, 
  onClose, 
  autoPlay = false,
  showControls = true 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaybackSpeed, setShowPlaybackSpeed] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  
  // Animated values
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const volumeIndicatorOpacity = useRef(new Animated.Value(0)).current;
  
  const controlsTimeoutRef = useRef(null);

  const player = useVideoPlayer(visible ? videoUri : null, (player) => {
    if (player && videoUri) {
      player.loop = false;
      player.muted = false;
      player.volume = volume;
      player.rate = playbackRate;
      
      if (autoPlay) {
        player.play();
      }
    }
  });

  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
      if (playing) {
        hideControlsAfterDelay();
      }
    });

    const timeSubscription = player.addListener('timeUpdate', ({ currentTime: time, duration: dur }) => {
      setCurrentTime(time);
      setDuration(dur);
      if (isLoading) {
        setIsLoading(false);
      }
    });

    const statusSubscription = player.addListener('statusChange', ({ status, error }) => {
      if (error) {
        console.error('Video error:', error);
        setHasError(true);
        setIsLoading(false);
        Alert.alert('Error de reproducción', 'No se pudo reproducir el video');
      }
      
      if (status === 'loaded') {
        setIsLoading(false);
        setHasError(false);
      }
    });

    return () => {
      subscription?.remove();
      timeSubscription?.remove();
      statusSubscription?.remove();
    };
  }, [player, isLoading]);

  // Reset controls when visible changes
  useEffect(() => {
    if (visible && showControls) {
      setShowControlsOverlay(true);
      showControlsWithAnimation();
      hideControlsAfterDelay();
    }
  }, [visible, showControls]);

  const hideControlsAfterDelay = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        hideControlsWithAnimation();
      }, 3000);
    }
  };

  const showControlsWithAnimation = () => {
    setShowControlsOverlay(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideControlsWithAnimation = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowControlsOverlay(false);
    });
  };

  const togglePlayPause = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    
    showControlsWithAnimation();
    hideControlsAfterDelay();
  };

  // Función simplificada para seek
  const seekTo = (time) => {
    if (!player || duration === 0) return;
    
    const normalizedTime = Math.max(0, Math.min(duration, time));
    setSeekPosition(normalizedTime);
    setCurrentTime(normalizedTime);
    
    try {
      // Method for expo-video v2
      player.currentTime = normalizedTime;
    } catch (error) {
      console.log('Seek error:', error);
    }
  };

  const handleSeekBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    seekTo(newTime);
    showControlsWithAnimation();
    hideControlsAfterDelay();
  };

  const handleSeekForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    seekTo(newTime);
    showControlsWithAnimation();
    hideControlsAfterDelay();
  };

  const toggleMute = () => {
    if (!player) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    player.muted = newMutedState;
    
    // Show volume indicator
    Animated.sequence([
      Animated.timing(volumeIndicatorOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(volumeIndicatorOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePlaybackSpeed = (speed) => {
    setPlaybackRate(speed);
    if (player) {
      player.rate = speed;
    }
    setShowPlaybackSpeed(false);
    showControlsWithAnimation();
    hideControlsAfterDelay();
  };

  const handleSeekBarPress = (event) => {
    if (!duration) return;
    
    const { locationX } = event.nativeEvent;
    const seekBarWidth = width - 120; // Approximate width accounting for timestamps
    const progress = Math.max(0, Math.min(1, locationX / seekBarWidth));
    const newTime = progress * duration;
    
    seekTo(newTime);
    showControlsWithAnimation();
    hideControlsAfterDelay();
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  const toggleControls = () => {
    if (showControlsOverlay) {
      hideControlsWithAnimation();
    } else {
      showControlsWithAnimation();
      hideControlsAfterDelay();
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        StatusBar.setHidden(false);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        StatusBar.setHidden(true);
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error('Orientation error:', error);
    }
  };

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>Error al cargar el video</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => {
            setHasError(false);
            setIsLoading(true);
          }}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
    >
      <View style={[
        styles.container,
        isFullscreen && styles.fullscreenContainer
      ]}>
        <TouchableOpacity 
          style={styles.videoContainer}
          onPress={toggleControls}
          activeOpacity={1}
        >
          <VideoView 
            style={styles.video}
            player={player}
            allowsFullscreen={false}
            allowsPictureInPicture={Platform.OS === 'ios'}
            showsTimecodes={false}
            requiresLinearPlayback={false}
          />
          
          {/* Loading overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingText}>Cargando...</Text>
            </View>
          )}
          
          {/* Volume indicator */}
          <Animated.View
            style={[
              styles.volumeIndicator,
              { opacity: volumeIndicatorOpacity }
            ]}
          >
            <Ionicons 
              name={isMuted ? "volume-mute" : "volume-high"} 
              size={32} 
              color="white" 
            />
            <Text style={styles.indicatorText}>
              {isMuted ? 'Silenciado' : `${Math.round(volume * 100)}%`}
            </Text>
          </Animated.View>
          
          {/* Controls overlay */}
          {showControls && showControlsOverlay && (
            <Animated.View
              style={[
                styles.controlsOverlay,
                { opacity: controlsOpacity },
              ]}
            >
              {/* Top bar */}
              <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconButton} onPress={onClose}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.speedButton}
                  onPress={() => setShowPlaybackSpeed(!showPlaybackSpeed)}
                >
                  <Text style={styles.speedText}>{playbackRate}x</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.iconButton} onPress={toggleFullscreen}>
                  <Ionicons 
                    name={isFullscreen ? "contract" : "expand"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Center controls */}
              <View style={styles.centerControls}>
                <TouchableOpacity 
                  style={styles.centerButton}
                  onPress={handleSeekBackward}
                >
                  <Ionicons name="play-back" size={28} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.centerButton, styles.playButton]}
                  onPress={togglePlayPause}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={40} 
                    color="white" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.centerButton}
                  onPress={handleSeekForward}
                >
                  <Ionicons name="play-forward" size={28} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Bottom controls */}
              <View style={styles.bottomControls}>
                <TouchableOpacity style={styles.iconButton} onPress={toggleMute}>
                  <Ionicons 
                    name={isMuted ? "volume-mute" : volume > 0.5 ? "volume-high" : "volume-low"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
                
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                
                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <TouchableOpacity 
                    style={styles.seekBarContainer} 
                    onPress={handleSeekBarPress}
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
                </View>
                
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </Animated.View>
          )}
          
          {/* Playback speed menu */}
          {showPlaybackSpeed && (
            <View style={styles.playbackSpeedMenu}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedOption,
                    playbackRate === speed && styles.selectedSpeed
                  ]}
                  onPress={() => handlePlaybackSpeed(speed)}
                >
                  <Text style={styles.speedOptionText}>{speed}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullscreenContainer: {
    // Applied dynamically
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    transform: [{ translateX: -60 }, { translateY: -50 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
    minWidth: 120,
  },
  indicatorText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
  },
  speedButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  speedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  centerControls: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -110 }, { translateY: -40 }],
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    marginHorizontal: 10,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  timeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    minWidth: 45,
    textAlign: 'center',
  },
  progressContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  seekBarContainer: {
    height: 40,
    justifyContent: 'center',
    paddingVertical: 15,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playbackSpeedMenu: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 12,
    padding: 8,
    minWidth: 80,
  },
  speedOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedSpeed: {
    backgroundColor: '#007AFF',
  },
  speedOptionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});