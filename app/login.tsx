import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter, Stack } from 'expo-router'; // <-- Importamos Stack
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa correo y contraseña');
      return;
    }
    
    setLoading(true);
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // El onAuthStateChanged en _layout o index se encargará de redirigir, 
      // pero por seguridad hacemos replace aquí también.
      router.replace('/(tabs)');
    } catch (error: any) {
      let msg = "No se pudo iniciar sesión.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') msg = "Correo o contraseña incorrectos.";
      if (error.code === 'auth/too-many-requests') msg = "Muchos intentos fallidos. Espera un momento.";
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
      {/* --- ESTA LÍNEA OCULTA EL ENCABEZADO FEO --- */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerContainer}>
         <Image 
            source={require('../assets/images/revendedores.png')} // Asegúrate de tener tu logo o usa un texto
            style={{width: 80, height: 80, marginBottom: 10, alignSelf:'center', opacity:0.8}}
            resizeMode="contain"
         />
         <Text style={styles.appTitle}>Revendedores Pro</Text>
         <Text style={styles.appSub}>Tu negocio en tu bolsillo</Text>
      </View>

      <View style={styles.card}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20}}>
            <Text style={styles.cardTitle}>Iniciar Sesión</Text>
            <Text style={{fontSize: 20, marginLeft: 5}}>🔐</Text>
        </View>

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
              placeholder="********" 
              placeholderTextColor="#aaa"
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry
            />
        </View>

        <TouchableOpacity 
          style={styles.loginBtn} 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>Ingresar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
            onPress={() => router.push('/register' as any)}
            style={{marginTop: 20, alignItems: 'center'}}
        >
            <Text style={{color: '#666'}}>¿No tienes cuenta? <Text style={{fontWeight: 'bold', color: '#007AFF'}}>Regístrate aquí</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#333', justifyContent: 'center' }, // Fondo oscuro elegante
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  appTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  appSub: { fontSize: 14, color: '#ccc', marginTop: 5, textAlign: 'center' },

  card: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    padding: 30, 
    height: '60%', // Ocupa la parte inferior
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 10
  },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, color: '#666', marginBottom: 5, textTransform: 'uppercase', fontWeight: '600' },
  input: { 
    borderWidth: 1, borderColor: '#eee', backgroundColor: '#F9F9F9', 
    borderRadius: 12, padding: 15, fontSize: 16, color: '#333' 
  },
  
  loginBtn: { 
    backgroundColor: '#000', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10,
    shadowColor: "#000", shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, elevation: 5
  },
  loginText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});