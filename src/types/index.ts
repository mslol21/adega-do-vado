export type Category = {
  id: string;
  name: string;
  image?: string;
  subcategories?: string[];
}

export type GlobalOption = {
  id: string;
  type: 'color' | 'assembly';
  name: string;
  price?: number;
  image?: string;
  categoryIds?: string[];
  group?: string; // e.g., 'Entremeio', 'Crucifixo'
}

export type Variation = {
  id: string;
  name: string;
  price: number;
  image: string;
}

export type CustomizationList = {
  id: string;
  title: string;
  options: string; // Comma separated
}

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  category?: string;
  subcategory?: string;
  isCustomizable?: boolean;
  isActive?: boolean;
  flavors?: string | string[];
  hasNameOption?: boolean;
  namePrice?: number;
  variations?: Variation[];
  customizationLists?: CustomizationList[];
  selectedVariation?: any;
  selectedFlavor?: string;
  wholesalePrice?: number;
  wholesaleMinQuantity?: number;
  stockQuantity?: number;
  promotionalPrice?: number;
  barcode?: string;
}

export type CartItem = Product & {
  quantity: number;
  selectedVariation?: any;
  selectedFlavor?: string;
}

export type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string, productName?: string, selectedFlavor?: string) => void;
  updateQuantity: (productId: string, quantity: number, productName?: string, selectedFlavor?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

export type ShopSettings = {
  name: string;
  whatsapp: string;
  niche: string;
  instagram: string;
  tiktok: string;
  slogan: string;
  storeCep?: string;
  deliveryFeePerKm?: number;
  deliveryBaseFee?: number;
  deliveryInfo?: string;
}

// ==========================================
// NEW SYSTEM TYPES (ORDERS, OPERATIONAL)
// ==========================================

export type ProfileRole = 'ADMIN' | 'GERENTE' | 'ATENDENTE' | 'RECEBIMENTO' | 'PREPARACAO' | 'SEPARACAO' | 'ENTREGA';

export type Profile = {
  id: string;
  user_id: string;
  store_id: string;
  role: ProfileRole;
  name: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'NOVO'
  | 'RECEBIDO'
  | 'EM_PREPARACAO'
  | 'EM_SEPARACAO'
  | 'SEPARADO'
  | 'PRONTO'
  | 'AGUARDANDO_RETIRADA'
  | 'EM_ENTREGA'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | 'AGUARDANDO_PAGAMENTO';

export type OrderSource = 'ONLINE' | 'INTERNO' | 'WHATSAPP';
export type OrderType = 'DELIVERY' | 'RETIRADA' | 'BALCAO';

export type Customer = {
  id: string;
  store_id: string;
  name: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  created_at?: string;
  updated_at?: string;
}

export type OrderItem = {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  options?: any;
  notes?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export type Order = {
  id: string;
  store_id: string;
  order_number: number;
  source: OrderSource;
  order_type: OrderType;
  status: OrderStatus;
  
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  
  delivery_cep?: string;
  delivery_street?: string;
  delivery_number?: string;
  delivery_complement?: string;
  delivery_neighborhood?: string;
  delivery_city?: string;
  delivery_state?: string;
  
  payment_method?: 'pix' | 'card' | 'cash' | string;
  payment_status?: string;
  amount_received?: number;
  change_for?: number;
  
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  
  notes?: string;
  
  created_by?: string;
  received_by?: string;
  preparing_by?: string;
  separating_by?: string;
  delivery_by?: string;
  
  created_at: string;
  updated_at: string;
  received_at?: string;
  preparing_at?: string;
  separating_at?: string;
  ready_at?: string;
  delivery_started_at?: string;
  delivered_at?: string;
  completed_at?: string;
  
  cancelled_at?: string;
  cancelled_by?: string;
  cancel_reason?: string;

  // Relações (opcional)
  items?: OrderItem[];
}

export type OrderStatusHistory = {
  id: string;
  order_id: string;
  store_id: string;
  from_status?: OrderStatus;
  to_status: OrderStatus;
  changed_by?: string;
  changed_at: string;
  notes?: string;
}

// Dummy export to ensure this is treated as a module with values if needed
export const TYPES_VERSION = "1.1.0";
