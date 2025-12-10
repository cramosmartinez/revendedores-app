// Definimos la forma de un Producto (Interface)
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string; // Agregamos descripción
}

export const PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Zapatillas Runner', 
    price: 250.00, 
    category: 'Calzado', 
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    description: 'Zapatillas ideales para correr largas distancias. Suela de espuma reactiva y tejido transpirable.'
  },
  { 
    id: '2', 
    name: 'Camiseta DryFit', 
    price: 120.00, 
    category: 'Ropa', 
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400',
    description: 'Tecnología de secado rápido. Perfecta para el gimnasio o días calurosos.'
  },
  { 
    id: '3', 
    name: 'Gorra Urbana', 
    price: 85.00, 
    category: 'Accesorios', 
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400',
    description: 'Estilo moderno con ajuste trasero. Protección UV garantizada.'
  },
  { 
    id: '4', 
    name: 'Mochila Sport', 
    price: 300.00, 
    category: 'Accesorios', 
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    description: 'Gran capacidad con compartimento para laptop y botella de agua.'
  },
  { 
    id: '5', 
    name: 'Hoodie Negra', 
    price: 350.00, 
    category: 'Ropa', 
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    description: 'Sudadera con capucha, interior suave y bolsillo tipo canguro.'
  },
  { 
    id: '6', 
    name: 'Reloj Smart', 
    price: 450.00, 
    category: 'Tech', 
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    description: 'Monitorea tu ritmo cardíaco, pasos y notificaciones. Batería de larga duración.'
  },
];