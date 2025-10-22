import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { Button, Title, Card, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/api';

export default function UploadFotoScreen() {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Erro', 'Permissão para acessar galeria é necessária!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert('Erro', 'Selecione uma imagem primeiro');
      return;
    }

    setUploading(true);
    try {
      const response = await apiService.uploadFoto(image);
      setUploadedUrl(response.url);
      Alert.alert('Sucesso', 'Foto enviada com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      Alert.alert('Erro', 'Falha ao enviar foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Upload de Foto</Title>
          
          {image && (
            <Image source={{ uri: image }} style={styles.image} />
          )}
          
          <Button
            mode="outlined"
            onPress={pickImage}
            style={styles.button}
            textColor="#ffffff"
          >
            Selecionar Foto
          </Button>

          <Button
            mode="contained"
            onPress={uploadImage}
            loading={uploading}
            disabled={!image}
            style={styles.button}
          >
            Enviar Foto
          </Button>

          {uploadedUrl && (
            <View style={styles.result}>
              <Text style={styles.resultText}>URL: {uploadedUrl}</Text>
              <Image source={{ uri: uploadedUrl }} style={styles.uploadedImage} />
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  card: {
    backgroundColor: '#111111',
  },
  title: {
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  image: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 10,
  },
  button: {
    marginBottom: 16,
  },
  result: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#222222',
    borderRadius: 5,
  },
  resultText: {
    color: '#ffffff',
    marginBottom: 10,
  },
  uploadedImage: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    borderRadius: 50,
  },
});