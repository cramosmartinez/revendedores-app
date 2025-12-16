import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

// Mantiene la pantalla de carga visible hasta que la app esté lista
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Ionicons.font, // Carga los iconos antes de iniciar
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <View />; // Pantalla vacía mientras carga
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Definimos las rutas principales sin encabezado global */}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* Las rutas de admin sí pueden tener encabezado automático o personalizado */}
      <Stack.Screen name="admin/add" options={{ presentation: 'modal' }} />
    </Stack>
  );
}