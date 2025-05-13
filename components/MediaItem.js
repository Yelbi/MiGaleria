import React from 'react';
import { 
  TouchableOpacity, 
  Image, 
  View, 
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 16) / 3 - 8;

export default function MediaItem({ item, onPress }) {
  const isVideo = item.mediaType === 'video';

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.thumbnailUri || item.uri }} 
        style={styles.image}
        resizeMode="cover"
      />
      
      {isVideo && (
        <View style={styles.overlay}>
          <Ionicons name="play-circle" size={24} color="white" />
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <View style={styles.typeIndicator}>
          <Ionicons 
            name={isVideo ? "videocam" : "image"} 
            size={12} 
            color="white" 
          />
        </View>
      </View>
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
  image: {
    width: '100%',
    height: '100%',
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
  infoContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  typeIndicator: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 4,
  },
});