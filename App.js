import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  StatusBar,
  Platform,
  BackHandler,
  Alert
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import MediaList from './components/MediaList';
import MediaModal from './components/MediaModal';
import Header from './components/Header';
import FloatingButton from './components/FloatingButton';
import LoadingSpinner from './components/LoadingSpinner';
import StatsCard from './components/StatsCard';
import { useMediaManager } from './hooks/useMediaManager';

export default function App() {
  const {
    media,
    loading,
    refreshing,
    addMedia,
    deleteMedia,
    shareMedia,
    refreshMedia,
    getMediaStats,
  } = useMediaManager();
  
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Manejar el botón de atrás en Android
    const backAction = () => {
      if (modalVisible) {
        closeModal();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [modalVisible]);

  const openMedia = (item) => {
    setSelectedMedia(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMedia(null);
  };

  const handleDeleteMedia = async (itemToDelete) => {
    await deleteMedia(itemToDelete);
    closeModal();
  };

  const filteredMedia = media.filter(item => 
    !searchQuery || 
    item.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    new Date(item.createdAt).toLocaleDateString().includes(searchQuery)
  );

  const stats = getMediaStats();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container}>
        <Header 
          mediaCount={media.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        <StatsCard stats={stats} />
        
        <MediaList 
          media={filteredMedia}
          onMediaPress={openMedia}
          refreshing={refreshing}
          onRefresh={refreshMedia}
        />
        
        <FloatingButton onPress={addMedia} />
        
        <MediaModal
          visible={modalVisible}
          media={selectedMedia}
          onClose={closeModal}
          onDelete={handleDeleteMedia}
          onShare={shareMedia}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});