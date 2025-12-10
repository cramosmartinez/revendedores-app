import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- FIREBASE IMPORTS ---
import { 
  collection, addDoc, doc, updateDoc, increment, serverTimestamp, query, where, onSnapshot 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';

// --- TIPOS ---
type Client = {
  id: string;
  name: string;
  phone?: string;
};

// Asumiendo que el item del carrito incluye: id, name, price, cost, quantity
interface CartItem {
    id: string;
    name: string;
    price: number;
    cost: number; // <-- NUEVO CAMPO COSTO
    quantity: number;
    total: number;
}


export default function SellScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  // Estados de Venta
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCost, setCartCost] = useState(0); // <-- NUEVO ESTADO: Costo Total
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  
  // Estados de CRM
  const [clientList, setClientList] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);

  // 1. CARGA INICIAL DE DATOS
  useEffect(() => {
    const currentCart: CartItem[] = (globalThis as any).cart || [];
    setCart(currentCart);

    // Calcular Total y Costo Total
    const total = currentCart.reduce((sum: number, item: any) => sum + item.total, 0);
    const totalCost = currentCart.reduce((sum: number, item: any) => sum + (item.cost * item.quantity), 0);
    
    setCartTotal(total);
    setCartCost(totalCost); // <-- Guardar Costo Total

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

  // 2. FUNCIÓN DE VENTA (Actualizada con Ganancia)
  const handleSell = async () => {
    if (!user || cart.length === 0) {
      Alert.alert("Error", "El carrito está vacío.");
      return;
    }

    setLoading(true);
    try {
      // 1. Actualizar Stock (Descontar)
      for (const item of cart) {
        if (item.id) {
          const productRef = doc(db, "products", item.id);
          await updateDoc(productRef, { stock: increment(-item.quantity) });
        }
      }

      // 2. Preparar el objeto de la orden 
      const newOrder = {
        userId: user.uid,
        items: cart.map(item => ({ 
           id: item.id, 
           name: item.name, 
           quantity: item.quantity, 
           price: item.price, 
           cost: item.cost, // <-- NUEVO: Costo del producto vendido
           total: item.total 
        })),
        total: cartTotal,
        totalCost: cartCost, // <-- NUEVO: Costo Total de la Venta
        profit: cartTotal - cartCost, // <-- NUEVO: Ganancia Bruta
        status: 'PENDIENTE', 
        method: paymentMethod,
        createdAt: serverTimestamp(),
        clientId: selectedClient?.id || null, 
        clientName: selectedClient?.name || 'Cliente Final',
      };

      // 3. Agregar orden a Firestore
      await addDoc(collection(db, "orders"), newOrder);

      // 4. Limpiar carrito y navegar
      (globalThis as any).cart = [];
      Alert.alert("¡Venta Registrada!", `Ganancia Bruta: Q${(cartTotal - cartCost).toFixed(2)}`);
      router.replace('/(tabs)');

    } catch (error: any) {
      console.error("Error al registrar venta:", error);
      Alert.alert("Error", "No se pudo registrar la venta. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- MODAL DE SELECCIÓN DE CLIENTE ---
  const renderClientModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isClientModalVisible}
      onRequestClose={() => setIsClientModalVisible(false)}
    >
      <View style={modalStyles.modalContainer}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.headerTitle}>Seleccionar Cliente</Text>
          <TouchableOpacity onPress={() => setIsClientModalVisible(false)} style={{padding: 5}}>
            <Ionicons name="close" size={30} color="#333" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={clientList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={modalStyles.clientItem} 
              onPress={() => {
                setSelectedClient(item);
                setIsClientModalVisible(false);
              }}
            >
              <View>
                <Text style={modalStyles.clientName}>{item.name}</Text>
                {item.phone ? <Text style={modalStyles.clientDetail}>{item.phone}</Text> : null}
              </View>
              {selectedClient?.id === item.id && (
                <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={modalStyles.emptyText}>No hay clientes. Crea uno en la sección de Perfil.</Text>
          }
        />
        <TouchableOpacity 
           style={modalStyles.newClientBtn} 
           onPress={() => {
             setIsClientModalVisible(false);
             router.push('/admin/clients' as any);
           }}
        >
            <Text style={modalStyles.newClientText}>Crear Nuevo Cliente</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      <View style={styles.itemDetails}>
        <Text style={styles.itemCost}>Costo: Q{item.cost.toFixed(2)}</Text> {/* <-- Mostrar Costo */}
        <Text style={styles.itemQuantity}>{item.quantity} x Q{item.price.toFixed(2)}</Text>
        <Text style={styles.itemTotal}>Q{item.total.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* SOLUCIÓN: CONFIGURACIÓN DEL ENCABEZADO LIMPIO */}
      <Stack.Screen 
        options={{ 
          title: 'Cerrar Venta', 
          headerBackTitle: 'Inventario', 
          headerTitleStyle: { fontWeight: 'bold' } 
        }} 
      />

      {renderClientModal()}

      <FlatList
        data={cart}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderCartItem}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>El carrito está vacío.</Text>}
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>Productos ({cart.length})</Text>

            {/* SECCIÓN DE SELECCIÓN DE CLIENTE */}
            <View style={[styles.section, {marginTop: 10}]}>
                <Text style={styles.sectionTitle}>Cliente</Text>
                <TouchableOpacity 
                    style={styles.clientSelector} 
                    onPress={() => setIsClientModalVisible(true)}
                >
                    <Ionicons name="person-circle-outline" size={24} color="#000" />
                    <Text style={styles.clientText}>
                        {selectedClient ? selectedClient.name : 'Cliente Final (Seleccionar)'}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#999" style={{marginLeft: 'auto'}} />
                </TouchableOpacity>
                {selectedClient && (
                    <TouchableOpacity 
                        onPress={() => setSelectedClient(null)} 
                        style={styles.removeClientBtn}
                    >
                        <Text style={styles.removeClientText}>Quitar Cliente</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* SECCIÓN MÉTODO DE PAGO */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Método de Pago</Text>
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
          </>
        }
      />
      
      {/* PIE DE PÁGINA (RESUMEN Y BOTÓN) */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Costo Total:</Text>
          <Text style={styles.totalCostValue}>Q{cartCost.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Ganancia Bruta:</Text>
          <Text style={styles.profitValue}>Q{(cartTotal - cartCost).toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL A COBRAR</Text>
          <Text style={styles.totalValue}>Q{cartTotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.sellBtn, loading && {backgroundColor: '#666'}]} 
          onPress={handleSell} 
          disabled={loading || cart.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sellBtnText}>
              {`Registrar Venta de Q${cartTotal.toFixed(2)}`}
            </Text>
          )}
        </TouchableOpacity>
        {selectedClient && (
            <Text style={styles.clientFooterText}>
                Venta registrada a nombre de: {selectedClient.name}
            </Text>
        )}
      </View>
    </View>
  );
}

// Estilos principales
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  section: { backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  
  // --- Cliente Styles ---
  clientSelector: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#DDD', borderRadius: 10, backgroundColor: '#F9F9F9' },
  clientText: { marginLeft: 10, fontSize: 16, flex: 1 },
  removeClientBtn: { marginTop: 8, padding: 5, alignItems: 'flex-end' },
  removeClientText: { color: '#FF3B30', fontSize: 12, textDecorationLine: 'underline' },
  clientFooterText: { textAlign: 'center', fontSize: 12, color: '#666', marginTop: 8 },

  // --- Item List Styles ---
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { fontSize: 15, fontWeight: '600', flex: 2, color: '#444' },
  itemDetails: { flexDirection: 'row', justifyContent: 'flex-end', flex: 1, gap: 10 },
  itemCost: { fontSize: 12, color: '#888', fontStyle: 'italic' }, // Nuevo estilo costo
  itemQuantity: { fontSize: 14, color: '#666' },
  itemTotal: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },

  // --- Payment Method Styles ---
  methodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  methodBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 2, borderColor: '#f0f0f0', backgroundColor: '#f9f9f9' },
  methodBtnSelected: { borderColor: '#000', backgroundColor: '#333' },
  methodText: { textAlign: 'center', fontWeight: 'bold', color: '#666' },
  methodTextSelected: { color: 'white' },

  // --- Footer Styles ---
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#ddd', backgroundColor: 'white' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  totalLabel: { fontSize: 18, fontWeight: '600', color: '#666' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  totalCostValue: { fontSize: 16, fontWeight: '500', color: '#888' },
  profitValue: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71' }, // Verde para la ganancia
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },
  sellBtn: { backgroundColor: '#000', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  sellBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

// Estilos del Modal
const modalStyles = StyleSheet.create({
  modalContainer: { flex: 1, paddingTop: 50, backgroundColor: '#F4F6F8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  clientItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, marginHorizontal: 15, backgroundColor: 'white', borderRadius: 10, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
  clientName: { fontSize: 16, fontWeight: '600', color: '#333' },
  clientDetail: { fontSize: 12, color: '#666', marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  newClientBtn: { backgroundColor: '#007AFF', padding: 15, margin: 20, borderRadius: 12, alignItems: 'center' },
  newClientText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});