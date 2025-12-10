import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- FIREBASE (Solo Firestore, sin Storage) ---
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Campos del formulario
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState(''); // Aquí pegaremos la URL de Google
  const [desc, setDesc] = useState('');

  const handleSave = async () => {
    if (!name || !price || !category) {
      Alert.alert("Faltan datos", "Nombre, precio y categoría son obligatorios.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        name: name,
        price: parseFloat(price),
        category: category,
        image: image || 'https://via.placeholder.com/400',
        description: desc,
        createdAt: serverTimestamp()
      });
      
      Alert.alert("¡Éxito!", "Producto publicado correctamente.");
      router.back(); 
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo guardar el producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo Producto</Text>
      </View>

      <Text style={styles.sectionTitle}>Información Básica</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre del Producto</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="Ej: Zapatillas Nike Air" 
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
          <Text style={styles.label}>Precio (Q)</Text>
          <TextInput 
            style={styles.input} 
            value={price} 
            onChangeText={setPrice} 
            keyboardType="numeric" 
            placeholder="0.00" 
          />
        </View>
        <View style={[styles.inputGroup, {flex: 1}]}>
          <Text style={styles.label}>Categoría</Text>
          <TextInput 
            style={styles.input} 
            value={category} 
            onChangeText={setCategory} 
            placeholder="Ropa, Tech..." 
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Imagen y Detalles</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>URL de la Imagen</Text>
        <TextInput 
          style={styles.input} 
          value={image} 
          onChangeText={setImage} 
          placeholder="Pega aquí el link de la imagen..." 
          autoCapitalize="none"
        />
        <Text style={styles.hint}>Tip: Busca en Google = Clic derecho = Copiar dirección de imagen.</Text>
      </View>

      {/* Previsualización simple */}
      {image.length > 10 && (
        <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput 
          style={[styles.input, {height: 100, textAlignVertical: 'top'}]} 
          value={desc} 
          onChangeText={setDesc} 
          multiline 
          placeholder="Detalles del producto..." 
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, loading && {backgroundColor: '#666'}]} 
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Publicar Producto</Text>}
      </TouchableOpacity>

      <View style={{height: 50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#F0F0F0', borderRadius: 12, marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333', marginTop: 10 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 15, fontSize: 16 },
  row: { flexDirection: 'row' },
  hint: { fontSize: 12, color: '#999', marginTop: 5 },
  previewImage: { width: '100%', height: 200, backgroundColor: '#f0f0f0', borderRadius: 12, marginBottom: 20 },
  saveBtn: { backgroundColor: '#000', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});