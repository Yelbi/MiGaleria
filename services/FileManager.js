import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

const STORAGE_KEY = '@mi_galeria_files';
const MEDIA_DIRECTORY = FileSystem.documentDirectory + 'galeria/';

export const initializeStorage = async () => {
  try {
    // Crear directorio de medios si no existe
    const dirInfo = await FileSystem.getInfoAsync(MEDIA_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MEDIA_DIRECTORY, { intermediates: true });
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
    throw error;
  }
};

export const saveMediaFiles = async (mediaArray) => {
  try {
    const savedFiles = [];
    
    for (const media of mediaArray) {
      // Crear nombre único para el archivo
      const filename = `${Date.now()}_${media.filename || 'media'}`;
      const fileUri = MEDIA_DIRECTORY + filename;
      
      // Copiar archivo al directorio de la app
      await FileSystem.copyAsync({
        from: media.uri,
        to: fileUri,
      });
      
      // Crear objeto de media con metadata
      const savedMedia = {
        ...media,
        localUri: fileUri,
        savedAt: new Date().toISOString(),
      };
      
      savedFiles.push(savedMedia);
    }
    
    // Guardar referencias en AsyncStorage
    const existingFiles = await getSavedMedia();
    const updatedFiles = [...existingFiles, ...savedFiles];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
    
    return savedFiles;
  } catch (error) {
    console.error('Error saving media files:', error);
    throw error;
  }
};

export const getSavedMedia = async () => {
  try {
    const savedData = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const media = JSON.parse(savedData);
      
      // Verificar que los archivos aún existen
      const validMedia = [];
      for (const item of media) {
        const fileInfo = await FileSystem.getInfoAsync(item.localUri || item.uri);
        if (fileInfo.exists) {
          validMedia.push({
            ...item,
            uri: item.localUri || item.uri, // Usar URI local si existe
          });
        }
      }
      
      // Actualizar storage si se encontraron archivos faltantes
      if (validMedia.length !== media.length) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validMedia));
      }
      
      return validMedia;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting saved media:', error);
    return [];
  }
};

export const deleteMediaFile = async (media) => {
  try {
    // Eliminar archivo físico
    if (media.localUri && await FileSystem.getInfoAsync(media.localUri).then(info => info.exists)) {
      await FileSystem.deleteAsync(media.localUri);
    }
    
    // Eliminar de AsyncStorage
    const savedMedia = await getSavedMedia();
    const updatedMedia = savedMedia.filter(item => item.id !== media.id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMedia));
    
    return true;
  } catch (error) {
    console.error('Error deleting media file:', error);
    throw error;
  }
};

export const getAllMediaMetadata = async () => {
  try {
    const media = await getSavedMedia();
    return media.map(item => ({
      id: item.id,
      type: item.mediaType,
      createdAt: item.createdAt,
      savedAt: item.savedAt,
      filename: item.filename,
      size: item.fileSize,
    }));
  } catch (error) {
    console.error('Error getting media metadata:', error);
    return [];
  }
};