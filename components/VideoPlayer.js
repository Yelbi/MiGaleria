import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  // Estados básicos
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  // Estados de interface
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaybackSpeed, setShowPlaybackSpeed] = useState(false);
  
  // Referencias y animaciones
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const volumeIndicatorOpacity = useRef(new Animated.Value(0)).current;
  const controlsTimeoutRef = useRef(null);
  const playerRef = useRef(null);

  // Crear player de video
  const player = useVideoPlayer(visible ? videoUri : null, (player) => {
    if (player && videoUri) {
      playerRef.current = player;
      player.loop = false;
      player.muted = isMuted;
      player.volume = volume;
      player.playbackRate = playbackRate;
      
      if (autoPlay) {
        player.play();
      }
    }
  });

  // Efectos para escuchar eventos del player
  useEffect(() => {
    if (!player) return;

    // Escuchar cambios en el estado de reproducción
    const playingSubscription = player.addListener('playingChange', ({ isPlaying: playing }) => {
      console.log('Playing changed:', playing);
      setIsPlaying(playing);
      if (playing && isVideoReady) {
        setIsLoading(false);
        hideControlsAfterDelay();
      }
    });

    // Escuchar actualizaciones de tiempo
    const timeSubscription = player.addListener('timeUpdate', ({ currentTime: time, duration: dur }) => {
      console.log('Time update:', time, dur);
      setCurrentTime(time || 0);
      if (dur > 0) {
        setDuration(dur);
        if (!isVideoReady) {
          setIsVideoReady(true);
          setIsLoading(false);
        }
      }
    });

    // Escuchar cambios de estado
    const statusSubscription = player.addListener('statusChange', ({ status, error, isLoaded }) => {
      console.log('Status changed:', status, 'Loaded:', isLoaded);
      
      if (error) {
        console.error('Video error:', error);
        setHasError(true);
        setIsLoading(false);
        Alert.alert('Error de reproducción', 'No se pudo reproducir el video');
      }
      
      if (status === 'readyToPlay' || isLoaded) {
        setIsVideoReady(true);
        setIsLoading(false);
        setHasError(false);
      }
    });

    return () => {
      playingSubscription?.remove();
      timeSubscription?.remove();
      statusSubscription?.remove();
    };
  }, [player, isVideoReady]);

  // Efecto para mostrar controles cuando se abre el modal
  useEffect(() => {
    if (visible) {
      setShowControlsOverlay(true);
      showControlsWithAnimation();
      hideControlsAfterDelay();
    } else {
      // Reset states when closing
      setIsLoading(true);
      setIsVideoReady(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [visible]);

  // Funciones de control de la interfaz
  const showControlsWithAnimation = useCallback(() => {
    setShowControlsOverlay(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [controlsOpacity]);

  const hideControlsWithAnimation = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowControlsOverlay(false);
    });
  }, [controlsOpacity]);

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        hideControlsWithAnimation();
      }, 3000);
    }
  }, [showControls, isPlaying, hideControlsWithAnimation]);

  const toggleControls = useCallback(() => {
    if (showControlsOverlay) {
      hideControlsWithAnimation();
    } else {
      showControlsWithAnimation();
      hideControlsAfterDelay();
    }
  }, [showControlsOverlay, hideControlsWithAnimation, showControlsWithAnimation, hideControlsAfterDelay]);

  // Funciones de control del video
  const togglePlayPause = useCallback(() => {
    if (!player || !isVideoReady) return;
    
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    
    showControlsWithAnimation();
    hideControlsAfterDelay();
  }, [player, isPlaying, isVideoReady, showControlsWithAnimation, hideControlsAfterDelay]);

  // Función corregida para seek - usando replay con posición específica
  const seekTo = useCallback((time) => {
    if (!player || !isVideoReady || duration === 0) return;
    
    const normalizedTime = Math.max(0, Math.min(duration, time));
    console.log('Seeking to:', normalizedTime);
    
    try {
      // Pausar el video primero
      const wasPlaying = isPlaying;
      player.pause();
      
      // Usar replay con posición específica 
      player.replay();
      
      // Intentar adelantar hasta la posición deseada
      if (normalizedTime > 0) {
        const seekInterval = setInterval(() => {
          if (player.currentTime >= normalizedTime - 0.5) {
            clearInterval(seekInterval);
            if (wasPlaying) {
              player.play();
            }
          }
        }, 100);
        
        // Cleanup después de 5 segundos para evitar loops infinitos
        setTimeout(() => {
          clearInterval(seekInterval);
          if (wasPlaying && !isPlaying) {
            player.play();
          }
        }, 5000);
      } else if (wasPlaying) {
        player.play();
      }
      
      setCurrentTime(normalizedTime);
    } catch (error) {
      console.log('Seek error:', error);
    }
  }, [player, duration, isVideoReady, isPlaying]);

  const handleSeekBackward = useCallback(() => {
    console.log('Seek backward from:', currentTime);
    seekTo(Math.max(0, currentTime - 10));
    showControlsWithAnimation();
    hideControlsAfterDelay();
  }, [seekTo, currentTime, showControlsWithAnimation, hideControlsAfterDelay]);

  const handleSeekForward = useCallback(() => {
    console.log('Seek forward from:', currentTime);
    seekTo(Math.min(duration, currentTime + 10));
    showControlsWithAnimation();
    hideControlsAfterDelay();
  }, [seekTo, currentTime, duration, showControlsWithAnimation, hideControlsAfterDelay]);

  const handleSeekBarPress = useCallback((event) => {
    if (!duration || !isVideoReady) return;
    
    const { locationX } = event.nativeEvent;
    const seekBarWidth = width - 120;
    const progress = Math.max(0, Math.min(1, locationX / seekBarWidth));
    const newTime = progress * duration;
    
    console.log('Seek bar press:', progress, newTime);
    seekTo(newTime);
    showControlsWithAnimation();
    hideControlsAfterDelay();
  }, [duration, isVideoReady, seekTo, showControlsWithAnimation, hideControlsAfterDelay]);

  const toggleMute = useCallback(() => {
    if (!player || !isVideoReady) return;
    
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
  }, [player, isMuted, isVideoReady, volumeIndicatorOpacity]);

  const handlePlaybackSpeed = useCallback((speed) => {
    if (!player || !isVideoReady) return;
    
    setPlaybackRate(speed);
    player.playbackRate = speed;
    setShowPlaybackSpeed(false);
    showControlsWithAnimation();
    hideControlsAfterDelay();
  }, [player, isVideoReady, showControlsWithAnimation, hideControlsAfterDelay]);

  const toggleFullscreen = useCallback(async () => {
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
  }, [isFullscreen]);

  // Funciones de utilidad
  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getProgressPercentage = useCallback(() => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  // Renderizado condicional para errores
  if (hasError) {
    return (
      <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>Error al cargar el video</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setHasError(false);
              setIsLoading(true);
              setIsVideoReady(false);
            }}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar hidden={isFullscreen} />
      <View style={[styles.container, isFullscreen && styles.landscape]}>
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
          
          {/* Overlay de carga - solo mostrar si realmente está cargando */}
          {(isLoading || !isVideoReady) && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingText}>Cargando video...</Text>
            </View>
          )}
          
          {/* Indicador de volumen */}
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
          
          {/* Overlay de controles - solo mostrar si el video está listo */}
          {showControls && showControlsOverlay && isVideoReady && (
            <Animated.View
              style={[
                styles.controlsOverlay,
                { opacity: controlsOpacity },
              ]}
            >
              {/* Barra superior */}
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
                    name={isFullscreen ? "contract-outline" : "expand-outline"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Controles centrales */}
              <View style={styles.centerControls}>
                <TouchableOpacity 
                  style={styles.centerButton}
                  onPress={handleSeekBackward}
                >
                  <Ionicons name="play-back" size={32} color="white" />
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
                  <Ionicons name="play-forward" size={32} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Barra inferior */}
              <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.iconButton} onPress={toggleMute}>
                  <Ionicons 
                    name={isMuted ? "volume-mute" : volume > 0.5 ? "volume-high" : "volume-low"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
                
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                
                {/* Barra de progreso */}
                <TouchableOpacity 
                  style={styles.progressContainer} 
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
                        { 
                          left: `${getProgressPercentage()}%`,
                          transform: [{ translateX: -9 }]
                        }
                      ]}
                    />
                  </View>
                </TouchableOpacity>
                
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </Animated.View>
          )}
          
          {/* Menú de velocidad */}
          {showPlaybackSpeed && isVideoReady && (
            <View style={styles.speedMenu}>
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
  landscape: {
    // Estilos para pantalla completa se manejan automáticamente
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    backgroundColor: 'black',
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
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
  },
  speedButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  speedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  centerControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  centerButton: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 35,
    marginHorizontal: 20,
  },
  playButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  timeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 50,
    textAlign: 'center',
  },
  progressContainer: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  speedMenu: {
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
    marginVertical: 2,
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
    textAlign: 'center',
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