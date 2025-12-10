import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tu configuración real de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAe2gzNPKxxdy1yb0qzE1q6w9GkSVqp6MA",
  authDomain: "revendedores-app-2c39b.firebaseapp.com",
  projectId: "revendedores-app-2c39b",
  storageBucket: "revendedores-app-2c39b.firebasestorage.app",
  messagingSenderId: "230062083290",
  appId: "1:230062083290:web:e5709bd3d7f3e28fdf29e3"
};

// Inicializamos la conexión
const app = initializeApp(firebaseConfig);

// Exportamos la base de datos para usarla en la app
export const db = getFirestore(app);