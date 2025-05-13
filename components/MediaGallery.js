import React, { useState } from 'react';
import { 
  View, 
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  SectionList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MediaItem from './MediaItem';

export default function MediaGallery({ media, onMediaPress, searchQuery }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'date'

  const groupMediaByDate = (mediaArray) => {
    const grouped = {};
    
    mediaArray.forEach(item => {
      const date = new Date(item.createdAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        title: formatDate(date),
        data: grouped[date]
      }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderGridItem = (item, index) => (
    <MediaItem 
      key={item.id || index}
      item={item}
      onPress={() => onMediaPress(item)}
    />
  );

  const renderListItem = (item) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => onMediaPress(item)}
    >
      <MediaItem item={item} onPress={() => onMediaPress(item)} />
      <View style={styles.listItemInfo}>
        <Text style={styles.listItemTitle}>{item.filename}</Text>
        <Text style={styles.listItemSubtitle}>
          {new Date(item.createdAt).toLocaleDateString()} • {item.mediaType}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity 
        style={[styles.toggleButton, viewMode === 'grid' && styles.activeToggle]}
        onPress={() => setViewMode('grid')}
      >
        <Ionicons name="grid" size={20} color={viewMode === 'grid' ? '#007AFF' : '#6c757d'} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
        onPress={() => setViewMode('list')}
      >
        <Ionicons name="list" size={20} color={viewMode === 'list' ? '#007AFF' : '#6c757d'} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.toggleButton, viewMode === 'date' && styles.activeToggle]}
        onPress={() => setViewMode('date')}
      >
        <Ionicons name="calendar" size={20} color={viewMode === 'date' ? '#007AFF' : '#6c757d'} />
      </TouchableOpacity>
    </View>
  );

  const filteredMedia = media.filter(item => 
    !searchQuery || 
    item.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    new Date(item.createdAt).toLocaleDateString().includes(searchQuery)
  );

  if (viewMode === 'date') {
    const groupedData = groupMediaByDate(filteredMedia);
    
    return (
      <View style={styles.container}>
        {renderViewToggle()}
        <SectionList
          sections={groupedData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderGridItem(item)}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          numColumns={3}
          contentContainerStyle={styles.sectionList}
        />
      </View>
    );
  }

  if (viewMode === 'list') {
    return (
      <View style={styles.container}>
        {renderViewToggle()}
        <ScrollView style={styles.listView}>
          {filteredMedia.map((item, index) => renderListItem(item))}
        </ScrollView>
      </View>
    );
  }

  // Vista de grilla por defecto
  return (
    <View style={styles.container}>
      {renderViewToggle()}
      <View style={styles.gridView}>
        {filteredMedia.map((item, index) => renderGridItem(item, index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  toggleButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#f8f9fa',
  },
  gridView: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
  },
  listView: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  listItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  sectionList: {
    padding: 4,
  },
});