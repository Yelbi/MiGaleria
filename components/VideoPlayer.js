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

// Importación específica para VideoView
const { VideoView, useVideoPlayer } = require('expo-video');

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
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Referencias
  const overlayTimeout = useRef(null);
  
  // Crear el reproductor de video
  const player = useVideoPlayer(videoUri, (player) => {
    if (player) {
      // Configurar el reproductor
      player.loop = false;
      player.muted = false;
      
      // Reproducir automáticamente si está configurado
      if (autoPlay && visible) {
        setTimeout(() => {
          player.play();
        }, 500);
      }
    }
  });

  // Configurar listeners del reproductor
  useEffect(() => {
    if (!player) return;

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

    // Listener para actualizaciones de tiempo (reducir carga)
    const timeSubscription = player.addListener('timeUpdate', () => {
      if (isLoading) {
        setIsLoading(false);
      }
    });

    return () => {
      statusSubscription?.remove();
      timeSubscription?.remove();
    };
  }, [player, isLoading]);

  // Resetear estado cuando se abre/cierra el modal
  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setHasError(false);
      setShowOverlay(false);
    } else {
      // Limpiar timeout al cerrar
      if (overlayTimeout.current) {
        clearTimeout(overlayTimeout.current);
      }
      
      // Resetear orientación al cerrar
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      StatusBar.setHidden(false, 'fade');
    }
  }, [visible]);

  // Función para mostrar/ocultar overlay
  const toggleOverlay = () => {
    setShowOverlay(!showOverlay);
    
    if (!showOverlay) {
      // Si vamos a mostrar el overlay, ocultarlo después de 3 segundos
      if (overlayTimeout.current) {
        clearTimeout(overlayTimeout.current);
      }
      overlayTimeout.current = setTimeout(() => {
        setShowOverlay(false);
      }, 3000);
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
    }
  };

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
        {/* VideoView con controles nativos */}
        <TouchableOpacity 
          style={styles.videoContainer}
          onPress={toggleOverlay}
          activeOpacity={1}
        >
          <VideoView 
            style={styles.video}
            player={player}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            requiresLinearPlayback={false}
            contentFit="contain"
            // Usar controles nativos
            useNativeControls={true}
            nativeControls={true}
          />
          
          {/* Overlay de carga - solo mostrar si realmente está cargando */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingText}>Cargando video...</Text>
            </View>
          )}
          
          {/* Overlay personalizado mínimo */}
          {showOverlay && (
            <View style={styles.customOverlay}>
              {/* Botones superiores */}
              <View style={styles.topBar}>
                <TouchableOpacity style={styles.overlayButton} onPress={onClose}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                
                <View style={styles.topRightButtons}>
                  <TouchableOpacity style={styles.overlayButton} onPress={toggleFullscreen}>
                    <Ionicons 
                      name={isFullscreen ? "contract-outline" : "expand-outline"} 
                      size={24} 
                      color="white" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  customOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    pointerEvents: 'box-none', // Permite que los toques pasen a través del fondo
    zIndex: 999,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 22,
    marginLeft: 8,
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