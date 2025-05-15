import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
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
      const processedAssets = result.assets.map((asset) => {
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
        } else if (asset.uri) {
          // Último recurso: detectar por la URI
          const uriLower = asset.uri.toLowerCase();
          const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', '3gp', 'webm', 'm4v'];
          for (const ext of videoExtensions) {
            if (uriLower.includes(`.${ext}`)) {
              mediaType = 'video';
              break;
            }
          }
        }

        return {
          ...asset,
          id: generateId(),
          createdAt: new Date().toISOString(),
          filename: asset.fileName || asset.uri.split('/').pop() || 'unknown',
          mediaType: mediaType,
          // Para videos, usamos la misma URI como thumbnail 
          // (expo-video mostrará automáticamente el primer frame)
          thumbnailUri: asset.uri,
          // Información adicional para videos
          ...(mediaType === 'video' && {
            width: asset.width,
            height: asset.height,
            duration: asset.duration,
          }),
        };
      });

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
    // Usar la URI local si existe, de lo contrario usar la URI normal
    const uriToShare = media.localUri || media.uri;
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uriToShare, {
        mimeType: media.mediaType === 'video' ? 'video/*' : 'image/*',
        dialogTitle: 'Compartir archivo',
      });
    } else {
      Alert.alert('Error', 'No se puede compartir en este dispositivo');
    }
  } catch (error) {
    console.error('Error sharing media:', error);
    Alert.alert('Error', 'No se pudo compartir el archivo');
  }
};

// Función para guardar en la galería del dispositivo
export const saveToMediaLibrary = async (media) => {
  try {
    // Solicitar permisos
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos permisos para guardar en tu galería');
      return false;
    }
    
    // Guardar en galería
    const asset = await MediaLibrary.createAssetAsync(media.localUri || media.uri);
    
    if (asset) {
      Alert.alert('Éxito', 'Archivo guardado en la galería');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error saving to media library:', error);
    Alert.alert('Error', 'No se pudo guardar en la galería');
    return false;
  }
};

// Generar ID único
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};