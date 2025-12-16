import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; 

export default function EditProductScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Estados para los campos
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');

  // 1. Cargar datos actuales
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setPrice(data.price ? String(data.price) : '');
          setStock(data.stock ? String(data.stock) : '');
          setCategory(data.category || '');
          setDesc(data.description || '');
        }
      } catch (e) {
        Alert.alert("Error", "No se pudo cargar el producto");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // 2. Guardar cambios
  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const docRef = doc(db, "products", id as string);
      await updateDoc(docRef, {
        name: name,
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category,
        description: desc
      });
      Alert.alert("¡Éxito!", "Producto actualizado");
      router.back(); // Volver atrás
    } catch (e) {
      Alert.alert("Error", "Falló la actualización");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#000" style={{flex:1}} />;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Editar Producto' }} />
      
      <View style={styles.form}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <View style={{flexDirection:'row', gap:10}}>
            <View style={{flex:1}}>
                <Text style={styles.label}>Precio</Text>
                <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
            </View>
            <View style={{flex:1}}>
                <Text style={styles.label}>Stock</Text>
                <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" />
            </View>
        </View>

        <Text style={styles.label}>Categoría</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} />

        <Text style={styles.label}>Descripción</Text>
        <TextInput style={[styles.input, {height:80}]} value={desc} onChangeText={setDesc} multiline />

        <TouchableOpacity style={styles.btn} onPress={handleUpdate} disabled={updating}>
            <Text style={styles.btnText}>{updating ? "Guardando..." : "Guardar Cambios"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  form: { gap: 15, paddingBottom: 50 },
  label: { fontWeight: 'bold', color: '#666' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, backgroundColor: '#f9f9f9', fontSize: 16 },
  btn: { backgroundColor: '#000', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});