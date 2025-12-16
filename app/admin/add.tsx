import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Button 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from "expo-camera"; // Importamos la cámara nueva

// --- FIREBASE ---
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig'; 

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Campos del Producto
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('General');
  const [desc, setDesc] = useState('');
  const [barcode, setBarcode] = useState(''); // <-- NUEVO: Código de Barras

  // Estados de la Cámara
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // 1. PEDIR PERMISOS DE CÁMARA
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getCameraPermissions();
  }, []);

  // 2. FUNCIÓN AL ESCANEAR
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setBarcode(data); // Guardamos el código leído
    setShowCamera(false); // Cerramos la cámara
    Alert.alert("¡Escaneado!", `Código: ${data}`);
  };

  // 3. GUARDAR PRODUCTO
  const handleSave = async () => {
    if (!name || !price || !quantity) {
      Alert.alert("Faltan datos", "Nombre, precio y cantidad son obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, "products"), {
        userId: user.uid,
        name: name.trim(),
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : 0,
        stock: parseInt(quantity),
        category: category,
        description: desc,
        barcode: barcode, // <-- GUARDAMOS EL CÓDIGO
        image: '', 
        createdAt: serverTimestamp()
      });

      Alert.alert("¡Éxito!", "Producto agregado al inventario.");
      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Nuevo Producto', 
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />

      {/* FORMULARIO */}
      <View style={{paddingTop: 20}}>
        
        {/* SECCIÓN CÓDIGO DE BARRAS */}
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Código de Barras</Text>
            <View style={{flexDirection: 'row', gap: 10}}>
                <TextInput 
                    style={[styles.input, {flex: 1}]} 
                    value={barcode} 
                    onChangeText={setBarcode} 
                    placeholder="Escanear o escribir..."
                />
                <TouchableOpacity 
                    style={styles.scanBtn} 
                    onPress={() => {
                        setScanned(false);
                        setShowCamera(true);
                    }}
                >
                    <Ionicons name="qr-code-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Producto</Text>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="Ej: Zapatos Nike Air"
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
              placeholder="0.00"
            />
          </View>
          <View style={[styles.inputGroup, {flex: 1}]}>
            <Text style={styles.label}>Costo (Q)</Text>
            <TextInput 
              style={styles.input} 
              value={cost} 
              onChangeText={setCost} 
              keyboardType="numeric" 
              placeholder="0.00"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
            <Text style={styles.label}>Cantidad Inicial</Text>
            <TextInput 
              style={styles.input} 
              value={quantity} 
              onChangeText={setQuantity} 
              keyboardType="numeric" 
              placeholder="0"
            />
          </View>
          <View style={[styles.inputGroup, {flex: 1}]}>
            <Text style={styles.label}>Categoría</Text>
            <TextInput 
              style={styles.input} 
              value={category} 
              onChangeText={setCategory} 
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput 
            style={[styles.input, {height: 60}]} 
            value={desc} 
            onChangeText={setDesc} 
            multiline 
          />
        </View>

        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleSave} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar Producto</Text>}
        </TouchableOpacity>
      </View>
      
      {/* MODAL DE CÁMARA */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraContainer}>
            {hasPermission === null ? (
                <Text>Solicitando permisos...</Text>
            ) : hasPermission === false ? (
                <Text>Sin acceso a la cámara</Text>
            ) : (
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e"], 
                    }}
                />
            )}
            
            {/* Botón Cerrar Cámara */}
            <TouchableOpacity 
                style={styles.closeCameraBtn} 
                onPress={() => setShowCamera(false)}
            >
                <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            {/* Cuadro guía visual */}
            <View style={styles.scanFrame} />
        </View>
      </Modal>

      <View style={{height: 50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 15, fontSize: 16 },
  row: { flexDirection: 'row' },
  
  scanBtn: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 12 },
  saveBtn: { backgroundColor: '#000', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

  // Estilos Cámara
  cameraContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  closeCameraBtn: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#00FF00', backgroundColor: 'transparent' }
});