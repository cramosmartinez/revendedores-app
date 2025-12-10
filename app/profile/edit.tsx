import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, Platform 
} from 'react-native';
import { useRouter, Stack } from 'expo-router'; // <-- Importa Stack
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// --- FIREBASE ---
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, updateProfile } from 'firebase/auth';
import { db, storage } from '../../firebaseConfig'; 

export default function EditProfileScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');

  // 1. CARGAR DATOS EXISTENTES
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setBusinessName(data.businessName || '');
          setPhone(data.phone || '');
          setPhoto(data.photoURL || '');
        } else {
          setBusinessName(user.displayName || '');
          setPhoto(user.photoURL || '');
        }
      } catch (e) {
        console.log("Error cargando perfil", e);
      }
    };
    loadData();
  }, []);

  // 2. ELEGIR LOGO DESDE GALERÍA
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  // 3. GUARDAR CAMBIOS
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let finalPhotoUrl = photo;

      if (photo && !photo.startsWith('http')) {
        const response = await fetch(photo);
        const blob = await response.blob();
        const filename = `profiles/${user.uid}.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        finalPhotoUrl = await getDownloadURL(storageRef);
      }

      await updateProfile(user, {
        displayName: businessName,
        photoURL: finalPhotoUrl
      });

      await setDoc(doc(db, "users", user.uid), {
        businessName: businessName,
        phone: phone,
        photoURL: finalPhotoUrl,
        email: user.email,
        updatedAt: new Date()
      }, { merge: true });

      if (Platform.OS === 'web') {
        alert("¡Perfil Actualizado Correctamente!");
      } else {
        Alert.alert("¡Éxito!", "Tu perfil de negocio se ha actualizado.");
      }

      // CORRECCIÓN: NAVEGACIÓN SEGURA
      router.replace('/(tabs)/profile');

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar el perfil. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* SOLUCIÓN: CONFIGURACIÓN DEL ENCABEZADO */}
      <Stack.Screen 
        options={{ 
          title: 'Editar Perfil', 
          headerBackTitle: 'Volver', 
          headerTitleStyle: { fontWeight: 'bold' } 
        }} 
      />
      
      {/* Contenido de la Pantalla */}
      <View style={{paddingTop: 20}}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Ionicons name="camera" size={40} color="#fff" />
              </View>
            )}
            <View style={styles.editIcon}>
              <Ionicons name="pencil" size={14} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.hint}>Toca para cambiar logo</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Negocio</Text>
            <TextInput 
              style={styles.input} 
              value={businessName} 
              onChangeText={setBusinessName} 
              placeholder="Ej: Zapatos Juan"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono de Contacto</Text>
            <TextInput 
              style={styles.input} 
              value={phone} 
              onChangeText={setPhone} 
              placeholder="Ej: 5555-5555"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#f0f0f0' },
  placeholderAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#000', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white' },
  hint: { marginTop: 10, color: '#999', fontSize: 12 },

  form: { marginTop: 10 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 15, fontSize: 16 },
  
  saveBtn: { backgroundColor: '#000', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});