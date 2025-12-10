import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Alert, Linking, ScrollView, ActivityIndicator
} from 'react-native';
import { useCart } from '../context/CartContext'; // Asumo que tu context expone 'clearCart'
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { db } from '../firebaseConfig'; 

export default function CartModal() {
  // Asegúrate de agregar clearCart en tu Context si no lo tienes
  const { items, total, removeItem, clearCart } = useCart(); 
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- LÓGICA CORREGIDA: DB PRIMERO, LUEGO WHATSAPP ---
  const sendOrderToWhatsApp = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      // 1. GUARDAR EN FIREBASE (Estado Pendiente)
      const orderData = {
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price })),
        total: total,
        status: "PENDIENTE",
        createdAt: serverTimestamp(),
        method: "Carrito"
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      const orderId = docRef.id;

      // 2. ARMAR MENSAJE CON ID DE PEDIDO
      let message = `*📦 NUEVO PEDIDO RE-VENDEDOR (Ref: ${orderId})*\n\n`;
      items.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - Q${item.price.toFixed(2)}\n`;
      });
      message += `\n*TOTAL: Q${total.toFixed(2)}*`;
      message += "\n\nQuedo a la espera de confirmación.";

      const encodedMessage = encodeURIComponent(message);
      // CAMBIA EL NÚMERO AQUÍ
      const whatsappUrl = `https://wa.me/50200000000?text=${encodedMessage}`;

      // 3. LIMPIAR CARRITO Y ABRIR WHATSAPP
      if (clearCart) clearCart(); // Limpiamos el carrito local
      
      Linking.openURL(whatsappUrl);
      router.back(); // Cerramos el modal

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Hubo un problema registrando el pedido en el sistema.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resumen del Pedido</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-circle" size={30} color="#ccc" />
        </TouchableOpacity>
      </View>
      
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#eee" />
          <Text style={styles.emptyText}>Tu carrito está vacío</Text>
          <TouchableOpacity style={styles.btnOutline} onPress={() => router.back()}>
            <Text style={styles.btnOutlineText}>Ir al Catálogo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {items.map((item, index) => (
              <View key={index} style={styles.row}>
                <View style={styles.rowInfo}>
                   <Text style={styles.qty}>1x</Text>
                   <View style={styles.textContainer}>
                      <Text style={styles.name}>{item.name}</Text>
                      <TouchableOpacity onPress={() => removeItem(item.id)}>
                          <Text style={styles.removeText}>Eliminar</Text>
                      </TouchableOpacity>
                   </View>
                </View>
                <Text style={styles.price}>Q{item.price.toFixed(2)}</Text>
              </View>
            ))}
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Estimado</Text>
              <Text style={styles.totalValue}>Q{total.toFixed(2)}</Text>
            </View>

            <View style={{height: 40}} /> 
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.whatsappBtn, loading && {opacity: 0.7}]} 
              onPress={sendOrderToWhatsApp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="logo-whatsapp" size={24} color="white" style={{ marginRight: 10 }} />
                  <Text style={styles.whatsappText}>Enviar Pedido (WhatsApp)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 20, fontSize: 18, color: '#999', marginBottom: 20 },
  btnOutline: { paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: '#007AFF', borderRadius: 8 },
  btnOutlineText: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
  listContainer: { flex: 1, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'flex-start' },
  rowInfo: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 10 },
  textContainer: { flex: 1 },
  qty: { fontWeight: 'bold', color: '#007AFF', marginRight: 12, backgroundColor: '#E1F0FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', fontSize: 14 },
  name: { fontSize: 16, color: '#333', fontWeight: '500', marginBottom: 4 },
  removeText: { color: '#FF3B30', fontSize: 12, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: '700', color: '#333' },
  divider: { height: 1, backgroundColor: 'transparent', marginVertical: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc', borderRadius: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  totalValue: { fontSize: 26, fontWeight: '800', color: '#000' },
  footer: { padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#eee', paddingBottom: 40 },
  whatsappBtn: { backgroundColor: '#25D366', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  whatsappText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});