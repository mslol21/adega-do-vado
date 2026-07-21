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
  flavors?: string;
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
}

export type CartItem = Product & {
  quantity: number;
  selectedVariation?: any;
  selectedFlavor?: string;
}

export type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product) => void;
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
  deliveryFee?: number;
  deliveryInfo?: string;
}

// Dummy export to ensure this is treated as a module with values if needed
export const TYPES_VERSION = "1.0.0";
