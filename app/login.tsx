import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// --- FIREBASE ---
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
// No necesitamos 'db' aquí, así que lo quitamos para limpiar

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  const auth = getAuth(); 

  // 1. VERIFICAR SI YA ESTÁ LOGUEADO
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // CORRECCIÓN CLAVE: Mandamos a la raíz '/', no a '(tabs)'
        router.replace('/'); 
      }
      setCheckingUser(false);
    });
    return unsubscribe;
  }, []);

  // 2. FUNCIÓN DE LOGIN
  const handleLogin = async () => {
    if (email.length === 0 || password.length === 0) {
      Alert.alert("Error", "Por favor ingresa correo y contraseña");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // El onAuthStateChanged de arriba se encargará de redirigir,
      // pero por seguridad lo hacemos aquí también si pasa rápido.
      // router.replace('/'); <--- Ya lo hace el efecto, pero no estorba.
    } catch (error: any) {
      setLoading(false);
      console.error(error);
      let msg = "Error al iniciar sesión";
      if (error.code === 'auth/invalid-credential') msg = "Correo o contraseña incorrectos.";
      if (error.code === 'auth/invalid-email') msg = "El formato del correo no es válido.";
      if (error.code === 'auth/user-not-found') msg = "Usuario no encontrado.";
      if (error.code === 'auth/wrong-password') msg = "Contraseña incorrecta.";
      Alert.alert("Ups", msg);
    }
  };

  if (checkingUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      {/* HEADER CON IMAGEN DE FONDO */}
      <View style={styles.headerBackground}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=800&q=80' }} 
          style={styles.headerImage} 
        />
        <View style={styles.overlay} />
        <Text style={styles.title}>Revendedores Pro</Text>
        <Text style={styles.subtitle}>Tu negocio en tu bolsillo</Text>
      </View>

      {/* FORMULARIO */}
      <View style={styles.formContainer}>
        <Text style={styles.welcomeText}>Iniciar Sesión 🔐</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput 
            style={styles.input} 
            placeholder="ejemplo@correo.com"
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
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.loginBtn, loading && { backgroundColor: '#555' }]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>Ingresar</Text>
          )}
        </TouchableOpacity>

        {/* PIE DE PÁGINA (REGISTRO) */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>¿No tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.linkText}> Regístrate aquí</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerBackground: { height: '40%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  headerImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginTop: 20 },
  subtitle: { fontSize: 16, color: '#ddd', marginTop: 5 },
  
  formContainer: { flex: 1, backgroundColor: '#fff', marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, alignItems: 'center' },
  
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 30, alignSelf: 'flex-start' },
  
  inputGroup: { width: '100%', marginBottom: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#F5F6FA', padding: 15, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#EFEFEF' },
  
  loginBtn: { width: '100%', backgroundColor: '#111', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  loginText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  footerRow: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  footerText: { color: '#666', fontSize: 14 },
  linkText: { color: '#007AFF', fontSize: 14, fontWeight: 'bold', marginLeft: 5 }
});