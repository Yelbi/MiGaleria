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
  // Estados del reproductor
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Estados de controles
  const [showControlsOverlay, setShowControlsOverlay] = useState(showControls);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  
  // Referencias
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideControlsTimeout = useRef(null);
  
  // Crear el reproductor de video
  const player = useVideoPlayer(videoUri, (player) => {
    if (player) {
      // Configurar el reproductor
      player.loop = false;
      player.muted = isMuted;
      player.playbackRate = playbackRate;
      
      // Reproducir automáticamente si está configurado
      if (autoPlay && visible) {
        player.play();
      }
    }
  });

  // Configurar listeners del reproductor
  useEffect(() => {
    if (!player) return;

    // Listener para cambios en el estado de reproducción
    const playingSubscription = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
      setIsLoading(false);
      
      if (playing && showControls) {
        hideControlsAfterDelay();
      }
    });

    // Listener para actualizaciones de tiempo
    const timeSubscription = player.addListener('timeUpdate', ({ currentTime: time, duration: dur }) => {
      setCurrentTime(time || 0);
      if (dur > 0 && duration !== dur) {
        setDuration(dur);
        setIsLoading(false);
      }
    });

    // Listener para cambios de estado
    const statusSubscription = player.addListener('statusChange', ({ status, error }) => {
      console.log('Video status:', status);
      
      if (error) {
        console.error('Video error:', error);
        setHasError(true);
        setIsLoading(false);
        Alert.alert('Error de reproducción', 'No se pudo cargar el video');
      }
      
      if (status === 'readyToPlay') {
        setIsLoading(false);
        setHasError(false);
      }
    });

    return () => {
      playingSubscription?.remove();
      timeSubscription?.remove();
      statusSubscription?.remove();
    };
  }, [player, showControls]);

  // Resetear estado cuando se abre/cierra el modal
  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setHasError(false);
      setCurrentTime(0);
      setIsPlaying(false);
      setShowControlsOverlay(showControls);
      showControlsWithAnimation();
      if (showControls) {
        hideControlsAfterDelay();
      }
    } else {
      // Resetear orientación al cerrar
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      StatusBar.setHidden(false, 'fade');
    }
  }, [visible, showControls]);

  // Funciones de animación de controles
  const showControlsWithAnimation = useCallback(() => {
    setShowControlsOverlay(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const hideControlsWithAnimation = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowControlsOverlay(false);
    });
  }, []);

  const hideControlsAfterDelay = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    
    if (showControls && isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
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
  }, [showControlsOverlay, showControlsWithAnimation, hideControlsWithAnimation, hideControlsAfterDelay]);

  // Funciones de control del video
  const togglePlayPause = useCallback(async () => {
    if (!player) return;
    
    try {
      if (isPlaying) {
        await player.pause();
      } else {
        await player.play();
      }
      
      showControlsWithAnimation();
      hideControlsAfterDelay();
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  }, [player, isPlaying, showControlsWithAnimation, hideControlsAfterDelay]);

  const seekTo = useCallback(async (time) => {
    if (!player || duration === 0) return;
    
    try {
      const seekTime = Math.max(0, Math.min(duration, time));
      // Usar el método correcto para hacer seek
      await player.seekBy(seekTime - currentTime);
      setCurrentTime(seekTime);
      
      showControlsWithAnimation();
      hideControlsAfterDelay();
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }, [player, duration, currentTime, showControlsWithAnimation, hideControlsAfterDelay]);

  const seekBackward = useCallback(() => {
    const newTime = Math.max(0, currentTime - 10);
    seekTo(newTime);
  }, [seekTo, currentTime]);

  const seekForward = useCallback(() => {
    const newTime = Math.min(duration, currentTime + 10);
    seekTo(newTime);
  }, [seekTo, currentTime, duration]);

  const handleSeekBarPress = useCallback((event) => {
    if (duration === 0) return;
    
    const { locationX } = event.nativeEvent;
    const seekBarWidth = width - 100; // Ancho aproximado de la barra
    const progress = Math.max(0, Math.min(1, locationX / seekBarWidth));
    const newTime = progress * duration;
    
    seekTo(newTime);
  }, [duration, seekTo]);

  const toggleMute = useCallback(() => {
    if (!player) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    player.muted = newMutedState;
    
    showControlsWithAnimation();
    hideControlsAfterDelay();
  }, [player, isMuted, showControlsWithAnimation, hideControlsAfterDelay]);

  const changePlaybackSpeed = useCallback((speed) => {
    if (!player) return;
    
    setPlaybackRate(speed);
    player.playbackRate = speed;
    setShowSpeedMenu(false);
    
    showControlsWithAnimation();
    hideControlsAfterDelay();
  }, [player, showControlsWithAnimation, hideControlsAfterDelay]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (isFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        StatusBar.setHidden(false, 'fade');
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        StatusBar.setHidden(true, 'fade');
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, [isFullscreen]);

  // Funciones de utilidad
  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getProgressPercentage = useCallback(() => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  // Renderizar error
  if (hasError) {
    return (
      <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>Error al cargar el video</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onClose}>
            <Text style={styles.retryText}>Cerrar</Text>
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
      <StatusBar hidden={isFullscreen} backgroundColor="black" />
      
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
            contentFit="contain"
            // ¡IMPORTANTE! Estas propiedades deshabilitan los controles nativos
            useNativeControls={false}
            showControls={false}
          />
          
          {/* Overlay de carga */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingText}>Cargando video...</Text>
            </View>
          )}
          
          {/* Controles del video */}
          {showControls && showControlsOverlay && (
            <Animated.View
              style={[
                styles.controlsOverlay,
                { opacity: controlsOpacity },
              ]}
              // Importante: permitir que los toques pasen a través cuando es transparente
              pointerEvents={showControlsOverlay ? 'auto' : 'none'}
            >
              {/* Barra superior */}
              <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconButton} onPress={onClose}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                
                <View style={styles.topRightButtons}>
                  <TouchableOpacity 
                    style={styles.speedButton}
                    onPress={() => setShowSpeedMenu(!showSpeedMenu)}
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
              </View>
              
              {/* Controles centrales */}
              <View style={styles.centerControls}>
                <TouchableOpacity 
                  style={styles.centerButton}
                  onPress={seekBackward}
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
                  onPress={seekForward}
                >
                  <Ionicons name="play-forward" size={32} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Barra inferior con controles */}
              <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.iconButton} onPress={toggleMute}>
                  <Ionicons 
                    name={isMuted ? "volume-mute" : "volume-high"} 
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
          
          {/* Menú de velocidad de reproducción */}
          {showSpeedMenu && (
            <View style={styles.speedMenu}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedOption,
                    playbackRate === speed && styles.selectedSpeed
                  ]}
                  onPress={() => changePlaybackSpeed(speed)}
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
    // Los estilos de landscape se manejan automáticamente
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    backgroundColor: 'black',
    width: '100%',
    height: '100%',
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
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 1001,
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
  topRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    marginLeft: 8,
  },
  speedButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
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
    zIndex: 1002,
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
    fontSize: 18,
    marginTop: 16,
    marginBottom: 32,
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