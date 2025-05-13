import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatsCard({ stats }) {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Ionicons name="images" size={18} color="#007AFF" />
        <Text style={styles.statNumber}>{stats.images}</Text>
        <Text style={styles.statLabel}>Imágenes</Text>
      </View>
      
      <View style={styles.stat}>
        <Ionicons name="videocam" size={18} color="#007AFF" />
        <Text style={styles.statNumber}>{stats.videos}</Text>
        <Text style={styles.statLabel}>Videos</Text>
      </View>
      
      <View style={styles.stat}>
        <Ionicons name="stats-chart" size={18} color="#007AFF" />
        <Text style={styles.statNumber}>{stats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      
      {stats.totalSize > 0 && (
        <View style={styles.stat}>
          <Ionicons name="folder" size={18} color="#007AFF" />
          <Text style={styles.statNumber}>{formatFileSize(stats.totalSize)}</Text>
          <Text style={styles.statLabel}>Tamaño</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
});