import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Image, 
  View, 
  StyleSheet,
  Dimensions,
  Text,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 16) / 3 - 8;

export default function MediaItem({ item, onPress }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const isVideo = item.mediaType === 'video' || item.type === 'video';
  
  // Usar thumbnail si está disponible para videos
  const imageUri = isVideo ? (item.thumbnailUri || item.uri) : item.uri;

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Loading placeholder */}
      {!imageLoaded && !imageError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      
      {/* Image/Video thumbnail */}
      <Image 
        source={{ uri: imageUri }} 
        style={[styles.image, !imageLoaded && { opacity: 0 }]}
        resizeMode="cover"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(true);
        }}
      />
      
      {/* Error fallback */}
      {imageError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#ccc" />
        </View>
      )}
      
      {/* Video overlay */}
      {isVideo && imageLoaded && !imageError && (
        <View style={styles.overlay}>
          <Ionicons name="play-circle" size={28} color="white" />
          {item.duration && (
            <Text style={styles.duration}>
              {formatDuration(item.duration / 1000)}
            </Text>
          )}
        </View>
      )}
      
      {/* Type indicator */}
      <View style={styles.infoContainer}>
        <View style={styles.typeIndicator}>
          <Ionicons 
            name={isVideo ? "videocam" : "image"} 
            size={12} 
            color="white" 
          />
        </View>
      </View>
      
      {/* Quality indicator for HD videos */}
      {isVideo && item.width >= 1920 && (
        <View style={styles.qualityIndicator}>
          <Text style={styles.qualityText}>HD</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e9ecef',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  typeIndicator: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 4,
  },
  qualityIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});