import React, { useRef, useState } from 'react';
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
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

export default function MediaModal({ visible, media, onClose, onDelete, onShare }) {
  const videoRef = useRef(null);
  const [videoStatus, setVideoStatus] = useState({});

  if (!media) return null;

  const isVideo = media.mediaType === 'video';

  const handleVideoPress = () => {
    if (videoRef.current && isVideo) {
      if (videoStatus.isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
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
        {/* Header */}
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
        
        {/* Media Content */}
        <View style={styles.mediaContainer}>
          {isVideo ? (
            <TouchableOpacity 
              style={styles.videoContainer}
              onPress={handleVideoPress}
              activeOpacity={1}
            >
              <Video
                ref={videoRef}
                style={styles.fullscreenVideo}
                source={{ uri: media.uri }}
                shouldPlay={false}
                isLooping={false}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls={true}
                onPlaybackStatusUpdate={setVideoStatus}
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
        
        {/* Footer with metadata */}
        <View style={styles.footer}>
          <Text style={styles.filename}>{media.filename}</Text>
          <Text style={styles.metadata}>
            {new Date(media.createdAt).toLocaleString()}
            {media.duration && (
              <> • {Math.round(media.duration / 1000)}s</>
            )}
          </Text>
        </View>
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