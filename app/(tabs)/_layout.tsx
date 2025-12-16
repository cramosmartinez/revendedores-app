import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false, // Ocultamos el encabezado gris por defecto
      tabBarActiveTintColor: '#000', // Color del icono activo (Negro)
      tabBarInactiveTintColor: '#999', // Color del icono inactivo (Gris)
      tabBarStyle: {
        height: 60,
        paddingBottom: 10,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 0, // Quitar sombra en Android para look limpio
        shadowOpacity: 0, // Quitar sombra en iOS
      },
      tabBarShowLabel: false, // Ocultamos el texto (solo iconos) para que se vea moderno
    }}>
      
      {/* PESTAÑA 1: INVENTARIO */}
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Inventario',
          tabBarIcon: ({ color, focused }) => (
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
               <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
            </View>
          ),
        }} 
      />

      {/* PESTAÑA 2: PERFIL */}
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
               <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
          ),
        }} 
      />

    </Tabs>
  );
}