import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [media, setMedia] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [videoStatus, setVideoStatus] = useState({});
  const videoRef = useRef(null);

  const pickMedia = async () => {
    console.log('Botón presionado');
    
    try {
      // Asegurarnos de que no hay estados conflictivos
      setModalVisible(false);
      setSelectedMedia(null);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permiso status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Necesito acceder a tu galería');
        return;
      }

      console.log('Abriendo selector...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      console.log('Resultado:', result);
      
      if (!result.canceled && result.assets) {
        console.log('Agregando archivos...');
        setMedia(prevMedia => [...prevMedia, ...result.assets]);
      }
    } catch (error) {
      console.error('Error en pickMedia:', error);
      Alert.alert('Error', `Hubo un problema: ${error.message}`);
    }
  };

  const openMedia = (item) => {
    console.log('Abriendo media:', item);
    try {
      setSelectedMedia(item);
      setModalVisible(true);
      setVideoStatus({});
    } catch (error) {
      console.error('Error al abrir media:', error);
      Alert.alert('Error', 'No se pudo abrir el archivo');
    }
  };

  const closeModal = () => {
    console.log('Cerrando modal');
    setModalVisible(false);
    setSelectedMedia(null);
    setVideoStatus({});
    if (videoRef.current && selectedMedia?.type === 'video') {
      videoRef.current.pauseAsync();
    }
  };

  const handleVideoPress = () => {
    if (videoRef.current) {
      if (videoStatus.isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
    }
  };

  const renderMedia = ({ item, index }) => {
    if (!item || !item.uri) {
      console.log('Item inválido:', item);
      return null;
    }
    
    const isVideo = item.type === 'video';
    
    return (
      <TouchableOpacity 
        style={styles.mediaContainer}
        onPress={() => openMedia(item)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: item.uri }} 
          style={styles.thumbnail}
          onError={(error) => console.log('Error cargando imagen:', error)}
        />
        {isVideo && (
          <View style={styles.playIcon}>
            <Text style={styles.playText}>▶</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Mi Galería</Text>
      
      <TouchableOpacity style={styles.addButton} onPress={pickMedia}>
        <Text style={styles.addButtonText}>Agregar Fotos/Videos</Text>
      </TouchableOpacity>
      
      <Text style={styles.counter}>
        Archivos: {media.length} 
        ({media.filter(m => m.type === 'video').length} videos)
      </Text>
      
      <FlatList
        data={media}
        renderItem={renderMedia}
        numColumns={3}
        keyExtractor={(item, index) => `${item.uri}-${index}`}
        style={styles.list}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
      />

      {/* Modal para pantalla completa */}
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={closeModal}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
          
          {selectedMedia && selectedMedia.uri && (
            selectedMedia.type === 'video' ? (
              <TouchableOpacity 
                style={styles.videoContainer}
                onPress={handleVideoPress}
                activeOpacity={1}
              >
                <Video
                  ref={videoRef}
                  style={styles.fullscreenVideo}
                  source={{ uri: selectedMedia.uri }}
                  shouldPlay={false}
                  isLooping={false}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls={true}
                  onPlaybackStatusUpdate={setVideoStatus}
                />
                {!videoStatus.isPlaying && (
                  <View style={styles.playOverlay}>
                    <TouchableOpacity 
                      style={styles.playButton}
                      onPress={handleVideoPress}
                    >
                      <Text style={styles.playButtonText}>▶</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.imageContainer}
                onPress={closeModal}
                activeOpacity={1}
              >
                <Image 
                  source={{ uri: selectedMedia.uri }} 
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                  onError={(error) => {
                    console.log('Error cargando imagen completa:', error);
                    Alert.alert('Error', 'No se pudo cargar la imagen');
                    closeModal();
                  }}
                />
              </TouchableOpacity>
            )
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 50,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  counter: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  mediaContainer: {
    flex: 1/3,
    margin: 2,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 4,
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    color: 'white',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullscreenVideo: {
    width: width,
    height: height,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 40,
    color: '#000',
  },
});