import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000', // Color activo (negro)
        tabBarInactiveTintColor: '#ccc', // Color inactivo (gris)
        tabBarStyle: {
            height: 60, // Altura cómoda
            paddingBottom: 10,
            paddingTop: 10,
        },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600'
        }
      }}>
      
      {/* BOTÓN 1: CATÁLOGO */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "grid" : "grid-outline"} color={color} />
          ),
        }}
      />

      {/* BOTÓN 2: PERFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Mi Negocio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "person" : "person-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}