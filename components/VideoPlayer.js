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
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { VideoView, useVideoPlayer } from 'expo-video';

const { width, height } = Dimensions.get('window');

export default function VideoPlayer({ 
  videoUri, 
  visible = true, 
  onClose, 
  autoPlay = false,
  showControls = true 
}) {
  // Estados del reproductor
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  
  // Referencias
  const overlayTimeout = useRef(null);
  const initialOrientation = useRef(null);
  const forceHideLoadingTimeout = useRef(null);
  
  // Crear el reproductor de video con configuración mejorada
  const player = useVideoPlayer(videoUri, (player) => {
    if (player) {
      // Configurar el reproductor
      player.loop = false;
      player.muted = false;
      
      // Si se debe reproducir automáticamente
      if (autoPlay && visible) {
        try {
          const playPromise = player.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(error => {
              console.error('Error auto-playing video:', error);
            });
          }
        } catch (error) {
          console.error('Error calling play():', error);
        }
      }
    }
  });

  // Configurar listeners del reproductor
  useEffect(() => {
    if (!player) return;

    let hasStartedPlaying = false;

    // Listener para cambios de estado
    const statusSubscription = player.addListener('statusChange', (status) => {
      console.log('Video status changed:', status);
      
      switch (status) {
        case 'idle':
          setIsLoading(false);
          break;
        case 'loading':
          setIsLoading(true);
          setHasError(false);
          break;
        case 'readyToPlay':
          setIsLoading(false);
          setHasError(false);
          // Ocultar overlay si el video está listo
          if (!hasStartedPlaying) {
            const timer = setTimeout(() => {
              setShowOverlay(false);
            }, 1000);
            return () => clearTimeout(timer);
          }
          break;
        case 'error':
          console.error('Video player error');
          setHasError(true);
          setIsLoading(false);
          break;
      }
    });

    // Listener para el estado de reproducción
    const playingStatusSubscription = player.addListener('playingChange', (isPlaying) => {
      console.log('Playing status changed:', isPlaying);
      setIsPlaying(isPlaying);
      
      if (isPlaying && !hasStartedPlaying) {
        hasStartedPlaying = true;
        setVideoStarted(true);
        setIsLoading(false);
        // Ocultar overlay después de que empiece a reproducir
        const timer = setTimeout(() => {
          setShowOverlay(false);
        }, 1000);
        return () => clearTimeout(timer);
      }
    });

    // Listener para errores
    const errorSubscription = player.addListener('error', (error) => {
      console.error('Video error:', error);
      setHasError(true);
      setIsLoading(false);
    });

    // Listener para cuando termina de cargar
    const loadingSwitchedSubscription = player.addListener('loadingChange', (isLoading) => {
      console.log('Loading changed:', isLoading);
      setIsLoading(isLoading);
    });

    return () => {
      statusSubscription?.remove();
      playingStatusSubscription?.remove();
      errorSubscription?.remove();
      loadingSwitchedSubscription?.remove();
    };
  }, [player]);

  // Manejo del modal
  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setHasError(false);
      setShowOverlay(true);
      setIsFullscreen(false);
      setIsPlaying(false);
      
      // Guardar orientación inicial
      ScreenOrientation.getOrientationAsync().then(orientation => {
        initialOrientation.current = orientation;
      });
      
      // Auto-hide overlay después de más tiempo
      if (overlayTimeout.current) {
        clearTimeout(overlayTimeout.current);
      }
      overlayTimeout.current = setTimeout(() => {
        setShowOverlay(false);
      }, 5000); // Aumentar tiempo para videos que se demoran en cargar
      
      // Timeout de seguridad para ocultar el loading después de 3 segundos
      if (forceHideLoadingTimeout.current) {
        clearTimeout(forceHideLoadingTimeout.current);
      }
      forceHideLoadingTimeout.current = setTimeout(() => {
        console.log('Force hiding loading overlay');
        setIsLoading(false);
      }, 3000);
    } else {
      // Limpiar cuando se cierra
      if (overlayTimeout.current) {
        clearTimeout(overlayTimeout.current);
      }
      if (forceHideLoadingTimeout.current) {
        clearTimeout(forceHideLoadingTimeout.current);
      }
      
      // Restaurar orientación
      if (initialOrientation.current) {
        ScreenOrientation.lockAsync(initialOrientation.current);
      } else {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      }
      
      // Pausar video
      if (player) {
        try {
          player.pause();
        } catch (error) {
          console.error('Error pausing video:', error);
        }
      }
    }
  }, [visible, player]);

  // Función para mostrar/ocultar overlay
  const toggleOverlay = () => {
    setShowOverlay(!showOverlay);
    
    if (!showOverlay) {
      // Auto-hide después de 3 segundos
      if (overlayTimeout.current) {
        clearTimeout(overlayTimeout.current);
      }
      overlayTimeout.current = setTimeout(() => {
        setShowOverlay(false);
      }, 3000);
    }
  };

  // Función para alternar play/pause
  const togglePlayPause = () => {
    if (player) {
      try {
        if (isPlaying) {
          player.pause();
        } else {
          const playPromise = player.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(error => {
              console.error('Error playing video:', error);
            });
          }
        }
      } catch (error) {
        console.error('Error toggling play/pause:', error);
      }
    }
  };

  // Función para alternar pantalla completa
  const toggleFullscreen = async () => {
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
      Alert.alert('Error', 'No se pudo cambiar el modo de pantalla');
    }
  };

  // Función para cerrar el modal
  const handleClose = () => {
    if (player) {
      try {
        player.pause();
      } catch (error) {
        console.error('Error pausing video on close:', error);
      }
    }
    onClose();
  };

  // Renderizar error
  if (hasError) {
    return (
      <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>Error al cargar el video</Text>
          <Text style={styles.errorSubtext}>
            Verifica que el archivo sea válido y que tengas conexión
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleClose}>
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
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <StatusBar hidden={isFullscreen} barStyle="light-content" />
      
      <View style={styles.container}>
        {/* Video Player */}
        <TouchableOpacity 
          style={styles.videoContainer}
          onPress={toggleOverlay}
          activeOpacity={1}
        >
          <VideoView 
            style={styles.video}
            player={player}
            allowsFullscreen={true}
            allowsPictureInPicture={true}
            contentFit="contain"
            nativeControls={false}
          />
          
          {/* Overlay de carga */}
          {isLoading && !videoStarted && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingText}>Cargando video...</Text>
            </View>
          )}
          
          {/* Overlay de controles */}
          {showOverlay && !isLoading && (
            <View style={styles.controlsOverlay}>
              {/* Botones superiores */}
              <View style={styles.topControls}>
                <TouchableOpacity style={styles.controlButton} onPress={handleClose}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.controlButton} onPress={toggleFullscreen}>
                  <Ionicons 
                    name={isFullscreen ? "contract-outline" : "expand-outline"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Control de play/pause central */}
              <TouchableOpacity 
                style={styles.playPauseButton}
                onPress={togglePlayPause}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={50} 
                  color="white" 
                />
              </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
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
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    alignItems: 'center',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 22,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 32,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
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