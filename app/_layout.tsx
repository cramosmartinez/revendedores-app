import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { CartProvider } from "../context/CartContext"; // Ajusta la ruta según donde lo creaste
// Evita que el splash screen desaparezca antes de cargar
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  
  useEffect(() => {
    // Aquí podrías cargar fuentes si quisieras.
    // Por ahora solo ocultamos el splash screen inmediatamente.
    SplashScreen.hideAsync();
  }, []);

  return (
    <CartProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </CartProvider>
  );
}