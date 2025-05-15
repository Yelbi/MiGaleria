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
import { Ionicons } from '@expo/vector-icons';
import VideoPlayer from './VideoPlayer';

const { width, height } = Dimensions.get('window');

export default function MediaModal({ visible, media, onClose, onDelete, onShare }) {
  const [showControls, setShowControls] = useState(true);

  // Resetear controles cuando se abre el modal
  useEffect(() => {
    if (visible) {
      setShowControls(true);
    }
  }, [visible]);

  if (!media) return null;

  const isVideo = media.mediaType === 'video' || media.type === 'video';

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
      await onShare(media);
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'No se pudo compartir el archivo');
    }
  };

  const toggleControlsVisibility = () => {
    setShowControls(!showControls);
  };

  // Si es video, mostrar el VideoPlayer
  if (isVideo) {
    return (
      <VideoPlayer
        videoUri={media.uri}
        visible={visible}
        onClose={onClose}
        autoPlay={true}
        useNativeControls={false}  // ¡IMPORTANTE!
        showControls={false}
      />
    );
  }

  // Si es imagen, mostrar la modal de imagen
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        {/* Imagen */}
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={toggleControlsVisibility}
          activeOpacity={1}
        >
          <Image 
            source={{ uri: media.uri }} 
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        {/* Controles para imágenes */}
        {showControls && (
          <View style={styles.imageControls}>
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
            
            <View style={styles.footer}>
              <Text style={styles.filename}>{media.filename}</Text>
              <Text style={styles.metadata}>
                {new Date(media.createdAt).toLocaleString()}
              </Text>
            </View>
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
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
  imageControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
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