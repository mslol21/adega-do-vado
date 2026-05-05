import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, Category, GlobalOption, ShopSettings } from '../types';
import { supabase } from '../lib/supabase';
import type { StoreConfig } from '../types/store';

interface DataContextType {
  products: Product[];
  categories: Category[];
  globalOptions: GlobalOption[];
  settings: ShopSettings;
  loading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateSettings: (settings: ShopSettings) => Promise<void>;
  uploadFile: (file: File) => Promise<string>;
  addCategory: (category: Partial<Category>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addGlobalOption: (option: Partial<GlobalOption>) => Promise<void>;
  updateGlobalOption: (option: GlobalOption) => Promise<void>;
  deleteGlobalOption: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: React.ReactNode;
  storeConfig: StoreConfig;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, storeConfig }) => {
  const [products, setProducts] = useState<Product[]>(storeConfig.products);
  const [categories, setCategories] = useState<Category[]>(storeConfig.categories);
  const [globalOptions, setGlobalOptions] = useState<GlobalOption[]>([]);
  const [settings, setSettings] = useState<ShopSettings>({
    name: storeConfig.name,
    whatsapp: storeConfig.whatsapp,
    niche: storeConfig.niche,
    instagram: storeConfig.instagram,
    tiktok: storeConfig.tiktok,
    slogan: storeConfig.slogan,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeConfig.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeConfig.id)
        .order('created_at', { ascending: false });

      if (productsData && productsData.length > 0) {
        const mappedProducts = productsData.map(p => ({
          ...p,
          isCustomizable: p.is_customizable,
          isActive: p.is_active,
          availableColors: p.available_colors,
          hasNameOption: p.has_name_option,
          namePrice: p.name_price,
          variations: p.variations || [],
          customizationLists: p.customization_lists || [],
          wholesalePrice: p.wholesale_price,
          wholesaleMinQuantity: p.wholesale_min_quantity
        }));
        setProducts(mappedProducts);
      } else {
        setProducts(storeConfig.products);
      }

      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('store_id', storeConfig.id)
        .single();

      if (settingsData) setSettings(settingsData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeConfig.id)
        .order('name');

      if (catData && catData.length > 0) {
        setCategories(catData);
      } else {
        setCategories(storeConfig.categories);
      }

      const { data: optData } = await supabase.from('global_options').select('*').order('name');
      const mappedOptions = (optData || []).map(o => ({
        ...o,
        categoryIds: o.category_ids || []
      }));
      setGlobalOptions(mappedOptions);
      setLoading(false);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { error } = await supabase.from('products').insert([{
      store_id: storeConfig.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      subcategory: product.subcategory,
      is_customizable: product.isCustomizable,
      is_active: product.isActive,
      available_colors: product.availableColors,
      has_name_option: product.hasNameOption,
      variations: product.variations || [],
      customization_lists: product.customizationLists || [],
      name_price: product.namePrice,
      wholesale_price: product.wholesalePrice,
      wholesale_min_quantity: product.wholesaleMinQuantity
    }]).select();
    if (error) throw error;
    await fetchData();
  };

  const updateProduct = async (product: Product) => {
    // Ensure category exists to avoid foreign key violation (error 23503)
    if (product.category) {
      const cat = categories.find(c => c.id === product.category);
      if (cat) {
        await supabase.from('categories').upsert({
          id: cat.id,
          name: cat.name,
          image: cat.image,
          subcategories: cat.subcategories || ['Todos'],
          store_id: storeConfig.id
        });
      }
    }

    const { error } = await supabase.from('products').upsert({
      id: product.id,
      store_id: storeConfig.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      subcategory: product.subcategory,
      is_customizable: product.isCustomizable,
      is_active: product.isActive,
      available_colors: product.availableColors,
      has_name_option: product.hasNameOption,
      variations: product.variations || [],
      customization_lists: product.customizationLists || [],
      name_price: product.namePrice,
      wholesale_price: product.wholesalePrice,
      wholesale_min_quantity: product.wholesaleMinQuantity
    });
    if (error) throw error;
    await fetchData();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const updateSettings = async (newSettings: ShopSettings) => {
    const { error } = await supabase
      .from('settings')
      .upsert({ store_id: storeConfig.id, ...newSettings });
    if (error) throw error;
    setSettings(newSettings);
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${storeConfig.id}/${Math.random()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw uploadError;
    }
    const { data } = supabase.storage.from('products').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const addCategory = async (category: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ 
        id: category.name?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9), 
        name: category.name, 
        image: category.image,
        subcategories: category.subcategories || ['Todos'],
        store_id: storeConfig.id 
      }])
      .select();
    if (error) console.error(error);
    if (data) setCategories([...categories, data[0]]);
  };

  const updateCategory = async (category: Category) => {
    const { error } = await supabase.from('categories').update({ 
      name: category.name,
      image: category.image,
      subcategories: category.subcategories 
    }).eq('id', category.id);
    if (error) console.error(error);
    setCategories(categories.map(c => c.id === category.id ? category : c));
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) console.error(error);
    setCategories(categories.filter(c => c.id !== id));
  };

  const addGlobalOption = async (option: Partial<GlobalOption>) => {
    const dbOption = { ...option, category_ids: option.categoryIds };
    delete (dbOption as any).categoryIds;
    const { data, error } = await supabase.from('global_options').insert([dbOption]).select();
    if (error) console.error(error);
    if (data) {
      const mapped = { ...data[0], categoryIds: data[0].category_ids };
      setGlobalOptions([...globalOptions, mapped]);
    }
  };

  const updateGlobalOption = async (option: GlobalOption) => {
    const dbOption = { ...option, category_ids: option.categoryIds };
    delete (dbOption as any).categoryIds;
    const { error } = await supabase.from('global_options').update(dbOption).eq('id', option.id);
    if (error) console.error(error);
    setGlobalOptions(globalOptions.map(o => o.id === option.id ? option : o));
  };

  const deleteGlobalOption = async (id: string) => {
    const { error } = await supabase.from('global_options').delete().eq('id', id);
    if (error) console.error(error);
    setGlobalOptions(globalOptions.filter(o => o.id !== id));
  };

  return (
    <DataContext.Provider value={{
      products, settings, loading, categories, globalOptions,
      addProduct, updateProduct, deleteProduct, updateSettings, uploadFile,
      addCategory, updateCategory, deleteCategory,
      addGlobalOption, updateGlobalOption, deleteGlobalOption
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
