import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Evita que la pantalla de carga se oculte antes de estar listo
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack>
      {/* Definimos que existe un grupo de pestañas (tabs) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Si tienes login, iría aquí también: <Stack.Screen name="(auth)" options={{ headerShown: false }} /> */}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}