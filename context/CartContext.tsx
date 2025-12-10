import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// --- FIREBASE IMPORTS ---
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig'; // Tu archivo de config

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
};

// La orden ahora tiene datos del usuario
export type Order = {
  id?: string;
  userId: string;
  userEmail: string;
  date: any; // Timestamp de Firebase
  total: number;
  items: Product[];
  status: 'pendiente' | 'completado';
};

type CartContextType = {
  items: Product[];
  total: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  confirmOrder: () => Promise<void>; // Ahora es una promesa (async)
};

const CartContext = createContext<CartContextType>({
  items: [],
  total: 0,
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  confirmOrder: async () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<Product[]>([]);
  const auth = getAuth(); // Para obtener el usuario actual

  // 1. CARGAR CARRITO LOCAL AL INICIO (El carrito sí se queda local por si se va el internet)
  useEffect(() => {
    loadCart();
  }, []);

  // 2. GUARDAR CARRITO LOCAL CUANDO CAMBIA
  useEffect(() => {
    saveCartLocal(items);
  }, [items]);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem('@my_app_cart');
      if (storedCart) setItems(JSON.parse(storedCart));
    } catch (e) { console.error(e); }
  };

  const saveCartLocal = async (cartItems: Product[]) => {
    try { await AsyncStorage.setItem('@my_app_cart', JSON.stringify(cartItems)); } 
    catch (e) { console.error(e); }
  };

  // --- LÓGICA DEL CARRITO ---
  const addItem = (product: Product) => {
    setItems((prev) => [...prev, product]);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => {
      const index = prev.findIndex((i) => i.id === productId);
      if (index > -1) {
        const newCart = [...prev];
        newCart.splice(index, 1);
        return newCart;
      }
      return prev;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  // --- ¡LA MAGIA DE LA NUBE! ---
  const confirmOrder = async () => {
    if (items.length === 0) return;
    
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión para confirmar pedidos.");
      return;
    }

    try {
      // 1. Preparamos la orden
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        items: items,
        total: items.reduce((sum, item) => sum + item.price, 0),
        date: serverTimestamp(), // Hora exacta del servidor
        status: 'pendiente'
      };

      // 2. Escribimos en la colección "orders" de Firebase
      await addDoc(collection(db, "orders"), orderData);

      // 3. Limpiamos carrito local
      setItems([]);
      
      // Nota: Ya no guardamos historial localmente, lo leeremos de la nube en el Perfil.
    } catch (error) {
      console.error("Error al subir pedido:", error);
      Alert.alert("Error", "No se pudo registrar el pedido en el sistema.");
      throw error; // Re-lanzamos para que la UI sepa que falló
    }
  };

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider 
      value={{ items, total, addItem, removeItem, clearCart, confirmOrder }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext); 