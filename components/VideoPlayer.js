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
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaybackSpeed, setShowPlaybackSpeed] = useState(false);
  
  // Animated values
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const bufferingRotation = useRef(new Animated.Value(0)).current;
  const seekIndicatorOpacity = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    // Auto-hide controles cuando empieza la reproducción
    if (visible) {
      setShowControlsOverlay(true);
      hideControlsAfterDelay();
    }
  }, [visible]);

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

  const seekTo = async (position) => {
    if (!player) return;
    
    try {
      await player.seekTo(position);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const toggleMute = () => {
    if (!player) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    player.muted = newMutedState;
    
    // Mostrar indicador de volumen
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
    const { locationX } = event.nativeEvent;
    let seekBarWidth;
    
    if (isFullscreen) {
      seekBarWidth = height - 120; // Adjust for fullscreen
    } else {
      seekBarWidth = width - 120;
    }
    
    const progress = locationX / seekBarWidth;
    const newTime = progress * duration;
    seekTo(newTime);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
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
        isFullscreen && {
          width: height,
          height: width,
        }
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
            <Text style={styles.volumeText}>
              {isMuted ? 'Silenciado' : `${Math.round(volume * 100)}%`}
            </Text>
          </Animated.View>
          
          {/* Controls overlay */}
          {showControls && (
            <Animated.View
              style={[
                styles.controlsOverlay,
                { opacity: controlsOpacity },
              ]}
            >
              {/* Top bar */}
              <View style={styles.topBar}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.speedButton}
                  onPress={() => setShowPlaybackSpeed(!showPlaybackSpeed)}
                >
                  <Text style={styles.speedText}>{playbackRate}x</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullscreen}>
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
                  style={styles.controlButton}
                  onPress={() => seekTo(Math.max(0, currentTime - 10))}
                >
                  <Ionicons name="play-back" size={28} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.controlButton, styles.playButton]}
                  onPress={togglePlayPause}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={40} 
                    color="white" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={() => seekTo(Math.min(duration, currentTime + 10))}
                >
                  <Ionicons name="play-forward" size={28} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Bottom controls */}
              <View style={styles.bottomControls}>
                <TouchableOpacity style={styles.volumeButton} onPress={toggleMute}>
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
  bottomControls: {
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
  timeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    minWidth: 44,
    textAlign: 'center',
  },
  progressContainer: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  seekBarContainer: {
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