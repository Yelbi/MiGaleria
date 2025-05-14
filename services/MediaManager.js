import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Alert } from 'react-native';

export const pickMedia = async () => {
  try {
    // Verificar permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu galería para continuar');
      return null;
    }

    // Abrir selector de medios
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
      videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
    });

    if (!result.canceled && result.assets) {
      const processedAssets = await Promise.all(
        result.assets.map(async (asset) => {
          // Determinar el tipo de media
          let mediaType = 'image';
          
          // Usar el tipo del asset si está disponible
          if (asset.type) {
            mediaType = asset.type;
          } else if (asset.mimeType) {
            mediaType = asset.mimeType.startsWith('video/') ? 'video' : 'image';
          } else if (asset.fileName) {
            // Detectar por extensión
            const extension = asset.fileName.toLowerCase().split('.').pop();
            const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', '3gp', 'webm', 'm4v'];
            mediaType = videoExtensions.includes(extension) ? 'video' : 'image';
          }

          let thumbnailUri = null;
          
          // Generar thumbnail para videos
          if (mediaType === 'video' && asset.uri) {
            try {
              const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
                time: 1000, // 1 segundo
                quality: 0.7,
              });
              thumbnailUri = uri;
            } catch (error) {
              console.warn('Error generating thumbnail:', error);
              // Si falla, usar la imagen del asset original
              thumbnailUri = asset.uri;
            }
          }

          return {
            ...asset,
            id: generateId(),
            createdAt: new Date().toISOString(),
            filename: asset.fileName || asset.uri.split('/').pop() || 'unknown',
            mediaType: mediaType,
            thumbnailUri: thumbnailUri || asset.uri,
            // Información adicional para videos
            ...(mediaType === 'video' && {
              width: asset.width,
              height: asset.height,
              duration: asset.duration,
            }),
          };
        })
      );

      return processedAssets;
    }

    return null;
  } catch (error) {
    console.error('Error picking media:', error);
    throw error;
  }
};

export const shareMedia = async (media) => {
  try {
    if (await Sharing.isAvailableAsync()) {
      // Para videos, compartir siempre el archivo original
      const uriToShare = media.mediaType === 'video' ? media.uri : media.uri;
      
      await Sharing.shareAsync(uriToShare, {
        mimeType: media.mediaType === 'video' ? 'video/*' : 'image/*',
        dialogTitle: 'Compartir archivo',
      });
    } else {
      Alert.alert('Error', 'No se puede compartir en este dispositivo');
    }
  } catch (error) {
    console.error('Error sharing media:', error);
    throw error;
  }
};

// Generar ID único
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Función auxiliar para obtener información del video
export const getVideoInfo = async (uri) => {
  try {
    // Esto es para obtener información adicional del video si es necesario
    const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, {
      time: 1000,
      quality: 0.5,
    });
    
    return {
      thumbnailUri,
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    return null;
  }
};