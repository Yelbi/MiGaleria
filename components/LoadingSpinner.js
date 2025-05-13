import React from 'react';
import { 
  View, 
  ActivityIndicator, 
  StyleSheet,
  Text 
} from 'react-native';

export default function LoadingSpinner({ message = 'Cargando...' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
});