import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// --- FIREBASE ---
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (name.length === 0 || email.length === 0 || password.length === 0) {
      Alert.alert("Faltan datos", "Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    const auth = getAuth();

    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Actualizar el "Display Name" (Nombre visible)
      await updateProfile(user, {
        displayName: name
      });

      Alert.alert("¡Bienvenido!", "Tu cuenta ha sido creada exitosamente.");
      // No necesitamos navegar manualmente, el onAuthStateChanged del Login detectará la sesión y redirigirá.
    } catch (error: any) {
      setLoading(false);
      let msg = "No se pudo crear la cuenta.";
      if (error.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado.";
      if (error.code === 'auth/weak-password') msg = "La contraseña debe tener al menos 6 caracteres.";
      if (error.code === 'auth/invalid-email') msg = "El correo no es válido.";
      Alert.alert("Error", msg);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      {/* Botón Volver */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete al equipo de revendedores</Text>
        </View>

        <View style={styles.formContainer}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej: Juan Pérez"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput 
              style={styles.input} 
              placeholder="ejemplo@correo.com"
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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.btn, loading && { backgroundColor: '#555' }]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Registrarme</Text>}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10, backgroundColor: '#F5F5F5', borderRadius: 20 },
  scrollContent: { paddingHorizontal: 30, paddingTop: 100, paddingBottom: 50 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#333', marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: '#F5F6FA', padding: 15, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#EFEFEF' },
  btn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20, shadowColor: '#007AFF', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});