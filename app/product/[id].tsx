import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';

// --- FIREBASE IMPORTS ---
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Importamos la conexión que acabas de crear

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams(); // Capturamos el ID que viene de la lista
  const router = useRouter();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // EFECTO: Buscar el producto en la nube
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        // Referencia al documento específico en la colección "products"
        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Si existe, guardamos sus datos en el estado
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          Alert.alert("Error", "Este producto ya no existe.");
          router.back();
        }
      } catch (e) {
        console.error("Error cargando producto:", e);
        Alert.alert("Error", "No se pudo conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product);
      Alert.alert("¡Listo!", "Producto agregado al carrito");
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!product) return null;

  return (
    <View style={styles.container}>
      {/* Título dinámico en la barra superior */}
      <Stack.Screen options={{ title: product.name || 'Detalle', headerBackTitle: 'Volver', headerTintColor: '#000' }} />

      <ScrollView>
        {/* Imagen (con fallback por si no tiene) */}
        <Image 
          source={{ uri: product.image || 'https://via.placeholder.com/400' }} 
          style={styles.image} 
          resizeMode="cover" 
        />
        
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.category}>{product.category || 'General'}</Text>
            <View style={styles.priceTag}>
              <Text style={styles.price}>Q{product.price ? product.price.toFixed(2) : '0.00'}</Text>
            </View>
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.description}>{product.description || 'Sin descripción disponible.'}</Text>

          <View style={styles.extraInfo}>
            <View style={styles.infoBox}>
              <Ionicons name="time-outline" size={24} color="#666" />
              <Text style={styles.infoText}>Entrega 24h</Text>
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
              <Text style={styles.infoText}>Garantía</Text>
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="star-outline" size={24} color="#666" />
              <Text style={styles.infoText}>4.8/5</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botón Flotante */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={handleAddToCart}>
          <Text style={styles.btnText}>Agregar - Q{product.price ? product.price.toFixed(2) : '0'}</Text>
          <Ionicons name="cart" size={20} color="white" style={{marginLeft: 10}} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 350, backgroundColor: '#f0f0f0' },
  content: { padding: 20, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  category: { fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  priceTag: { backgroundColor: '#F0F9F4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  price: { fontSize: 20, fontWeight: 'bold', color: '#2ecc71' },
  name: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  description: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 30 },
  extraInfo: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 20 },
  infoBox: { alignItems: 'center', flex: 1 },
  infoText: { marginTop: 5, color: '#666', fontSize: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#f0f0f0' },
  btn: { backgroundColor: '#000', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 16 },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});