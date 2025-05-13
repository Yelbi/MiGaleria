import React from 'react';
import { 
  View, 
  Text, 
  TextInput,
  StyleSheet, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ mediaCount, searchQuery, onSearchChange }) {
  const videoCount = mediaCount; // Esto se puede ajustar si separas videos de imágenes

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Galería</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Ionicons name="images" size={16} color="#6c757d" />
          <Text style={styles.statText}>
            {mediaCount} archivos
          </Text>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6c757d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar archivos..."
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholderTextColor="#6c757d"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
});