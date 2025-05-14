import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const pickMedia = async () => {
  try {
    // Verificar permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu galería para continuar');
      return null;
    }

    // Abrir selector de medios - Usando la nueva API con array de strings
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'], // Usar array de strings en lugar de enums
      allowsMultipleSelection: true,
      quality: 0.8,
      videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
    });

    if (!result.canceled && result.assets) {
      return result.assets.map(asset => ({
        ...asset,
        id: generateId(),
        createdAt: new Date().toISOString(),
        filename: asset.uri.split('/').pop() || 'unknown',
      }));
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
      await Sharing.shareAsync(media.uri, {
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