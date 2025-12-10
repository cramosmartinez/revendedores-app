import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, Linking 
} from 'react-native';
import { useRouter, Stack } from 'expo-router'; // <-- Importa Stack
import { Ionicons } from '@expo/vector-icons';

// --- FIREBASE ---
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig'; 

export default function ClientsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showForm, setShowForm] = useState(false);

  // 1. CARGAR CLIENTES EN TIEMPO REAL
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "clients"), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      setClients(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. GUARDAR CLIENTE
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Falta el nombre", "Por favor escribe el nombre del cliente.");
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, "clients"), {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setName('');
      setPhone('');
      setAddress('');
      setShowForm(false);
      
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el cliente.");
    }
  };

  // 3. BORRAR CLIENTE
  const handleDelete = (id: string) => {
    Alert.alert(
      "Borrar Cliente",
      "¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Borrar", 
          style: "destructive", 
          onPress: async () => await deleteDoc(doc(db, "clients", id)) 
        }
      ]
    );
  };

  // Acciones rápidas (WhatsApp)
  const openWhatsApp = (num: string) => {
    if (!num) return;
    Linking.openURL(`https://wa.me/${num.replace(/\D/g,'')}`);
  };

  const renderClient = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={{flex: 1}}>
        <Text style={styles.clientName}>{item.name}</Text>
        {item.phone ? (
          <TouchableOpacity onPress={() => openWhatsApp(item.phone)}>
             <Text style={styles.clientPhone}>📞 {item.phone}</Text>
          </TouchableOpacity>
        ) : null}
        {item.address ? <Text style={styles.clientAddress}>📍 {item.address}</Text> : null}
      </View>
      
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* SOLUCIÓN: CONFIGURACIÓN DEL ENCABEZADO */}
      <Stack.Screen 
        options={{ 
          title: 'Directorio de Clientes', 
          headerBackTitle: 'Volver', 
          headerTitleStyle: { fontWeight: 'bold' } 
        }} 
      />
      
      {/* Contenido de la Pantalla */}
      <View style={[styles.header, {marginTop: 0}]}>
        <Text style={styles.title}>Mis Clientes</Text>
        
        {/* Botón para abrir formulario */}
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addBtn}>
           <Ionicons name={showForm ? "close" : "add"} size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* FORMULARIO DESPLEGABLE */}
      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Nuevo Cliente</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Nombre (Ej: María Perez)" 
            value={name} 
            onChangeText={setName} 
            autoFocus
          />
          <View style={styles.row}>
            <TextInput 
              style={[styles.input, {flex: 1, marginRight: 10}]} 
              placeholder="WhatsApp (Opcional)" 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad"
            />
            <TextInput 
              style={[styles.input, {flex: 1}]} 
              placeholder="Dirección / Nota" 
              value={address} 
              onChangeText={setAddress} 
            />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Guardar Cliente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LISTA */}
      {loading ? (
        <ActivityIndicator style={{marginTop: 50}} color="#000" />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
          contentContainerStyle={{paddingBottom: 20}}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={{color: '#999', marginTop: 10}}>No tienes clientes guardados.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 20, justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#000', padding: 8, borderRadius: 12 },
  
  formContainer: { backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, elevation: 3 },
  formTitle: { fontWeight: 'bold', marginBottom: 10, color: '#333' },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 14 },
  row: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#27ae60', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveText: { color: 'white', fontWeight: 'bold' },

  card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  clientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  clientPhone: { color: '#007AFF', marginTop: 2, fontWeight: '500' },
  clientAddress: { color: '#666', fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 8 },
  
  empty: { alignItems: 'center', marginTop: 50 }
});