import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// --- FIREBASE ---
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, updateProfile } from 'firebase/auth';
import { db, storage } from '../../../firebaseConfig'; 

export default function EditProfileScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');

  // 1. Cargar datos existentes
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      // Intentamos leer datos previos de la colección 'users'
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setBusinessName(data.businessName || '');
        setPhone(data.phone || '');
        setPhoto(data.photoURL || '');
      } else {
        // Si no hay datos en DB, usamos los básicos del Auth
        setBusinessName(user.displayName || '');
        setPhoto(user.photoURL || '');
      }
    };
    loadData();
  }, []);

  // 2. Elegir Logo
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Cuadrado para perfil
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  // 3. Guardar Todo
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let finalPhotoUrl = photo;

      // Si la foto es nueva (viene del celular), hay que subirla
      if (photo && !photo.startsWith('http')) {
        const response = await fetch(photo);
        const blob = await response.blob();
        const filename = `profiles/${user.uid}.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        finalPhotoUrl = await getDownloadURL(storageRef);
      }

      // A. Actualizar Perfil Básico de Auth (Nombre y Foto)
      await updateProfile(user, {
        displayName: businessName,
        photoURL: finalPhotoUrl
      });

      // B. Guardar datos extra en Firestore (Teléfono, Nombre Negocio)
      await setDoc(doc(db, "users", user.uid), {
        businessName: businessName,
        phone: phone,
        photoURL: finalPhotoUrl,
        email: user.email
      }, { merge: true }); // 'merge' para no borrar otros datos si existieran

      Alert.alert("¡Perfil Actualizado!", "Tu negocio se ve genial ahora.");
      router.back();

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
      </View>

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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar Cambios</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#F0F0F0', borderRadius: 12, marginRight: 15 },
  title: { fontSize: 22, fontWeight: 'bold' },
  
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