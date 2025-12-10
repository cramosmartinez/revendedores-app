import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- FIREBASE ---
import { collection, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. CARGAR PEDIDOS
  const fetchOrders = async () => {
    if (!refreshing) setLoading(true);
    try {
      // Trae TODOS los pedidos (Ideal para ver tus ventas generales)
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const ordersList: any[] = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() });
      });
      setOrders(ordersList);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  // 2. CAMBIAR ESTADO DE VENTA
  const changeStatus = async (orderId: string, newStatus: string) => {
    try {
      // A. Actualizamos VISUALMENTE primero (para que se sienta rápido)
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // B. Actualizamos en FIREBASE
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });

      // Feedback para Web/Móvil
      if (Platform.OS === 'web') {
        // alert(`Pedido actualizado a: ${newStatus}`); // Opcional
      } else {
        // Alert.alert("Éxito", `Pedido marcado como ${newStatus}`); // Opcional
      }

    } catch (error: any) {
      console.error("Error al actualizar:", error);
      Alert.alert("Error", "No se pudo actualizar en la nube. " + error.message);
      // Si falla, recargamos para volver al estado real
      fetchOrders();
    }
  };

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
           <Text style={styles.date}>
             {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('es-GT') : 'Reciente'}
           </Text>
           <Text style={styles.refId}>Cliente: {item.userEmail || 'Anónimo'}</Text>
        </View>
        <View style={[styles.badge, getBadgeStyle(item.status)]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.productsContainer}>
        {item.items?.map((prod: any, i: number) => (
          <Text key={i} style={styles.prodText}>• {prod.name} (Q{prod.price})</Text>
        ))}
      </View>

      <Text style={styles.total}>Total: Q{item.total?.toFixed(2)}</Text>

      {/* BOTONES: Solo aparecen si está PENDIENTE */}
      {item.status === 'PENDIENTE' && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.btn, styles.btnCancel]} 
            onPress={() => changeStatus(item.id, 'CANCELADO')}
          >
            <Ionicons name="close-circle" size={18} color="#c0392b" />
            <Text style={[styles.btnText, {color: '#c0392b'}]}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, styles.btnConfirm]} 
            onPress={() => changeStatus(item.id, 'PAGADO')}
          >
            <Ionicons name="checkmark-circle" size={18} color="#27ae60" />
            <Text style={[styles.btnText, {color: '#27ae60'}]}>Cobrado / Vendido</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'PAGADO': return { backgroundColor: '#d4edda' };
      case 'CANCELADO': return { backgroundColor: '#f8d7da' };
      default: return { backgroundColor: '#fff3cd' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Control de Ventas</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#000" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: 'white' },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  date: { fontSize: 12, color: '#888' },
  refId: { fontSize: 12, color: '#333', fontWeight:'bold', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },
  productsContainer: { marginBottom: 10 },
  prodText: { fontSize: 14, color: '#444' },
  total: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71', textAlign: 'right' },
  actionRow: { flexDirection: 'row', marginTop: 15, gap: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#f9f9f9' },
  btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1 },
  btnCancel: { backgroundColor: '#fff', borderColor: '#fadbd8' },
  btnConfirm: { backgroundColor: '#fff', borderColor: '#d4efdf' },
  btnText: { fontWeight: 'bold', fontSize: 12, marginLeft: 5 }
});