import React, { useState, useEffect } from 'react';
import { 
  Modal,
  View, 
  Image, 
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
  Alert
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

export default function MediaModal({ visible, media, onClose, onDelete, onShare }) {
  const [showControls, setShowControls] = useState(true);
  const [playerKey, setPlayerKey] = useState(0); // Key para forzar recreación del player
  
  // Solo crear el player si tenemos media y está visible
  const videoSource = visible && media?.mediaType === 'video' ? media.uri : null;
  
  // El player se recrea cada vez que cambia el videoSource o el key
  const player = useVideoPlayer(videoSource, (player) => {
    if (player && videoSource) {
      player.loop = false;
      player.muted = false;
    }
  });

  // Recrear el player cuando el modal se cierra/abre
  useEffect(() => {
    if (!visible && media?.mediaType === 'video') {
      // Incrementamos el key para forzar la recreación del player la próxima vez
      setPlayerKey(prev => prev + 1);
    }
  }, [visible, media]);

  // Resetear controles cuando se abre el modal
  useEffect(() => {
    if (visible) {
      setShowControls(true);
    }
  }, [visible]);

  if (!media) return null;

  const isVideo = media.mediaType === 'video';

  const toggleControls = () => {
    setShowControls(!showControls);
    
    // Auto-hide controls after 3 seconds
    if (!showControls) {
      setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este archivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => onDelete(media)
        }
      ]
    );
  };

  const handleShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(media.uri);
      } else {
        Alert.alert('Error', 'No se puede compartir en este dispositivo');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'No se pudo compartir el archivo');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header - Solo mostrar si los controles están activos o no es video */}
        {(showControls || !isVideo) && (
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.button}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.button}
                onPress={handleShare}
              >
                <Ionicons name="share" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.button}
                onPress={handleDelete}
              >
                <Ionicons name="trash" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Media Content */}
        <View style={styles.mediaContainer}>
          {isVideo ? (
            <TouchableOpacity 
              style={styles.videoContainer}
              onPress={toggleControls}
              activeOpacity={1}
            >
              {/* Usar el key para forzar recreación cuando sea necesario */}
              <VideoView 
                key={`video-${media.id}-${playerKey}`}
                style={styles.fullscreenVideo}
                player={player}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                showsTimecodes={showControls}
                requiresLinearPlayback={false}
              />
            </TouchableOpacity>
          ) : (
            <Image 
              source={{ uri: media.uri }} 
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
        
        {/* Footer with metadata - Solo mostrar si los controles están activos o no es video */}
        {(showControls || !isVideo) && (
          <View style={styles.footer}>
            <Text style={styles.filename}>{media.filename}</Text>
            <Text style={styles.metadata}>
              {new Date(media.createdAt).toLocaleString()}
              {media.duration && (
                <> • {Math.round(media.duration / 1000)}s</>
              )}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  button: {
    padding: 8,
    marginHorizontal: 4,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
  videoContainer: {
    width: width,
    height: height,
  },
  fullscreenVideo: {
    width: width,
    height: height,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filename: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metadata: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
});