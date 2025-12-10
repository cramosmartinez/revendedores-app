import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- FIREBASE ---
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig'; 

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Datos del producto
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(''); 
  const [selectedCat, setSelectedCat] = useState('');
  const [desc, setDesc] = useState('');

  // Lista de categorías
  const [categories, setCategories] = useState<any[]>([]);

  // 1. CARGAR LAS CATEGORÍAS
  useEffect(() => {
    const fetchCats = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Traemos solo las categorías de ESTE usuario
        const q = query(collection(db, "categories"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Categorías cargadas:", list.length); // DIAGNÓSTICO
        setCategories(list);
      } catch (error) {
        console.error("Error cargando categorías:", error);
      }
    };
    fetchCats();
  }, []);

  // Función para seleccionar categoría con diagnóstico
  const selectCategory = (catName: string) => {
    console.log("Seleccionaste la categoría:", catName);
    setSelectedCat(catName);
  };

  // 2. FUNCIÓN DE GUARDADO SEGURA
  const handleSave = async () => {
    console.log("--- INICIANDO GUARDADO ---");
    console.log("Datos actuales:", { name, price, quantity, selectedCat });

    // Validaciones explícitas
    if (!name) return showAlert("Falta el Nombre");
    if (!price) return showAlert("Falta el Precio");
    if (!quantity) return showAlert("Falta la Cantidad (Stock)");
    if (!selectedCat) return showAlert("Falta seleccionar una Categoría");

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      showAlert("Sesión perdida. Vuelve a loguearte.");
      return;
    }

    setLoading(true);
    try {
      console.log("Enviando a Firebase...");
      
      await addDoc(collection(db, "products"), {
        name: name,
        price: parseFloat(price),
        stock: parseInt(quantity),
        category: selectedCat,
        image: null, 
        description: desc,
        createdAt: serverTimestamp(),
        userId: user.uid, 
      });
      
      console.log("¡Éxito!");
      // Usamos alert normal para web por si acaso
      if (Platform.OS === 'web') {
        alert(`¡Guardado! ${quantity} unidades agregadas.`);
      } else {
        Alert.alert("¡Éxito!", "Producto guardado correctamente.");
      }
      
      router.back(); 

    } catch (e: any) {
      console.error("Error FATAL al guardar:", e);
      showAlert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper para mostrar alertas en Web y Móvil
  const showAlert = (msg: string) => {
    console.log("ALERTA:", msg);
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert("Atención", msg);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo Producto</Text>
      </View>

      {/* INPUT: NOMBRE */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre del Producto *</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="Ej: Camisa Polo Azul" 
        />
      </View>

      {/* FILA: PRECIO Y CANTIDAD */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
          <Text style={styles.label}>Precio (Q) *</Text>
          <TextInput 
            style={styles.input} 
            value={price} 
            onChangeText={setPrice} 
            keyboardType="numeric" 
            placeholder="0.00" 
          />
        </View>
        
        <View style={[styles.inputGroup, {flex: 1}]}>
          <Text style={styles.label}>Cantidad *</Text>
          <TextInput 
            style={styles.input} 
            value={quantity} 
            onChangeText={setQuantity} 
            keyboardType="numeric" 
            placeholder="Ej: 10" 
          />
        </View>
      </View>

      {/* SELECTOR DE CATEGORÍA */}
      <View style={styles.inputGroup}>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 10}}>
           <Text style={styles.label}>Categoría *</Text>
           <TouchableOpacity onPress={() => router.push('/admin/create-category')}>
              <Text style={{color: '#007AFF', fontWeight:'bold', fontSize: 14}}>+ Crear Nueva</Text>
           </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{minHeight: 50}}>
          {categories.length === 0 ? (
             <Text style={{color:'#999', fontStyle:'italic', paddingVertical: 10}}>
               ⚠️ No hay categorías. Crea una primero.
             </Text>
          ) : (
             categories.map((cat) => (
               <TouchableOpacity 
                 key={cat.id} 
                 style={[styles.catChip, selectedCat === cat.name && styles.catChipActive]}
                 onPress={() => selectCategory(cat.name)}
               >
                 <Text style={[styles.catText, selectedCat === cat.name && styles.catTextActive]}>
                   {cat.name}
                 </Text>
               </TouchableOpacity>
             ))
          )}
        </ScrollView>
        {/* Feedback visual si no ha seleccionado */}
        {!selectedCat && categories.length > 0 && (
          <Text style={{color: 'red', fontSize: 12, marginTop: 5}}>Debes tocar una categoría</Text>
        )}
      </View>

      {/* INPUT: DESCRIPCIÓN */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Notas / Descripción</Text>
        <TextInput 
          style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
          value={desc} 
          onChangeText={setDesc} 
          multiline 
          placeholder="Detalles opcionales..." 
        />
      </View>

      {/* BOTÓN GUARDAR */}
      <TouchableOpacity 
        style={[styles.saveBtn, loading && {backgroundColor: '#666'}]} 
        onPress={handleSave} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Guardar Producto</Text>
        )}
      </TouchableOpacity>
      
      <View style={{height: 50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#F0F0F0', borderRadius: 12, marginRight: 15 },
  title: { fontSize: 22, fontWeight: 'bold' },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 15, fontSize: 16 },
  row: { flexDirection: 'row' },
  
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 10, borderWidth: 1, borderColor: '#ddd' },
  catChipActive: { backgroundColor: '#000', borderColor: '#000' },
  catText: { color: '#333', fontWeight: '600' },
  catTextActive: { color: '#fff' },

  saveBtn: { backgroundColor: '#000', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});