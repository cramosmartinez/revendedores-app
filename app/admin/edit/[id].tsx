import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- FIREBASE ---
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; 

export default function EditProductScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState(''); // <-- NUEVO ESTADO: Costo
  const [quantity, setQuantity] = useState(''); 
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');

  // 1. CARGAR DATOS ACTUALES
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id as string);
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          setName(data.name);
          setPrice(data.price ? data.price.toString() : '');
          setCost(data.cost ? data.cost.toString() : ''); // <-- Cargar Costo
          setQuantity(data.stock ? data.stock.toString() : '0');
          setCategory(data.category);
          setDesc(data.description || '');
        } else {
          Alert.alert("Error", "Producto no encontrado");
          router.back();
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "No se pudieron cargar los datos.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // 2. GUARDAR CAMBIOS
  const handleUpdate = async () => {
    if (!name || !price || !cost || !quantity) {
      Alert.alert("Faltan datos", "Nombre, precio, costo y cantidad son obligatorios");
      return;
    }

    setSaving(true);
    try {
      const productRef = doc(db, "products", id as string);
      
      await updateDoc(productRef, {
        name: name,
        price: parseFloat(price),
        cost: parseFloat(cost), // <-- Guardar Costo
        stock: parseInt(quantity),
        description: desc,
        updatedAt: serverTimestamp()
      });

      Alert.alert("¡Actualizado!", "Producto modificado correctamente.");
      router.replace('/(tabs)'); 
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000"/>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      
      {/* SOLUCIÓN: CONFIGURACIÓN DEL ENCABEZADO */}
      <Stack.Screen 
        options={{ 
          title: 'Editar Producto', 
          headerBackTitle: 'Volver', 
          headerTitleStyle: { fontWeight: 'bold' } 
        }} 
      />
      
      {/* Contenido de la Pantalla */}
      <View style={{paddingTop: 20}}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
            <Text style={styles.label}>Precio Venta (Q)</Text>
            <TextInput 
              style={styles.input} 
              value={price} 
              onChangeText={setPrice} 
              keyboardType="numeric" 
            />
          </View>
          
          <View style={[styles.inputGroup, {flex: 1}]}>
            <Text style={styles.label}>Costo (Q)</Text> {/* <-- CAMPO COSTO */}
            <TextInput 
              style={styles.input} 
              value={cost} 
              onChangeText={setCost} 
              keyboardType="numeric" 
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
            <Text style={styles.label}>Stock Actual</Text>
            <TextInput 
              style={styles.input} 
              value={quantity} 
              onChangeText={setQuantity} 
              keyboardType="numeric" 
            />
          </View>
          
          <View style={[styles.inputGroup, {flex: 1}]}>
            <Text style={styles.label}>Categoría</Text>
            <TextInput 
              style={[styles.input, {backgroundColor: '#eee', color: '#999'}]} 
              value={category} 
              editable={false} 
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput 
            style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
            value={desc} 
            onChangeText={setDesc} 
            multiline 
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && {backgroundColor: '#666'}]} 
          onPress={handleUpdate} 
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={{height: 50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 15, fontSize: 16 },
  row: { flexDirection: 'row' },
  
  saveBtn: { backgroundColor: '#000', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});