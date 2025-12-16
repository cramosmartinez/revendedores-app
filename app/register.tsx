import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Asegúrate de que la ruta sea correcta

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Faltan datos', 'Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      // 1. Crear Usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Actualizar nombre visible
      await updateProfile(user, { displayName: name });

      // 3. Crear documento en Firestore (IMPORTANTE para el Perfil)
      await setDoc(doc(db, "users", user.uid), {
        businessName: name, // Usamos el nombre como negocio por defecto
        email: email,
        phone: '',
        photoURL: '',
        createdAt: serverTimestamp()
      });

      Alert.alert("¡Bienvenido!", "Cuenta creada exitosamente.");
      router.replace('/(tabs)');

    } catch (error: any) {
      let msg = "No se pudo registrar.";
      if (error.code === 'auth/email-already-in-use') msg = "Ese correo ya está registrado.";
      if (error.code === 'auth/weak-password') msg = "La contraseña debe tener al menos 6 caracteres.";
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* OCULTAR BARRA SUPERIOR */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerContainer}>
         <Text style={styles.appTitle}>Crea tu Cuenta</Text>
         <Text style={styles.appSub}>Empieza a controlar tu negocio hoy</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Negocio / Tu Nombre</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej: Tienda de Carlos" 
              placeholderTextColor="#aaa"
              value={name} 
              onChangeText={setName} 
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput 
              style={styles.input} 
              placeholder="correo@ejemplo.com" 
              placeholderTextColor="#aaa"
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none"
              keyboardType="email-address"
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput 
              style={styles.input} 
              placeholder="******" 
              placeholderTextColor="#aaa"
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry
            />
        </View>

        <TouchableOpacity 
          style={styles.registerBtn} 
          onPress={handleRegister} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerText}>Registrarme</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
            onPress={() => router.back()}
            style={{marginTop: 20, alignItems: 'center'}}
        >
            <Text style={{color: '#666'}}>¿Ya tienes cuenta? <Text style={{fontWeight: 'bold', color: '#007AFF'}}>Inicia Sesión</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#333', justifyContent: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 30, marginTop: 50 },
  appTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  appSub: { fontSize: 14, color: '#ccc', marginTop: 5, textAlign: 'center' },

  card: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    padding: 30, 
    flex: 1, // Ocupa el resto de la pantalla
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 10
  },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, color: '#666', marginBottom: 5, textTransform: 'uppercase', fontWeight: '600' },
  input: { 
    borderWidth: 1, borderColor: '#eee', backgroundColor: '#F9F9F9', 
    borderRadius: 12, padding: 15, fontSize: 16, color: '#333' 
  },
  
  registerBtn: { 
    backgroundColor: '#007AFF', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10,
    shadowColor: "#000", shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, elevation: 5
  },
  registerText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});