import React, { useEffect, useState } from 'react';
import { 
  View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking, Platform, ToastAndroid 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

// --- FIREBASE ---
import { doc, getDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 
import { db } from '../../firebaseConfig';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  // Verificamos usuario actual
  const auth = getAuth();
  const user = auth.currentUser;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);

  // 1. CARGAR DATOS DEL PRODUCTO
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          Alert.alert("Error", "Este producto ya no existe.");
          router.back();
        }
      } catch (e) {
        console.error("Error cargando producto:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // 2. FUNCIÓN BORRAR
  const handleDelete = async () => {
    Alert.alert(
      "Eliminar del Inventario",
      "¿Seguro que quieres borrarlo? No se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, Borrar", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "products", id as string));
              Alert.alert("Listo", "Producto eliminado.");
              router.replace('/(tabs)'); 
            } catch (e) {
              Alert.alert("Error", "No se pudo borrar.");
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // 3. FUNCIÓN COPIAR PARA FACEBOOK
  const copyForMarketplace = async () => {
    if (!product) return;
    const precioSugerido = product.price + 50; // Sugerencia de ganancia
    const textToCopy = `🔥 ${product.name} 🔥\n\n✅ ${product.description || 'Excelente calidad'}\n\n💰 Precio: Q${precioSugerido} (Negociable)\n🚚 Entrega inmediata\n\n¡Mándame mensaje para coordinar!`;
    
    await Clipboard.setStringAsync(textToCopy);

    if (Platform.OS === 'android') {
      ToastAndroid.show('¡Texto copiado!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copiado', 'Listo para pegar en Marketplace');
    }
  };

  // 4. FUNCIÓN REGISTRAR VENTA
  const handleBuyNow = async () => {
    if (!product) return;
    
    if (!user) {
      Alert.alert("Atención", "Debes iniciar sesión para registrar ventas.");
      router.push('/login'); 
      return;
    }

    setProcessingOrder(true);
    try {
      // Crear el pedido en Firebase (Estado PENDIENTE)
      const orderRef = await addDoc(collection(db, "orders"), {
        items: [{
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image || null
        }],
        total: product.price,
        status: "PENDIENTE", 
        createdAt: serverTimestamp(),
        method: "Venta Directa",
        userId: user.uid,
        userEmail: user.email,
      });

      // Abrir WhatsApp con el reporte
      const myNumber = "50200000000"; // PON TU NÚMERO AQUÍ
      const message = `Hola, registré una venta de: ${product.name}. (Ref: ${orderRef.id})`;
      const url = `whatsapp://send?phone=${myNumber}&text=${encodeURIComponent(message)}`;

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://wa.me/${myNumber}?text=${encodeURIComponent(message)}`);
      }
      
    } catch (error) {
      Alert.alert("Error", "No se pudo registrar la venta.");
    } finally {
      setProcessingOrder(false);
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

  // Lógica de Stock
  const stock = product.stock || 0;
  const isOutOfStock = stock === 0;

  // Verificamos si soy el dueño (para mostrar botones de editar/borrar)
  const isOwner = user?.uid === product.userId;

  return (
    <View style={styles.container}>
      {/* HEADER PERSONALIZADO CON BOTONES DE EDICIÓN */}
      <Stack.Screen 
        options={{ 
          title: 'Detalle', 
          headerBackTitle: 'Volver', 
          headerTintColor: '#000',
          headerRight: () => isOwner ? (
            <View style={{flexDirection: 'row', gap: 15, alignItems: 'center'}}>
              {/* EDITAR */}
              <TouchableOpacity onPress={() => router.push({
                pathname: "/admin/edit/[id]",
                params: { id: id as string }
              })}>
                <Ionicons name="create-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              
              {/* BORRAR */}
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            </View>
          ) : null
        }} 
      />

      <ScrollView contentContainerStyle={{paddingBottom: 120}} showsVerticalScrollIndicator={false}>
        <Image 
          source={{ uri: product.image || 'https://placehold.co/400x400.png' }} 
          style={styles.image} 
          resizeMode="cover" 
        />
        
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.category}>{product.category || 'General'}</Text>
            
            {/* ETIQUETA DE STOCK */}
            <View style={[styles.stockBadge, isOutOfStock ? {backgroundColor:'#ffebee'} : {backgroundColor:'#e8f5e9'}]}>
                <Text style={[styles.stockText, isOutOfStock ? {color:'red'} : {color:'green'}]}>
                    {isOutOfStock ? 'AGOTADO' : `Stock: ${stock}`}
                </Text>
            </View>
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>Q{product.price ? product.price.toFixed(2) : '0.00'}</Text>

          {/* BOTÓN COPIAR */}
          <TouchableOpacity style={styles.copyBtn} onPress={copyForMarketplace}>
            <Ionicons name="copy-outline" size={18} color="#1877F2" />
            <Text style={styles.copyText}>Copiar datos para Marketplace</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{product.description || 'Sin descripción disponible.'}</Text>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity 
            style={[styles.btnFill, isOutOfStock && {backgroundColor: '#ccc'}]} 
            onPress={handleBuyNow} 
            disabled={processingOrder || isOutOfStock}
        >
          {processingOrder ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.btnText}>
                  {isOutOfStock ? 'Sin Stock' : 'Registrar Venta (WhatsApp)'}
              </Text>
              {!isOutOfStock && <Ionicons name="logo-whatsapp" size={20} color="white" style={{marginLeft: 10}} />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 300, backgroundColor: '#f0f0f0' },
  content: { padding: 20 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  category: { fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  
  stockBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  stockText: { fontWeight: 'bold', fontSize: 12 },

  name: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  price: { fontSize: 22, fontWeight: '800', color: '#000', marginBottom: 20 },
  
  copyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E7F3FF', padding: 12, borderRadius: 12, marginBottom: 25 },
  copyText: { color: '#1877F2', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  description: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 30 },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#f0f0f0' },
  btnFill: { backgroundColor: '#000', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 16 },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});