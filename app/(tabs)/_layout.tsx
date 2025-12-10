import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme'; // O tus imports actuales

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF', // Color activo (azul)
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}>
      
      {/* TAB 1: CATÁLOGO */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="grid" color={color} />,
        }}
      />

      {/* TAB 2: PERFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Mi Negocio',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person" color={color} />,
        }}
      />

      {/* SI TIENES EL ARCHIVO explore.tsx, BÓRRALO DE LA CARPETA TAMBIÉN */}
    </Tabs>
  );
}