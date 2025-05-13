import { useState, useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import * as FileManager from '../services/FileManager';
import * as MediaManager from '../services/MediaManager';

export const useMediaManager = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    initializeApp();
    
    // Listener para cuando la app vuelve al primer plano
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        refreshMedia();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      await FileManager.initializeStorage();
      const savedMedia = await FileManager.getSavedMedia();
      setMedia(savedMedia);
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Hubo un problema al cargar la aplicación');
    } finally {
      setLoading(false);
    }
  };

  const addMedia = async () => {
    try {
      setLoading(true);
      const selectedMedia = await MediaManager.pickMedia();
      
      if (selectedMedia && selectedMedia.length > 0) {
        const savedMedia = await FileManager.saveMediaFiles(selectedMedia);
        setMedia(prevMedia => [...prevMedia, ...savedMedia]);
        
        Alert.alert(
          'Archivos agregados',
          `Se agregaron ${savedMedia.length} archivo(s) a tu galería`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error adding media:', error);
      Alert.alert('Error', 'No se pudieron agregar los archivos');
    } finally {
      setLoading(false);
    }
  };

  const deleteMedia = async (mediaToDelete) => {
    try {
      await FileManager.deleteMediaFile(mediaToDelete);
      setMedia(prevMedia => 
        prevMedia.filter(item => item.id !== mediaToDelete.id)
      );
    } catch (error) {
      console.error('Error deleting media:', error);
      Alert.alert('Error', 'No se pudo eliminar el archivo');
    }
  };

  const shareMedia = async (mediaToShare) => {
    try {
      await MediaManager.shareMedia(mediaToShare);
    } catch (error) {
      console.error('Error sharing media:', error);
      Alert.alert('Error', 'No se pudo compartir el archivo');
    }
  };

  const refreshMedia = async () => {
    try {
      setRefreshing(true);
      const savedMedia = await FileManager.getSavedMedia();
      setMedia(savedMedia);
    } catch (error) {
      console.error('Error refreshing media:', error);
      Alert.alert('Error', 'No se pudo actualizar la galería');
    } finally {
      setRefreshing(false);
    }
  };

  const getMediaByType = (type) => {
    return media.filter(item => item.mediaType === type);
  };

  const getMediaStats = () => {
    const videos = getMediaByType('video');
    const images = getMediaByType('image');
    
    return {
      total: media.length,
      videos: videos.length,
      images: images.length,
      totalSize: media.reduce((acc, item) => acc + (item.fileSize || 0), 0),
    };
  };

  return {
    media,
    loading,
    refreshing,
    addMedia,
    deleteMedia,
    shareMedia,
    refreshMedia,
    getMediaByType,
    getMediaStats,
  };
};