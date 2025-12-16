import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';

// --- TIPOS ---
type Client = {
  id: string;
  name: string;
  phone?: string;
};

interface CartItem {
    id: string;
    name: string;
    price: number;
    cost: number; 
    quantity: number;
    total: number;
}

export default function SellScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  // Estados
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCost, setCartCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  
  // CRM
  const [clientList, setClientList] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);

  // 1. CARGA SEGURA DE DATOS
  useEffect(() => {
    const rawCart = (globalThis as any).cart || [];
    
    // SANITIZACIÓN
    const safeCart: CartItem[] = rawCart.map((item: any) => ({
        ...item,
        price: Number(item.price) || 0,
        cost: Number(item.cost) || 0,
        quantity: Number(item.quantity) || 1,
        total: Number(item.total) || 0
    }));

    setCart(safeCart);

    const total = safeCart.reduce((sum, item) => sum + item.total, 0);
    const totalCost = safeCart.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    
    setCartTotal(total);
    setCartCost(totalCost);

    // Cargar Clientes
    if (!user) return;
    const q = query(collection(db, "clients"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Client[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, name: doc.data().name, phone: doc.data().phone });
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      setClientList(list);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. REGISTRAR VENTA
  const handleSell = async () => {
    if (!user || cart.length === 0) {
      Alert.alert("Error", "El carrito está vacío.");
      return;
    }

    setLoading(true);
    try {
      // 1. Descontar Stock
      for (const item of cart) {
        if (item.id) {
          const productRef = doc(db, "products", item.id);
          await updateDoc(productRef, { stock: increment(-item.quantity) });
        }
      }

      // 2. Guardar Orden
      const newOrder = {
        userId: user.uid,
        items: cart.map(item => ({ 
           id: item.id, 
           name: item.name, 
           quantity: item.quantity, 
           price: item.price, 
           cost: item.cost,
           total: item.total 
        })),
        total: cartTotal,
        totalCost: cartCost,
        profit: cartTotal - cartCost, 
        status: 'PENDIENTE', 
        method: paymentMethod,
        createdAt: serverTimestamp(),
        clientId: selectedClient?.id || null, 
        clientName: selectedClient?.name || 'Cliente Final',
      };

      await addDoc(collection(db, "orders"), newOrder);

      // 3. Limpiar y Salir
      (globalThis as any).cart = [];
      Alert.alert("¡Venta Exitosa!", `Ganancia estimada: Q${(cartTotal - cartCost).toFixed(2)}`);
      router.replace('/(tabs)');

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "No se pudo registrar la venta.");
    } finally {
      setLoading(false);
    }
  };

  // --- MODAL CLIENTES ---
  const renderClientModal = () => (
    <Modal
      animationType="slide"
      visible={isClientModalVisible}
      onRequestClose={() => setIsClientModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.headerTitle}>Seleccionar Cliente</Text>
          <TouchableOpacity onPress={() => setIsClientModalVisible(false)}>
            <Ionicons name="close" size={30} color="#333" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={clientList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.clientItem} 
              onPress={() => {
                setSelectedClient(item);
                setIsClientModalVisible(false);
              }}
            >
              <Text style={styles.clientName}>{item.name}</Text>
              {selectedClient?.id === item.id && <Ionicons name="checkmark" size={24} color="green" />}
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity 
           style={styles.newClientBtn} 
           onPress={() => {
             setIsClientModalVisible(false);
             router.push('/admin/clients' as any);
           }}
        >
            <Text style={styles.newClientText}>+ Nuevo Cliente</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Cerrar Venta' }} />
      {renderClientModal()}

      <FlatList
        data={cart}
        keyExtractor={(item, index) => item.id + index.toString()}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Carrito vacío.</Text>}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>Resumen ({cart.length})</Text>

            {/* CLIENTE */}
            <TouchableOpacity 
                style={styles.clientSelector} 
                onPress={() => setIsClientModalVisible(true)}
            >
                <Ionicons name="person-circle-outline" size={24} color="#000" />
                <Text style={styles.clientText}>
                    {selectedClient ? selectedClient.name : 'Seleccionar Cliente'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#999" style={{marginLeft: 'auto'}} />
            </TouchableOpacity>

            {/* MÉTODO PAGO */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pago</Text>
              <View style={styles.methodRow}>
                {['EFECTIVO', 'TRANSFERENCIA'].map(method => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.methodBtn, paymentMethod === method && styles.methodBtnSelected]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text style={[styles.methodText, paymentMethod === method && styles.methodTextSelected]}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.itemDetails}>
                <Text style={styles.itemCost}>Costo: Q{(item.cost || 0).toFixed(2)}</Text>
                <Text style={styles.itemQuantity}>{item.quantity} x Q{(item.price || 0).toFixed(2)}</Text>
                <Text style={styles.itemTotal}>Q{(item.total || 0).toFixed(2)}</Text>
              </View>
            </View>
        )}
      />
      
      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Ganancia Est.:</Text>
          <Text style={styles.profitValue}>Q{(cartTotal - cartCost).toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.totalValue}>Q{cartTotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.sellBtn, loading && {backgroundColor: '#666'}]} 
          onPress={handleSell} 
          disabled={loading || cart.length === 0}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sellBtnText}>Cobrar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  section: { marginTop: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  clientSelector: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: 'white', borderRadius: 12, marginBottom: 15 },
  clientText: { marginLeft: 10, fontSize: 16, flex: 1 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: 'white', paddingHorizontal: 10, borderRadius: 8, marginBottom: 5 },
  itemName: { fontSize: 15, fontWeight: '600', flex: 1, color: '#444' },
  itemDetails: { alignItems: 'flex-end' },
  itemCost: { fontSize: 10, color: '#aaa' },
  itemQuantity: { fontSize: 12, color: '#666' },
  itemTotal: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  methodRow: { flexDirection: 'row', gap: 10 },
  methodBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', backgroundColor: 'white', alignItems: 'center' },
  methodBtnSelected: { borderColor: '#000', backgroundColor: '#333' },
  methodText: { fontWeight: '600', color: '#666' },
  methodTextSelected: { color: 'white' },
  footer: { padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#eee' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  totalLabel: { fontSize: 16, color: '#666' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  profitValue: { fontSize: 16, fontWeight: 'bold', color: '#27ae60' },
  sellBtn: { backgroundColor: '#000', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 15 },
  sellBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  
  // MODAL STYLES
  modalContainer: { flex: 1, backgroundColor: '#F4F6F8', paddingTop: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  clientItem: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
  clientName: { fontSize: 16 },
  newClientBtn: { margin: 20, padding: 15, backgroundColor: '#007AFF', borderRadius: 12, alignItems: 'center' },
  newClientText: { color: 'white', fontWeight: 'bold' }
});