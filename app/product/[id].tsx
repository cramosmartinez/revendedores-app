import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// CAMBIO IMPORTANTE: Importamos onSnapshot
import { doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 

const getColorForName = (name: string) => {
    if (!name) return '#333';
    const colors = ['#e55039', '#4a69bd', '#60a3bc', '#78e08f', '#f6b93b', '#b71540', '#0c2461'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. ESCUCHAR CAMBIOS EN TIEMPO REAL (onSnapshot)
  useEffect(() => {
    if (!id) return;

    const docRef = doc(db, "products", id as string);

    // Esta función se ejecuta AUTOMÁTICAMENTE cada vez que editas el producto
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            setProduct({ id: docSnap.id, ...docSnap.data() });
            setLoading(false);
        } else {
            // Si el producto se borró mientras lo mirabas
            if (!loading && Platform.OS !== 'web') {
                Alert.alert("Aviso", "El producto ha sido eliminado.");
                router.back();
            }
        }
    }, (error) => {
        console.error("Error escuchando producto:", error);
        setLoading(false);
    });

    // Limpiamos la conexión al salir de la pantalla
    return () => unsubscribe();
  }, [id]);

  const handleDelete = () => {
    // Lógica Web
    if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm("¿Eliminar permanentemente?")) performDelete();
    } 
    // Lógica Móvil
    else {
        Alert.alert("¿Eliminar?", "No podrás recuperarlo.", [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: 'destructive', onPress: performDelete }
        ]);
    }
  };

  const performDelete = async () => {
    try {
        setLoading(true); // Bloqueamos pantalla
        await deleteDoc(doc(db, "products", id as string));
        // router.replace envía al usuario al inicio y borra historial para que no pueda volver
        router.replace('/(tabs)'); 
    } catch (e) {
        console.error(e);
        setLoading(false);
        alert("Error al eliminar.");
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
  if (!product) return null;

  const initial = product.name ? product.name.charAt(0).toUpperCase() : '?';
  const headerColor = getColorForName(product.name);

  return (
    <>
      <Stack.Screen 
        options={{ 
            headerTitle: product.name,
            headerTintColor: '#000',
        }} 
      />

      <ScrollView style={styles.container} bounces={false}>
        <View style={[styles.headerImagePlaceholder, { backgroundColor: headerColor }]}>
            <Text style={styles.bigInitial}>{initial}</Text>
        </View>

        <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
                <View style={{flex: 1}}>
                    <Text style={styles.category}>{product.category || 'General'}</Text>
                    <Text style={styles.name}>{product.name}</Text>
                </View>
                <Text style={styles.price}>Q{product.price?.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Stock</Text>
                    {/* Aquí verás el cambio al instante */}
                    <Text style={[styles.detailValue, {color: product.stock < 3 ? '#e67e22' : '#333'}]}>
                        {product.stock} uds
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Costo</Text>
                    <Text style={styles.detailValue}>Q{product.cost?.toFixed(2) || '0.00'}</Text>
                </View>
            </View>

            {product.barcode ? (
                <View style={styles.barcodeContainer}>
                    <Ionicons name="barcode-outline" size={20} color="#666" />
                    <Text style={styles.barcodeText}>{product.barcode}</Text>
                </View>
            ) : null}

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{product.description || "Sin descripción."}</Text>

            <View style={{height: 40}} />

            <TouchableOpacity 
                style={styles.editBtn} 
                onPress={() => router.push(`/admin/edit/${id}`)}
                activeOpacity={0.7}
            >
                <Text style={styles.btnText}>Editar Producto</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={handleDelete}
                activeOpacity={0.7}
            >
                <Text style={[styles.btnText, {color: '#fff', fontWeight:'bold'}]}>Eliminar Producto</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerImagePlaceholder: { 
      width: '100%', height: 200, justifyContent: 'center', alignItems: 'center', zIndex: 1 
  },
  bigInitial: { fontSize: 80, fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' },
  
  contentContainer: { 
      flex: 1, backgroundColor: '#fff', marginTop: -20, borderTopLeftRadius: 30, borderTopRightRadius: 30, 
      padding: 25, paddingBottom: 50, zIndex: 10, position: 'relative'
  },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  category: { fontSize: 12, color: '#888', textTransform: 'uppercase', fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 4 },
  price: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 20 },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#888' },
  detailValue: { fontSize: 18, fontWeight: '600', color: '#333' },
  
  barcodeContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginTop: 15 },
  barcodeText: { fontSize: 14, color: '#555', fontFamily: 'monospace' },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  description: { fontSize: 15, color: '#666', lineHeight: 22 },
  
  editBtn: { backgroundColor: '#f1f2f6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  deleteBtn: { backgroundColor: '#ff4757', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '600', color: '#333' }
});