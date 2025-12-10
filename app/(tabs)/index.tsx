import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator, ListRenderItem 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext'; 
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 

// 1. DEFINIR TIPO
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description?: string;
}

const CATEGORIES = ['Todos', 'Calzado', 'Ropa', 'Accesorios', 'Tech'];

export default function HomeScreen() {
  const { items, addItem } = useCart();
  const router = useRouter();
  
  const [selectedCat, setSelectedCat] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsList: Product[] = [];
        querySnapshot.forEach((doc) => {
          productsList.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(productsList);
      } catch (error) {
        console.error("Error obteniendo productos: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCat === 'Todos' || product.category === selectedCat;
    const nameMatch = product.name ? product.name.toLowerCase().includes(searchText.toLowerCase()) : false;
    return categoryMatch && nameMatch;
  });

  // 2. USAR EL TIPO AQUÍ PARA QUE NO DE ERROR
  const renderProduct: ListRenderItem<Product> = ({ item }) => (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={() => router.push(`/product/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={styles.categoryTag}>{item.category}</Text>
          <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>Q{item.price.toFixed(2)}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item)}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput 
            placeholder="Buscar productos..." 
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity onPress={() => router.push('/modal-cart')} style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={24} color="#333" />
          {items.length > 0 && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 10 }}>Cargando catálogo...</Text>
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
            <Text style={{textAlign: 'center', marginTop: 20, color: '#999'}}>
               No hay productos disponibles.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, alignItems: 'center', gap: 10 },
  searchBar: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16 },
  cartBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  badge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' },
  catScroll: { paddingHorizontal: 20, marginBottom: 15 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#eee' },
  catChipActive: { backgroundColor: '#333', borderColor: '#333' },
  catText: { color: '#666', fontWeight: '600' },
  catTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  row: { justifyContent: 'space-between' },
  cardContainer: { width: '48%', marginBottom: 15 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  image: { width: '100%', height: 140, backgroundColor: '#eee' },
  info: { padding: 12 },
  categoryTag: { fontSize: 10, color: '#888', textTransform: 'uppercase', marginBottom: 2 },
  prodName: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, fontWeight: '800', color: '#2ecc71' },
  addBtn: { backgroundColor: '#333', padding: 6, borderRadius: 8 },
});