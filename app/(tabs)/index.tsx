import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator, Platform, Alert, Modal
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from "expo-camera"; // Importamos la cámara

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
  cost?: number; 
  barcode?: string; // <-- Nuevo campo
}

const CATEGORIES = ['Todos', 'Calzado', 'Ropa', 'Accesorios', 'Tech', 'Hogar'];

export default function HomeScreen() {
  const router = useRouter();
  
  const [selectedCat, setSelectedCat] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0); 

  // Estados de Cámara
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // 1. OBTENER CONTEO
  const updateCartCount = useCallback(() => {
    const currentCart = (globalThis as any).cart || [];
    setCartCount(currentCart.length);
  }, []);
  
  // 2. CARGA DE PRODUCTOS
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
          console.error("Error:", error);
          setLoading(false);
        });
      } else {
        setProducts([]);
        setLoading(false);
      }
    });

    // Pedir permisos de cámara al iniciar
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // 3. ACTUALIZAR AL ENFOCAR
  useFocusEffect(
    useCallback(() => {
      updateCartCount(); 
    }, [updateCartCount])
  );

  // 4. AÑADIR AL CARRITO
  const handleAddToCart = (product: Product) => {
    const productCost = product.cost !== undefined ? product.cost : 0;
    const currentCart = (globalThis as any).cart || [];
    
    const itemToAdd = {
        id: product.id,
        name: product.name,
        price: product.price,
        cost: productCost, 
        quantity: 1,
        total: product.price
    };
    
    currentCart.push(itemToAdd);
    (globalThis as any).cart = currentCart;
    
    setCartCount(currentCart.length);
  };

  // --- LÓGICA DEL ESCÁNER ---
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setShowCamera(false); // Cerrar cámara

    // Buscar producto por código
    const foundProduct = products.find(p => p.barcode === data);

    if (foundProduct) {
      // Si existe, añadir al carrito DIRECTAMENTE
      handleAddToCart(foundProduct);
      Alert.alert("¡Encontrado!", `${foundProduct.name} añadido al carrito. 🛒`);
    } else {
      Alert.alert("No encontrado", `El código ${data} no está en tu inventario.`);
    }

    // Resetear escáner después de unos segundos
    setTimeout(() => setScanned(false), 2000);
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
      >
        <View style={styles.card}>
          <Image 
            source={{ uri: item.image || 'https://placehold.co/400x400.png' }} 
            style={[styles.image, isOut && {opacity: 0.6}]} 
            resizeMode="cover" 
          />
          <View style={styles.info}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems: 'center', marginBottom: 4}}>
                <Text style={styles.categoryTag}>{item.category}</Text>
                <Text style={[
                    styles.stockTag, 
                    isLowStock && {color: '#e67e22'}, 
                    isOut && {color: '#e74c3c', fontWeight:'bold'}
                ]}>
                    {isOut ? 'AGOTADO' : `${stock} uds.`}
                </Text>
            </View>

            <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.price}>Q{item.price.toFixed(2)}</Text>
              
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation(); 
                  handleAddToCart(item);
                }}
                style={styles.addToCartBtn}
                disabled={isOut} 
              >
                  <Ionicons name="add-circle" size={32} color={isOut ? '#ccc' : '#000'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{flex: 1}}>
            <Text style={styles.welcomeTitle}>Inventario</Text>
            <Text style={styles.welcomeSub}>Selecciona para vender</Text>
        </View>
        
        <View style={{flexDirection: 'row', gap: 12}}>
            <TouchableOpacity 
              onPress={() => router.push('/admin/sell')} 
              style={styles.headerBtn}
            >
              <Ionicons name="cart-outline" size={26} color="#333" />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/admin/add')} 
              style={[styles.headerBtn, {backgroundColor: '#000', borderWidth: 0}]}
            >
              <Ionicons name="add" size={26} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>

      {/* BUSCADOR + ESCÁNER */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput 
            placeholder="Buscar producto..." 
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
          {/* BOTÓN ESCÁNER */}
          <TouchableOpacity onPress={() => {
              setScanned(false);
              setShowCamera(true);
          }}>
             <Ionicons name="qr-code-outline" size={24} color="#000" />
          </TouchableOpacity>
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

      {/* MODAL CÁMARA */}
      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View style={styles.cameraContainer}>
            {hasPermission === null ? (
                <Text style={{color: 'white'}}>Solicitando permisos...</Text>
            ) : hasPermission === false ? (
                <Text style={{color: 'white'}}>Sin acceso a la cámara</Text>
            ) : (
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e"], 
                    }}
                />
            )}
            
            <TouchableOpacity 
                style={styles.closeCameraBtn} 
                onPress={() => setShowCamera(false)}
            >
                <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            <View style={styles.scanOverlay}>
                <Text style={styles.scanText}>Escanea un producto para añadirlo al carrito</Text>
                <View style={styles.scanFrame} />
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, alignItems: 'center' },
  welcomeTitle: { fontSize: 26, fontWeight: '800', color: '#000' },
  welcomeSub: { fontSize: 14, color: '#666' },
  
  headerBtn: {
    width: 44, height: 44, borderRadius: 22, 
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F4F4F4', borderWidth: 1, borderColor: '#EEE',
    position: 'relative'
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#FF3B30', width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff'
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { flexDirection: 'row', backgroundColor: '#F4F6F8', padding: 12, borderRadius: 12, alignItems: 'center' },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16 },
  
  catScroll: { paddingHorizontal: 20, marginBottom: 15 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F4F6F8', marginRight: 10 },
  catChipActive: { backgroundColor: '#000' },
  catText: { color: '#666', fontWeight: '600' },
  catTextActive: { color: '#fff' },
  
  listContent: { paddingHorizontal: 15, paddingBottom: 50 }, 
  row: { justifyContent: 'space-between' },
  cardContainer: { width: '48%', marginBottom: 15 },
  
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0' },
  image: { width: '100%', height: 140, backgroundColor: '#eee' },
  info: { padding: 10 },
  categoryTag: { fontSize: 10, color: '#888', textTransform: 'uppercase' },
  stockTag: { fontSize: 10, color: '#666', fontWeight:'600' },
  prodName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  addToCartBtn: { padding: 0 },
  
  emptyState: { alignItems: 'center', marginTop: 50, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 15 },

  // Estilos Cámara
  cameraContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  closeCameraBtn: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, zIndex: 10 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  scanText: { color: 'white', fontSize: 16, marginBottom: 20, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#00FF00', backgroundColor: 'transparent' }
});