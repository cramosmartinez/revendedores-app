import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Linking, 
  ScrollView 
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CartModal() {
  // Traemos 'confirmOrder' que ahora es una función asíncrona (guarda en Firebase)
  const { items, total, removeItem, confirmOrder } = useCart();
  const router = useRouter();

  // --- LÓGICA PARA WHATSAPP ---
  const sendOrderToWhatsApp = () => {
    if (items.length === 0) return;

    // 1. Construimos el mensaje de texto para WhatsApp
    let message = "*📦 NUEVO PEDIDO RE-VENDEDOR*\n\n";
    message += "Hola, solicito los siguientes productos:\n\n";

    items.forEach((item, index) => {
      message += `${index + 1}. ${item.name} - Q${item.price.toFixed(2)}\n`;
    });

    message += `\n*TOTAL A PAGAR: Q${total.toFixed(2)}*`;
    message += "\n\nQuedo a la espera de confirmación.";

    // 2. Codificamos el mensaje y preparamos el Link
    // IMPORTANTE: Cambia el '50200000000' por tu número real
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/50200000000?text=${encodedMessage}`;

    // 3. Abrimos WhatsApp
    Linking.openURL(whatsappUrl)
      .then(() => {
        // 4. Esperamos un momento y preguntamos si se completó la venta
        setTimeout(() => {
          Alert.alert(
            "¿Confirmar Pedido?",
            "Si ya enviaste el mensaje por WhatsApp, ¿quieres registrar este pedido en la nube y vaciar el carrito?",
            [
              { text: "No, seguir editando", style: "cancel" },
              { 
                text: "Sí, Registrar Venta", 
                style: "default",
                // AQUÍ ESTÁ EL CAMBIO CLAVE: Hacemos la función async
                onPress: async () => {
                  try {
                    await confirmOrder(); // Esperamos a que Firebase guarde
                    router.back();        // Cerramos la pantalla
                    Alert.alert("¡Éxito!", "Tu pedido ha sido guardado en la nube.");
                  } catch (e) {
                    // El error ya se muestra en consola dentro del context, pero por seguridad:
                    Alert.alert("Error", "Hubo un problema guardando el pedido.");
                  }
                } 
              }
            ]
          );
        }, 1500); // 1.5 segundos de espera para dar tiempo al cambio de app
      })
      .catch((err) => {
        Alert.alert("Error", "No se pudo abrir WhatsApp");
        console.error(err);
      });
  };

  return (
    <View style={styles.container}>
      {/* Header Modal */}
      <View style={styles.header}>
        <Text style={styles.title}>Resumen del Pedido</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-circle" size={30} color="#ccc" />
        </TouchableOpacity>
      </View>
      
      {items.length === 0 ? (
        // --- ESTADO VACÍO ---
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#eee" />
          <Text style={styles.emptyText}>Tu carrito está vacío</Text>
          <TouchableOpacity style={styles.btnOutline} onPress={() => router.back()}>
            <Text style={styles.btnOutlineText}>Ir al Catálogo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // --- LISTA DE PRODUCTOS ---
        <>
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {items.map((item, index) => (
              <View key={index} style={styles.row}>
                {/* Info Izquierda */}
                <View style={styles.rowInfo}>
                   <Text style={styles.qty}>1x</Text>
                   <View style={styles.textContainer}>
                      <Text style={styles.name}>{item.name}</Text>
                      {/* Botón para borrar ítem individual */}
                      <TouchableOpacity onPress={() => removeItem(item.id)}>
                         <Text style={styles.removeText}>Eliminar</Text>
                      </TouchableOpacity>
                   </View>
                </View>
                
                {/* Precio Derecha */}
                <Text style={styles.price}>Q{item.price.toFixed(2)}</Text>
              </View>
            ))}
            
            {/* Divisor estilo ticket */}
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Estimado</Text>
              <Text style={styles.totalValue}>Q{total.toFixed(2)}</Text>
            </View>

            {/* Espacio extra al final del scroll */}
            <View style={{height: 40}} /> 
          </ScrollView>

          {/* Footer Fijo */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.whatsappBtn} onPress={sendOrderToWhatsApp}>
              <Ionicons name="logo-whatsapp" size={24} color="white" style={{ marginRight: 10 }} />
              <Text style={styles.whatsappText}>Enviar Pedido (WhatsApp)</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderColor: '#eee' 
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 20, fontSize: 18, color: '#999', marginBottom: 20 },
  btnOutline: { paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: '#007AFF', borderRadius: 8 },
  btnOutlineText: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
  
  // Lista
  listContainer: { flex: 1, padding: 20 },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20, 
    alignItems: 'flex-start' 
  },
  rowInfo: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 10 },
  textContainer: { flex: 1 },
  qty: { 
    fontWeight: 'bold', 
    color: '#007AFF', 
    marginRight: 12, 
    backgroundColor: '#E1F0FF', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6,
    overflow: 'hidden',
    fontSize: 14
  },
  name: { fontSize: 16, color: '#333', fontWeight: '500', marginBottom: 4 },
  removeText: { color: '#FF3B30', fontSize: 12, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: '700', color: '#333' },
  
  // Totales
  divider: { 
    height: 1, 
    backgroundColor: 'transparent', 
    marginVertical: 20, 
    borderStyle: 'dashed', 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 1 
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  totalValue: { fontSize: 26, fontWeight: '800', color: '#000' },

  // Footer
  footer: { 
    padding: 20, 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderColor: '#eee',
    paddingBottom: 40 // Ajuste para iPhone X/11/12/etc
  },
  whatsappBtn: { 
    backgroundColor: '#25D366', 
    padding: 16, 
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: "#000", 
    shadowOpacity: 0.15, 
    shadowRadius: 10, 
    elevation: 5 
  },
  whatsappText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});