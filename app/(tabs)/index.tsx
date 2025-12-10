// ARCHIVO COMPLETO: app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator, Platform,
  Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';

// --- FIREBASE IMPORTS ---
import { collection, query, where, onSnapshot } from 'firebase/firestore'; 
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../firebaseConfig'; 

interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number;
  category: string;
  image: string;
  description?: string;
  cost?: number; // Aseguramos que el tipo Product incluya 'cost'
}

const CATEGORIES = ['Todos', 'Calzado', 'Ropa', 'Accesorios', 'Tech', 'Hogar'];

export default function HomeScreen() {
  const router = useRouter();
  
  const [selectedCat, setSelectedCat] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0); 

  // 1. FUNCIÓN AUXILIAR PARA OBTENER EL CONTEO DEL CARRITO
  const updateCartCount = useCallback(() => {
    const currentCart = (globalThis as any).cart || [];
    setCartCount(currentCart.length);
  }, []);
  
  // 2. EFECTO PRINCIPAL (Carga de Productos en Tiempo Real)
  useEffect(() => {
    const auth = getAuth();
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(true);
        
        const q = query(collection(db, "products"), where("userId", "==", user.uid));
        
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const list: Product[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as Product);
          });
          setProducts(list);
          setLoading(false);
        }, (error) => {
          console.error("Error en tiempo real:", error);
          setLoading(false);
        });

      } else {
        setProducts([]);
        setLoading(false);
      }
    });

    // Limpieza
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // 3. EFECTO CLAVE: Se ejecuta al entrar o volver a la pantalla (Fuerza la visibilidad del carrito)
  useFocusEffect(
    useCallback(() => {
      updateCartCount(); 
    }, [updateCartCount])
  );


  // 4. FUNCIÓN PARA AÑADIR A CARRITO (CORREGIDA)
  const handleAddToCart = (product: Product) => {
    // Si no tiene costo, no lo vendemos todavía para evitar errores de contabilidad
    if (product.cost === undefined || product.cost === null) {
        Alert.alert("Añadir Costo", "Por favor edita el producto y agrega su costo antes de venderlo.");
        return;
    }

    const currentCart = (globalThis as any).cart || [];
    
    const itemToAdd = {
        id: product.id,
        name: product.name,
        price: product.price,
        cost: product.cost,
        quantity: 1,
        total: product.price
    };
    currentCart.push(itemToAdd);
    (globalThis as any).cart = currentCart;
    
    // Sincroniza el contador inmediatamente para forzar el renderizado
    setCartCount(currentCart.length); 
    
    // Opcional: vibración para feedback al usuario
    // if (Platform.OS !== 'web') {
    //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // }
  };

  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCat === 'Todos' || product.category === selectedCat;
    const nameMatch = product.name ? product.name.toLowerCase().includes(searchText.toLowerCase()) : false;
    return categoryMatch && nameMatch;
  });

  const renderProduct = ({ item }: { item: Product }) => {
    const stock = item.stock || 0;
    const isLowStock = stock > 0 && stock < 3;
    const isOut = stock === 0;

    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        onPress={() => router.push(`/product/${item.id}`)}
        activeOpacity={0.9}
        disabled={isOut}
      >
        <View style={styles.card}>
          <Image 
            source={{ uri: item.image || 'https://placehold.co/400x400.png' }} 
            style={styles.image} 
            resizeMode="cover" 
          />
          <View style={styles.info}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems: 'center'}}>
               <Text style={styles.categoryTag}>{item.category}</Text>
               <Text style={[
                  styles.stockTag, 
                  isLowStock && {color: 'orange'}, 
                  isOut && {color: 'red', fontWeight:'bold'}
               ]}>
                 {isOut ? 'AGOTADO' : `${stock} uds.`}
               </Text>
            </View>
            <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.price}>Q{item.price.toFixed(2)}</Text>
              
              {/* BOTÓN PARA AÑADIR A CARRITO */}
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation(); // Evita que se abra la pantalla de detalle
                  handleAddToCart(item);
                }}
                style={styles.addToCartBtn}
                disabled={isOut}
              >
                  <Ionicons name="cart-outline" size={24} color={isOut ? '#ccc' : '#000'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
            <Text style={styles.welcomeTitle}>Mi Inventario 📦</Text>
            <Text style={styles.welcomeSub}>Control de Stock</Text>
        </View>
        {/* BOTÓN AÑADIR PRODUCTO */}
        <TouchableOpacity onPress={() => router.push('/admin/add')} style={styles.addMainBtn}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput 
            placeholder="Buscar..." 
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Categorías */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => setSelectedCat(cat)}
              style={[styles.catChip, selectedCat === cat && styles.catChipActive]}>
              <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
               <Ionicons name="cube-outline" size={60} color="#ccc" />
               <Text style={styles.emptyText}>Inventario vacío.</Text>
            </View>
          }
        />
      )}

      {/* BOTÓN FLOTANTE "CERRAR VENTA" */}
      {cartCount > 0 && (
          <TouchableOpacity 
              onPress={() => router.push('/admin/sell' as any)} 
              style={styles.sellFloatingBtn}
          >
              <Ionicons name="wallet-outline" size={24} color="white" />
              <Text style={styles.sellFloatingText}>Cerrar Venta ({cartCount})</Text>
          </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, alignItems: 'center', justifyContent: 'space-between' },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  welcomeSub: { fontSize: 14, color: '#666' },
  addMainBtn: { backgroundColor: '#000', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', elevation: 5 },
  
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16 },
  
  catScroll: { paddingHorizontal: 20, marginBottom: 15 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#eee' },
  catChipActive: { backgroundColor: '#333', borderColor: '#333' },
  catText: { color: '#666', fontWeight: '600' },
  catTextActive: { color: '#fff' },
  
  listContent: { paddingHorizontal: 15, paddingBottom: 100 }, 
  row: { justifyContent: 'space-between' },
  cardContainer: { width: '48%', marginBottom: 15 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  image: { width: '100%', height: 120, backgroundColor: '#eee' },
  info: { padding: 12 },
  categoryTag: { fontSize: 10, color: '#888', textTransform: 'uppercase', marginBottom: 2 },
  stockTag: { fontSize: 10, color: '#666', fontWeight:'600' },
  prodName: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, fontWeight: '800', color: '#2ecc71' },
  addToCartBtn: { padding: 5 },
  
  emptyState: { alignItems: 'center', marginTop: 50, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 15 },

  // --- ESTILOS FLOTANTES ---
  sellFloatingBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#007AFF', 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  sellFloatingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  }
});