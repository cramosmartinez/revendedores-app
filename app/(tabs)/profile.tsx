import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const ADMIN_EMAIL = "test@correo.com"; 

export default function ProfileScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyOrders = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "orders"), 
        where("userId", "==", user.uid),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const misPedidos: any[] = [];
      querySnapshot.forEach((doc) => {
        misPedidos.push({ id: doc.id, ...doc.data() });
      });
      setOrders(misPedidos);
    } catch (e) {
      console.error("Error cargando historial:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyOrders();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: async () => { await signOut(auth); router.replace('/'); } }
    ]);
  };

  const totalVendido = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalPedidos = orders.length;
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchMyOrders();}} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Negocio</Text>
      </View>

      <View style={styles.profileCard}>
        <Image source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.email}` }} style={styles.avatar} />
        <View style={{flex:1}}>
          <Text style={styles.name} numberOfLines={1}>{user?.displayName || user?.email?.split('@')[0] || "Usuario"}</Text>
          <Text style={styles.emailSub}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{isAdmin ? "Administrador 👑" : "Socio Verificado ✅"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Comprado</Text>
          <Text style={styles.statValue}>Q{totalVendido.toFixed(2)}</Text> 
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Pedidos</Text>
          <Text style={styles.statValue}>{totalPedidos}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial en la Nube</Text>
        
        {loading ? (
          <ActivityIndicator color="#000" style={{marginTop: 20}} />
        ) : orders.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Ionicons name="cloud-offline-outline" size={40} color="#ccc" />
            <Text style={{ color: '#999', marginTop: 10 }}>Sin historial disponible.</Text>
          </View>
        ) : (
          orders.map((order) => (
             <View key={order.id} style={styles.orderCard}>
                <View style={[styles.orderIcon, {backgroundColor: order.status === 'pendiente' ? '#FF9800' : '#4CAF50'}]}>
                  <Ionicons name={order.status === 'pendiente' ? "time" : "checkmark"} size={20} color="#FFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.orderDate}>
                    {order.date ? new Date(order.date.seconds * 1000).toLocaleDateString() : 'Reciente'}
                  </Text>
                  <Text style={styles.orderSub}>{order.items?.length || 0} productos</Text>
                </View>
                <Text style={styles.orderPrice}>Q{order.total?.toFixed(2)}</Text>
             </View>
          ))
        )}
      </View>
      
      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity style={styles.adminBtn} onPress={() => router.push('/admin/add')}>
            <Ionicons name="settings-sharp" size={18} color="#444" style={{marginRight: 8}}/>
            <Text style={styles.adminText}>PANEL ADMIN: AGREGAR PRODUCTO</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{height: 50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  profileCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 15, borderWidth: 3, borderColor: '#fff', backgroundColor: '#eee' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333', textTransform: 'capitalize' },
  emailSub: { fontSize: 12, color: '#888', marginBottom: 4 },
  badge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 12 },
  statsContainer: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4, marginBottom: 30 },
  statBox: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: '#eee', marginHorizontal: 10 },
  statLabel: { fontSize: 12, color: '#888', marginBottom: 5 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4 },
  orderIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  orderDate: { fontWeight: 'bold', color: '#333', fontSize: 14 },
  orderSub: { color: '#888', fontSize: 12 },
  orderPrice: { fontWeight: 'bold', color: '#2ecc71', fontSize: 16 },
  logoutBtn: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#FFEBEE', alignItems: 'center', backgroundColor: '#FFF' },
  logoutText: { color: '#D32F2F', fontWeight: '600' },
  adminBtn: { marginTop: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0E0E0', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' },
  adminText: { color: '#444', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }
});