import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- IMPORTS PDF (COMENTADOS TEMPORALMENTE PARA EVITAR ERROR DE BUILD) ---
// import * as Print from 'expo-print';
// import * as Sharing from 'expo-sharing';

// --- FIREBASE IMPORTS ---
import { 
  collection, query, where, doc, updateDoc, increment, onSnapshot, getDoc 
} from 'firebase/firestore';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../firebaseConfig';

export default function ProfileScreen() {
  const router = useRouter();
  
  // Estados de Usuario
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null); 

  // Estados de Pedidos y Métricas
  const [orders, setOrders] = useState<any[]>([]);
  const [totalSold, setTotalSold] = useState(0);
  const [pendingPayment, setPendingPayment] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);

  // --- CARGA DE DATOS EN TIEMPO REAL 🔴 ---
  useEffect(() => {
    const auth = getAuth();
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // 1. Cargar Perfil de Negocio (Foto, Nombre)
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (e) {
          console.error("Error cargando perfil", e);
        }

        // 2. Escuchar Pedidos en Vivo
        const q = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
        
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const ordersList: any[] = [];
          let sold = 0;
          let pending = 0;
          let count = 0;

          snapshot.forEach((doc) => {
            const data = doc.data();
            const order = { id: doc.id, ...data };
            ordersList.push(order);
            
            // Cálculos Financieros
            if (data.status === 'PAGADO') {
              sold += (data.total || 0);
              count++;
            } else if (data.status === 'PENDIENTE') {
              pending += (data.total || 0);
            }
          });

          // Ordenar por fecha (más reciente primero)
          ordersList.sort((a: any, b: any) => {
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
              return dateB - dateA; 
          });

          setTotalSold(sold);
          setPendingPayment(pending);
          setCompletedOrders(count);
          setOrders(ordersList);
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

  // --- CAMBIAR ESTADO DE PEDIDO (Descuenta Stock) ---
  const changeStatus = async (orderId: string, newStatus: string) => {
    try {
      const currentOrder = orders.find(o => o.id === orderId);
      
      // Si cobramos, descontamos stock
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

  // --- FUNCIÓN GENERAR PDF (COMENTADA) ---
  const handlePrintReceipt = async (item: any) => {
      Alert.alert(
        "Función Deshabilitada", 
        "La función de recibos está deshabilitada temporalmente por un error de compilación. Pronto estará activa de nuevo."
      );
      // Código original del PDF va aquí
      /* try {
          // ... (Lógica de PDF) ...
          if (Platform.OS === 'web') {
             await Print.printAsync({ html });
          } else {
             const { uri } = await Print.printToFileAsync({ html });
             await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
          }
      } catch (error) { ... }
      */
  };

  // --- RENDERIZADO DEL ENCABEZADO ---
  const renderHeader = () => {
    const displayName = userData?.businessName || user?.displayName || "Mi Negocio";
    const displayEmail = user?.email || "";
    const photoURL = userData?.photoURL || user?.photoURL;

    return (
      <View>
        {/* 1. SECCIÓN DE PERFIL */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
             {photoURL ? (
               <Image source={{ uri: photoURL }} style={styles.avatarImage} />
             ) : (
               <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {displayEmail.charAt(0).toUpperCase()}
                  </Text>
               </View>
             )}
          </View>
          
          <View style={{flex: 1, marginLeft: 15}}>
            <Text style={styles.welcome}>Bienvenido,</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
               <Text style={styles.businessName} numberOfLines={1}>{displayName}</Text>
               
               {/* BOTÓN LÁPIZ PARA EDITAR PERFIL */}
               <TouchableOpacity onPress={() => router.push('/profile/edit' as any)} style={{marginLeft: 8}}>
                  <Ionicons name="pencil" size={20} color="#007AFF" />
               </TouchableOpacity>
            </View>
            <Text style={styles.email} numberOfLines={1}>{displayEmail}</Text>
          </View>
          
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* 2. DASHBOARD FINANCIERO */}
        <View style={styles.dashboardContainer}>
           <View style={[styles.statCard, {backgroundColor: '#27ae60'}]}>
              <Text style={styles.statLabel}>Ventas Totales</Text>
              <Text style={styles.statValue}>Q{totalSold.toFixed(2)}</Text>
              <Text style={styles.statSub}>{completedOrders} pedidos cerrados</Text>
           </View>

           <View style={[styles.statCard, {backgroundColor: '#f39c12', marginLeft: 10}]}>
              <Text style={styles.statLabel}>Por Cobrar</Text>
              <Text style={styles.statValue}>Q{pendingPayment.toFixed(2)}</Text>
              <Text style={styles.statSub}>Dinero pendiente</Text>
           </View>
        </View>

        {/* 3. BOTONES DE HERRAMIENTAS (CLIENTES) */}
        <View style={{flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10}}>
            <TouchableOpacity 
              onPress={() => router.push('/admin/clients' as any)}
              style={styles.toolBtn}
            >
               <Ionicons name="people" size={20} color="#fff" />
               <Text style={styles.toolBtnText}>Directorio de Clientes</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de Movimientos</Text>
          <Ionicons name="receipt-outline" size={20} color="#666" />
        </View>
      </View>
    );
  };

  // --- RENDERIZADO DE PEDIDOS ---
  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>
           {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('es-GT') : 'Reciente'}
        </Text>
        
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            {/* Botón Imprimir (Deshabilitado temporalmente) */}
            <TouchableOpacity onPress={() => handlePrintReceipt(item)} style={styles.printBtn}>
               <Ionicons name="print-outline" size={20} color="#555" />
            </TouchableOpacity>

            <View style={[styles.badge, getBadgeStyle(item.status)]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items?.map((prod: any, index: number) => (
          <Text key={index} style={styles.productText} numberOfLines={1}>
            • {prod.name}
          </Text>
        ))}
      </View>

      <View style={styles.divider} />
      
      <View style={styles.cardFooter}>
        <Text style={styles.methodText}>{item.method || 'Venta'}</Text>
        <View style={styles.totalContainer}>
           <Text style={styles.totalLabel}>Total:</Text>
           <Text style={styles.totalValue}>Q{item.total?.toFixed(2)}</Text>
        </View>
      </View>

      {/* Botones de Acción */}
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
            <Text style={{color: '#999', marginTop: 10}}>No tienes movimientos registrados.</Text>
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
  avatarImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  welcome: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  businessName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: '#666' },
  logoutBtn: { padding: 10 },
  
  dashboardContainer: { flexDirection: 'row', marginBottom: 20, paddingHorizontal: 20 },
  statCard: { flex: 1, padding: 15, borderRadius: 16, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { color: 'white', fontSize: 24, fontWeight: 'bold', marginVertical: 5 },
  statSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },

  toolBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    backgroundColor: '#333', 
    padding: 12, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8,
    shadowColor: '#000', shadowOpacity: 0.1, elevation: 2
  },
  toolBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  list: { paddingBottom: 20 },
  
  card: { backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 15, marginHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  date: { color: '#888', fontSize: 12, fontWeight: '500' },
  
  printBtn: { padding: 6, backgroundColor: '#f0f0f0', borderRadius: 8, marginRight: 5 },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#555', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  itemsContainer: { marginBottom: 10 },
  productText: { fontSize: 15, color: '#444', marginBottom: 2 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  methodText: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  totalContainer: { flexDirection: 'row', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginRight: 5 },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  actionRow: { flexDirection: 'row', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderColor: '#f9f9f9', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1 },
  btnCancel: { backgroundColor: '#fff', borderColor: '#fadbd8' },
  btnConfirm: { backgroundColor: '#fff', borderColor: '#d4efdf' },
  btnText: { fontWeight: 'bold', fontSize: 12, marginLeft: 5 },
  empty: { alignItems: 'center', marginTop: 50 }
});