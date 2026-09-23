import { DataContext } from './useData';
import React, { useState, useEffect, useCallback } from 'react';
import type { Product, Category, GlobalOption, ShopSettings } from '../types';
import { supabase, isOfflineMode } from '../lib/supabase';
import type { StoreConfig } from '../types/store';
import { catalogQuery, catalogPages } from '../utils/catalogQuery';

interface DataProviderProps {
  children: React.ReactNode;
  storeConfig: StoreConfig;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, storeConfig }) => {
  const [products, setProducts] = useState<Product[]>(isOfflineMode ? storeConfig.products : []);
  const [categories, setCategories] = useState<Category[]>(isOfflineMode ? storeConfig.categories : []);
  const [globalOptions, setGlobalOptions] = useState<GlobalOption[]>([]);
  const [settings, setSettings] = useState<ShopSettings>({
    name: storeConfig.name,
    whatsapp: storeConfig.whatsapp,
    niche: storeConfig.niche,
    instagram: storeConfig.instagram,
    tiktok: storeConfig.tiktok,
    slogan: storeConfig.slogan,
    storeCep: storeConfig.storeCep,
    deliveryFeePerKm: storeConfig.deliveryFeePerKm,
    deliveryBaseFee: storeConfig.deliveryBaseFee,
  });
  const [loading, setLoading] = useState(!isOfflineMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [productsLoaded, setProductsLoaded] = useState(isOfflineMode);

  const fetchData = useCallback(() => {
    if (isOfflineMode) return Promise.resolve();
    return Promise.all([
      catalogPages((from, to, signal) => supabase.from('products').select('*').eq('store_id', storeConfig.id).order('created_at', { ascending: false }).order('id').range(from, to).abortSignal(signal)),
      catalogQuery(signal => supabase.from('settings').select('*').eq('store_id', storeConfig.id).abortSignal(signal).maybeSingle()),
      catalogQuery(signal => supabase.from('categories').select('*').eq('store_id', storeConfig.id).order('name').abortSignal(signal)),
      catalogQuery(signal => supabase.from('global_options').select('*').order('name').abortSignal(signal)),
    ]).then(([
      { data: productsData, error: productsError },
      { data: settingsData, error: settingsError },
      { data: catData, error: categoriesError },
      { data: optData, error: optionsError },
    ]) => {
      const failures = [
        ['produtos', productsError], ['categorias', categoriesError],
        ['configurações', settingsError], ['opções', optionsError],
      ].filter(([, error]) => error);
      failures.forEach(([resource, error]) => console.error(`Erro ao carregar ${resource}:`, error));
      setLoadError(failures.length
        ? `Não foi possível atualizar: ${failures.map(([name]) => name).join(', ')}. Os dados anteriores, quando disponíveis, foram mantidos. Tente novamente.`
        : null);

      if (!productsError) {
      if (productsData && productsData.length > 0) {
        const mappedProducts = productsData.map(p => ({
          ...p,
          images: p.images || [],
          isCustomizable: p.is_customizable,
          isActive: p.is_active,
          flavors: p.available_colors,
          hasNameOption: p.has_name_option,
          namePrice: p.name_price !== null && p.name_price !== undefined ? parseFloat(String(p.name_price).replace(',', '.')) : undefined,
          variations: p.variations || [],
          customizationLists: p.customization_lists || [],
          price: p.price !== null && p.price !== undefined ? parseFloat(String(p.price).replace(',', '.')) : 0,
          wholesalePrice: p.wholesale_price !== null && p.wholesale_price !== undefined && p.wholesale_price !== '' ? parseFloat(String(p.wholesale_price).replace(',', '.')) : undefined,
          wholesaleMinQuantity: p.wholesale_min_quantity !== null && p.wholesale_min_quantity !== undefined && p.wholesale_min_quantity !== '' ? parseInt(String(p.wholesale_min_quantity), 10) : undefined,
          stockQuantity: p.stock_quantity !== null && p.stock_quantity !== undefined && p.stock_quantity !== '' ? parseInt(String(p.stock_quantity), 10) : 0,
          promotionalPrice: p.promotional_price !== null && p.promotional_price !== undefined && p.promotional_price !== '' ? parseFloat(String(p.promotional_price).replace(',', '.')) : undefined
        }));
        setProducts(mappedProducts);
      } else {
        setProducts([]);
      }
      setProductsLoaded(true);
      }

      if (!settingsError && settingsData) setSettings(settingsData);

      if (!categoriesError) {
      if (catData && catData.length > 0) {
        setCategories(catData);
      } else {
        setCategories([]);
      }
      }

      if (!optionsError) {
      const mappedOptions = (optData || []).map(o => ({
        ...o,
        categoryIds: o.category_ids || []
      }));
      setGlobalOptions(mappedOptions);
      }

    }).catch(error => {
      console.error('Error fetching data:', error);
      setLoadError('Não foi possível atualizar o catálogo. Verifique sua conexão e tente novamente.');
    }).finally(() => setLoading(false));
  }, [storeConfig.id]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (isOfflineMode) {
      const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) } as Product;
      setProducts([newProduct, ...products]);
      return;
    }

    // Ensure category exists in Supabase to avoid foreign key violation (error 23503)
    // This covers both DB categories and locally-defined categories from config
    if (product.category) {
      // First try to find in current state, else fall back to storeConfig.categories
      const cat =
        categories.find(c => c.id === product.category) ||
        storeConfig.categories.find(c => c.id === product.category);

      if (cat) {
        const { error: catError } = await supabase.from('categories').upsert(
          {
            id: cat.id,
            name: cat.name,
            image: cat.image ?? '',
            subcategories: cat.subcategories || ['Todos'],
            store_id: storeConfig.id,
          },
          { onConflict: 'id' }
        );
        if (catError) {
          console.error('Erro ao sincronizar categoria antes do produto:', catError);
          // Don't throw here — proceed and let the product insert show the real error
        }
      }
    }

    const { error } = await supabase.from('products').insert([{
      store_id: storeConfig.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      images: product.images || [],
      category: product.category,
      subcategory: product.subcategory,
      is_customizable: product.isCustomizable ?? false,
      is_active: product.isActive ?? true,
      available_colors: product.flavors ?? null,
      has_name_option: product.hasNameOption ?? false,
      variations: product.variations || [],
      customization_lists: product.customizationLists || [],
      name_price: product.namePrice ?? null,
      wholesale_price: product.wholesalePrice ?? null,
      wholesale_min_quantity: product.wholesaleMinQuantity ?? null,
      stock_quantity: product.stockQuantity ?? 0,
      promotional_price: product.promotionalPrice ?? null,
    }]).select();

    if (error) {
      const msg = `Código: ${error.code}\nMensagem: ${error.message}\nDetalhes: ${error.details ?? ''}\nDica: ${error.hint ?? ''}`;
      console.error('Erro detalhado do Supabase (addProduct):', error);
      throw new Error(msg);
    }
    await fetchData();
  };

  const updateProduct = async (product: Product) => {
    if (isOfflineMode) {
      setProducts(products.map(p => p.id === product.id ? product : p));
      return;
    }

    // Ensure category exists in Supabase to avoid foreign key violation (error 23503)
    if (product.category) {
      const cat =
        categories.find(c => c.id === product.category) ||
        storeConfig.categories.find(c => c.id === product.category);

      if (cat) {
        const { error: catError } = await supabase.from('categories').upsert(
          {
            id: cat.id,
            name: cat.name,
            image: cat.image ?? '',
            subcategories: cat.subcategories || ['Todos'],
            store_id: storeConfig.id,
          },
          { onConflict: 'id' }
        );
        if (catError) console.error('Erro ao sincronizar categoria antes de updateProduct:', catError);
      }
    }

    const { error } = await supabase.from('products').upsert({
      id: product.id,
      store_id: storeConfig.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      images: product.images || [],
      category: product.category,
      subcategory: product.subcategory,
      is_customizable: product.isCustomizable ?? false,
      is_active: product.isActive ?? true,
      available_colors: product.flavors ?? null,
      has_name_option: product.hasNameOption ?? false,
      variations: product.variations || [],
      customization_lists: product.customizationLists || [],
      name_price: product.namePrice ?? null,
      wholesale_price: product.wholesalePrice ?? null,
      wholesale_min_quantity: product.wholesaleMinQuantity ?? null,
      stock_quantity: product.stockQuantity ?? 0,
      promotional_price: product.promotionalPrice ?? null,
    });
    if (error) {
      const msg = `Código: ${error.code}\nMensagem: ${error.message}\nDetalhes: ${error.details ?? ''}\nDica: ${error.hint ?? ''}`;
      console.error('Erro detalhado do Supabase (updateProduct):', error);
      throw new Error(msg);
    }
    await fetchData();
  };

  const deleteProduct = async (id: string) => {
    if (isOfflineMode) {
      setProducts(products.filter(p => p.id !== id));
      return;
    }
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const updateSettings = async (newSettings: ShopSettings) => {
    if (isOfflineMode) {
      setSettings(newSettings);
      return;
    }
    const { error } = await supabase
      .from('settings')
      .upsert({ store_id: storeConfig.id, ...newSettings });
    if (error) throw error;
    setSettings(newSettings);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const uploadFile = async (file: File) => {
    if (isOfflineMode) {
      return await fileToBase64(file);
    }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeConfig.id}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
      if (uploadError) {
        console.warn('Erro ou Bucket Supabase "products" nao encontrado. Convertendo para Base64:', uploadError);
        return await fileToBase64(file);
      }
      const { data } = supabase.storage.from('products').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.warn('Erro ao enviar imagem ao Supabase. Aplicando fallback Base64:', err);
      return await fileToBase64(file);
    }
  };

  const addCategory = async (category: Partial<Category>) => {
    const newId = category.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || Math.random().toString(36).substr(2, 9);
    if (isOfflineMode) {
      setCategories([...categories, { id: newId, name: category.name || '', image: category.image || '', subcategories: category.subcategories || ['Todos'] }]);
      return;
    }
    const { data, error } = await supabase
      .from('categories')
      .insert([{ 
        id: category.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || Math.random().toString(36).substr(2, 9), 
        name: category.name, 
        image: category.image ?? '',
        subcategories: category.subcategories || ['Todos'],
        store_id: storeConfig.id 
      }])
      .select();
    if (error) {
      const msg = `Código: ${error.code}\nMensagem: ${error.message}\nDetalhes: ${error.details ?? ''}`;
      console.error('Erro ao adicionar categoria:', error);
      throw new Error(msg);
    }
    if (data) setCategories([...categories, data[0]]);
  };

  const updateCategory = async (category: Category) => {
    if (isOfflineMode) {
      setCategories(categories.map(c => c.id === category.id ? category : c));
      return;
    }
    const { error } = await supabase.from('categories').update({ 
      name: category.name,
      image: category.image,
      subcategories: category.subcategories 
    }).eq('id', category.id);
    if (error) console.error(error);
    setCategories(categories.map(c => c.id === category.id ? category : c));
  };

  const deleteCategory = async (id: string) => {
    if (isOfflineMode) {
      setCategories(categories.filter(c => c.id !== id));
      return;
    }
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) console.error(error);
    setCategories(categories.filter(c => c.id !== id));
  };

  const addGlobalOption = async (option: Partial<GlobalOption>) => {
    if (isOfflineMode) {
      setGlobalOptions([...globalOptions, { ...option, id: Math.random().toString(36).substr(2, 9) } as GlobalOption]);
      return;
    }
    const { categoryIds, ...fields } = option;
    const dbOption = { ...fields, category_ids: categoryIds };
    const { data, error } = await supabase.from('global_options').insert([dbOption]).select();
    if (error) console.error(error);
    if (data) {
      const mapped = { ...data[0], categoryIds: data[0].category_ids };
      setGlobalOptions([...globalOptions, mapped]);
    }
  };

  const updateGlobalOption = async (option: GlobalOption) => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setGlobalOptions(globalOptions.map(o => o.id === option.id ? option : o));
      return;
    }
    const { categoryIds, ...fields } = option;
    const dbOption = { ...fields, category_ids: categoryIds };
    const { error } = await supabase.from('global_options').update(dbOption).eq('id', option.id);
    if (error) console.error(error);
    setGlobalOptions(globalOptions.map(o => o.id === option.id ? option : o));
  };

  const deleteGlobalOption = async (id: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setGlobalOptions(globalOptions.filter(o => o.id !== id));
      return;
    }
    const { error } = await supabase.from('global_options').delete().eq('id', id);
    if (error) console.error(error);
    setGlobalOptions(globalOptions.filter(o => o.id !== id));
  };

  const applyStockSnapshot = useCallback((stock: { id: string; stock_quantity: number }[]) => {
    setProducts(prev => prev.map(p => {
      const updated = stock.find(item => item.id === p.id);
      return updated ? { ...p, stockQuantity: updated.stock_quantity } : p;
    }));
  }, []);

  return (
    <DataContext.Provider value={{
      products, settings, loading, categories, globalOptions,
      addProduct, updateProduct, deleteProduct, updateSettings, uploadFile,
      addCategory, updateCategory, deleteCategory,
      addGlobalOption, updateGlobalOption, deleteGlobalOption, applyStockSnapshot
    }}>
      {loadError && <div role="alert" className="bg-red-950 text-white p-4">
        {loadError} <button type="button" onClick={() => void fetchData()} className="underline">Tentar novamente</button>
      </div>}
      {!loading && !productsLoaded ? (
        <div role="status" className="p-8 text-center text-white">
          Catálogo indisponível no momento. Não foi possível consultar os produtos cadastrados.
        </div>
      ) : children}
    </DataContext.Provider>
  );
};
