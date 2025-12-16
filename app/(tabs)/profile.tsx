import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, Dimensions, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit"; // <-- IMPORTAR GRÁFICA

// --- FIREBASE IMPORTS ---
import { 
  collection, query, where, doc, updateDoc, increment, onSnapshot, getDoc 
} from 'firebase/firestore';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../firebaseConfig';

export default function ProfileScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  
  // Estados de Usuario
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null); 

  // Estados de Pedidos y Métricas
  const [orders, setOrders] = useState<any[]>([]);
  const [totalSold, setTotalSold] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0); 
  const [pendingPayment, setPendingPayment] = useState(0);
  
  // Datos para la Gráfica
  const [chartData, setChartData] = useState<any>({
    labels: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
  });

  // --- CARGA DE DATOS EN TIEMPO REAL 🔴 ---
  useEffect(() => {
    const auth = getAuth();
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // 1. Cargar Perfil
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (e) { console.error(e); }

        // 2. Escuchar Pedidos
        const q = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
        
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const ordersList: any[] = [];
          let sold = 0;
          let profit = 0;
          let pending = 0;

          // Variables para gráfica (Últimos 7 días)
          const today = new Date();
          const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));
            return d.toISOString().split('T')[0]; // Formato YYYY-MM-DD
          });
          const salesByDay = new Array(7).fill(0);

          snapshot.forEach((doc) => {
            const data = doc.data();
            const order = { id: doc.id, ...data };
            ordersList.push(order);
            
            // Cálculos Financieros Generales
            if (data.status === 'PAGADO') {
              sold += (data.total || 0);
              profit += (data.profit || 0); 
              
              // Lógica para Gráfica: Sumar si es de los últimos 7 días
              if (data.createdAt?.toDate) {
                const orderDate = data.createdAt.toDate().toISOString().split('T')[0];
                const index = last7Days.indexOf(orderDate);
                if (index !== -1) {
                    salesByDay[index] += data.total;
                }
              }

            } else if (data.status === 'PENDIENTE') {
              pending += (data.total || 0);
            }
          });

          // Ordenar lista de pedidos
          ordersList.sort((a: any, b: any) => {
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
              return dateB - dateA; 
          });

          // Actualizar estados
          setTotalSold(sold);
          setTotalProfit(profit); 
          setPendingPayment(pending);
          setOrders(ordersList);

          // Actualizar Gráfica
          setChartData({
            labels: ["D-6", "D-5", "D-4", "D-3", "Ayer", "Hoy"], // Etiquetas simplificadas
            datasets: [{ data: salesByDay.slice(1) }] // Mostramos 6 puntos para que quepa mejor o ajusta labels
          });
        });

      } else {
        setUser(null);
        setUserData(null);
        setOrders([]);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.replace('/login');
  };

  const changeStatus = async (orderId: string, newStatus: string) => {
    try {
      const currentOrder = orders.find(o => o.id === orderId);
      
      if (newStatus === 'PAGADO' && currentOrder) {
        for (const item of currentOrder.items) {
           if (item.id) {
             const productRef = doc(db, "products", item.id);
             await updateDoc(productRef, { stock: increment(-1) });
           }
        }
      }
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // --- RENDER HEADER CON GRÁFICA ---
  const renderHeader = () => {
    const displayName = userData?.businessName || user?.displayName || "Mi Negocio";
    const photoURL = userData?.photoURL || user?.photoURL;
    const emailInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

    return (
      <View>
        {/* 1. SECCIÓN DE PERFIL */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
             {photoURL ? (
               <Image source={{ uri: photoURL }} style={styles.avatarImage} />
             ) : (
               <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{emailInitial}</Text>
               </View>
             )}
          </View>
          
          <View style={{flex: 1, marginLeft: 15}}>
            <Text style={styles.welcome}>Bienvenido,</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
               <Text style={styles.businessName} numberOfLines={1}>{displayName}</Text>
               <TouchableOpacity onPress={() => router.push('/profile/edit' as any)} style={{marginLeft: 8}}>
                  <Ionicons name="pencil" size={20} color="#007AFF" />
               </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* 2. DASHBOARD FINANCIERO */}
        <View style={styles.dashboardContainer}>
           <View style={[styles.statCard, {backgroundColor: '#34495e', flex: 1}]}>
              <Text style={styles.statLabel}>Ventas</Text>
              <Text style={styles.statValue}>Q{totalSold.toFixed(0)}</Text>
              <Text style={styles.statSub}>Total</Text>
           </View>

           <View style={[styles.statCard, {backgroundColor: '#27ae60', flex: 1.2, marginHorizontal: 8}]}>
              <Text style={styles.statLabel}>Ganancia</Text>
              <Text style={[styles.statValue, {fontSize: 26}]}>Q{totalProfit.toFixed(0)}</Text>
              <Text style={styles.statSub}>Neta</Text>
           </View>

           <View style={[styles.statCard, {backgroundColor: '#f39c12', flex: 1}]}>
              <Text style={styles.statLabel}>Cobrar</Text>
              <Text style={styles.statValue}>Q{pendingPayment.toFixed(0)}</Text>
              <Text style={styles.statSub}>Pendiente</Text>
           </View>
        </View>

        {/* 3. GRÁFICA DE VENTAS (NUEVO) */}
        <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Tendencia de Ventas (Últimos días)</Text>
            <LineChart
                data={chartData}
                width={screenWidth - 40} // Ancho de pantalla menos padding
                height={220}
                yAxisLabel="Q"
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Azul profesional
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: "6", strokeWidth: "2", stroke: "#007AFF" }
                }}
                bezier // Línea curva suave
                style={{ marginVertical: 8, borderRadius: 16 }}
            />
        </View>

        {/* 4. BOTONES DE HERRAMIENTAS */}
        <View style={{flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20}}>
            <TouchableOpacity 
              onPress={() => router.push('/admin/clients' as any)}
              style={styles.toolBtn}
            >
               <Ionicons name="people" size={20} color="#fff" />
               <Text style={styles.toolBtnText}>Directorio de Clientes</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos Movimientos</Text>
        </View>
      </View>
    );
  };

  // --- RENDER PEDIDOS ---
  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>
           {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('es-GT') : 'Reciente'}
        </Text>
        <View style={[styles.badge, getBadgeStyle(item.status)]}>
           <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items?.map((prod: any, index: number) => (
          <Text key={index} style={styles.productText} numberOfLines={1}>
            • {prod.name} ({prod.quantity})
          </Text>
        ))}
      </View>
      
      {item.clientName && (
          <Text style={styles.clientText}>👤 {item.clientName}</Text>
      )}

      <View style={styles.divider} />
      
      <View style={styles.cardFooter}>
        <View>
            <Text style={styles.methodText}>{item.method || 'Venta'}</Text>
            {item.status === 'PAGADO' && item.profit !== undefined && (
                <Text style={styles.profitText}>Ganancia: +Q{item.profit.toFixed(2)}</Text>
            )}
        </View>
        <Text style={styles.totalValue}>Q{item.total?.toFixed(2)}</Text>
      </View>

      {item.status === 'PENDIENTE' && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.btn, styles.btnCancel]} 
            onPress={() => changeStatus(item.id, 'CANCELADO')}
          >
            <Ionicons name="close" size={16} color="#c0392b" />
            <Text style={[styles.btnText, {color: '#c0392b'}]}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, styles.btnConfirm]} 
            onPress={() => changeStatus(item.id, 'PAGADO')}
          >
            <Ionicons name="checkmark" size={16} color="#27ae60" />
            <Text style={[styles.btnText, {color: '#27ae60'}]}>Cobrado</Text>
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
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={60} color="#ddd" />
            <Text style={{color: '#999', marginTop: 10}}>Sin movimientos recientes.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
  avatarContainer: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  avatarImage: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  welcome: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  businessName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  logoutBtn: { padding: 10 },
  
  // Dashboard Cards
  dashboardContainer: { flexDirection: 'row', marginBottom: 20, paddingHorizontal: 15 },
  statCard: { padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  statLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  statValue: { color: 'white', fontSize: 18, fontWeight: 'bold', marginVertical: 2 },
  statSub: { color: 'rgba(255,255,255,0.7)', fontSize: 9 },

  // Estilos Gráfica
  chartContainer: { 
    marginHorizontal: 20, 
    marginBottom: 20, 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 10, 
    shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 
  },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 5, marginLeft: 10 },

  toolBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#333', padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  toolBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  sectionHeader: { marginBottom: 15, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  list: { paddingBottom: 20 },
  
  // Pedido Card
  card: { backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 15, marginHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  date: { color: '#888', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#555', fontSize: 10, fontWeight: 'bold' },
  itemsContainer: { marginBottom: 5 },
  productText: { fontSize: 14, color: '#444' },
  clientText: { fontSize: 13, color: '#007AFF', fontStyle: 'italic', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  methodText: { fontSize: 12, color: '#999' },
  profitText: { fontSize: 11, color: '#27ae60', fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  actionRow: { flexDirection: 'row', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderColor: '#f9f9f9', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1 },
  btnCancel: { backgroundColor: '#fff', borderColor: '#fadbd8' },
  btnConfirm: { backgroundColor: '#fff', borderColor: '#d4efdf' },
  btnText: { fontWeight: 'bold', fontSize: 12, marginLeft: 5 },
  empty: { alignItems: 'center', marginTop: 50 }
});