import React from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Text,
  RefreshControl
} from 'react-native';
import MediaItem from './MediaItem';

export default function MediaList({ media, onMediaPress, refreshing, onRefresh }) {
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No hay archivos</Text>
      <Text style={styles.emptyText}>
        Toca el botón + para agregar fotos y videos
      </Text>
    </View>
  );

  const renderMedia = ({ item, index }) => (
    <MediaItem 
      item={item}
      index={index}
      onPress={() => onMediaPress(item)}
    />
  );

  const groupMediaByDate = (mediaArray) => {
    const grouped = mediaArray.reduce((groups, item) => {
      const date = new Date(item.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {});

    return Object.entries(grouped).map(([date, items]) => ({
      date,
      data: items
    }));
  };

  const groupedMedia = groupMediaByDate(media);

  return (
    <View style={styles.container}>
      {media.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={media}
          renderItem={renderMedia}
          numColumns={3}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          initialNumToRender={15}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
});