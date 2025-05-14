import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
  Alert,
  ActivityIndicator
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function VideoPlayer({ 
  videoUri, 
  visible = true, 
  onClose, 
  onFullscreenToggle,
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
  
  const controlsTimeoutRef = useRef(null);
  const seekingRef = useRef(false);

  const player = useVideoPlayer(visible ? videoUri : null, (player) => {
    if (player && videoUri) {
      player.loop = false;
      player.muted = false;
      player.volume = volume;
      
      // Auto play si se solicita
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
      if (!seekingRef.current) {
        setCurrentTime(time);
      }
      setDuration(dur);
      setIsLoading(false);
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
  }, [player]);

  const hideControlsAfterDelay = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControlsOverlay(false);
      }, 3000);
    }
  };

  const togglePlayPause = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekTo = async (position) => {
    if (!player) return;
    
    seekingRef.current = true;
    setCurrentTime(position);
    
    try {
      await player.seekTo(position);
    } catch (error) {
      console.error('Seek error:', error);
    } finally {
      seekingRef.current = false;
    }
  };

  const toggleMute = () => {
    if (!player) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    player.muted = newMutedState;
  };

  const handleSeekBarPress = (event) => {
    const { locationX } = event.nativeEvent;
    const progress = locationX / (width - 32);
    const newTime = progress * duration;
    seekTo(newTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleControls = () => {
    setShowControlsOverlay(!showControlsOverlay);
    if (!showControlsOverlay) {
      hideControlsAfterDelay();
    }
  };

  const replayVideo = () => {
    if (player) {
      seekTo(0);
      player.play();
    }
  };

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>Error al cargar el video</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setHasError(false);
          setIsLoading(true);
        }}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.videoContainer}
        onPress={toggleControls}
        activeOpacity={1}
      >
        <VideoView 
          style={styles.video}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          showsTimecodes={false}
          requiresLinearPlayback={false}
        />
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}
        
        {showControlsOverlay && (
          <View style={[styles.controlsOverlay, !showControls && { display: 'none' }]}>
            {/* Botón de cerrar */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Controles centrales */}
            <View style={styles.centerControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => seekTo(Math.max(0, currentTime - 10))}
              >
                <Ionicons name="play-back" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, styles.playButton]}
                onPress={togglePlayPause}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => seekTo(Math.min(duration, currentTime + 10))}
              >
                <Ionicons name="play-forward" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* Controles inferiores */}
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.volumeButton} onPress={toggleMute}>
                <Ionicons 
                  name={isMuted ? "volume-mute" : "volume-high"} 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <Text style={styles.timeText}>
                {formatTime(currentTime)}
              </Text>
              
              {/* Barra de progreso */}
              <TouchableOpacity 
                style={styles.seekBarContainer} 
                onPress={handleSeekBarPress}
              >
                <View style={styles.seekBar}>
                  <View 
                    style={[
                      styles.seekProgress, 
                      { width: `${(currentTime / duration) * 100}%` }
                    ]} 
                  />
                </View>
              </TouchableOpacity>
              
              <Text style={styles.timeText}>
                {formatTime(duration)}
              </Text>
              
              {!isPlaying && currentTime === duration && duration > 0 && (
                <TouchableOpacity style={styles.replayButton} onPress={replayVideo}>
                  <Ionicons name="refresh" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeButton: {
    position: 'absolute',
    top: 44,
    right: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
  },
  centerControls: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -25 }],
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    marginHorizontal: 8,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  volumeButton: {
    marginRight: 12,
  },
  timeText: {
    color: 'white',
    fontSize: 14,
    marginHorizontal: 8,
    minWidth: 40,
    textAlign: 'center',
  },
  seekBarContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  seekBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  seekProgress: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  replayButton: {
    marginLeft: 12,
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