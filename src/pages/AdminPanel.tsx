import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types';
import {
  ShoppingBag, Grid, Settings, ArrowLeft, Plus,
  Edit2, Trash2, Save, X, Image as ImageIcon, CheckCircle
} from 'lucide-react';

type Tab = 'products' | 'categories' | 'settings';

const emptyProduct = (): Partial<Product> => ({
  name: '', description: '', price: 0, image: '',
  category: '', subcategory: 'Todos', isCustomizable: false, isActive: true,
});

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { products, categories, settings, loading,
    addProduct, updateProduct, deleteProduct,
    addCategory, deleteCategory, updateSettings, uploadFile } = useData();
  const { theme, id: storeId } = useStore();

  const [tab, setTab] = useState<Tab>('products');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>(emptyProduct());
  const [formSettings, setFormSettings] = useState(settings);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setFormSettings(settings); }, [settings]);
  useEffect(() => {
    if (categories.length && !form.category) setForm(f => ({ ...f, category: categories[0].id }));
  }, [categories]);

  const accent = theme.accent;
  const bg = theme.bgSecondary;
  const bgCard = theme.bgMid;

  /* ── helpers ─── */
  const field = (label: string, node: React.ReactNode) => (
    <div className="space-y-1">
      <label className="text-[10px] uppercase font-bold tracking-widest block" style={{ color: `${accent}70` }}>{label}</label>
      {node}
    </div>
  );
  const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full rounded-xl p-3 text-sm outline-none border transition-all"
      style={{ background: theme.bgPrimary, borderColor: `${accent}25`, color: '#fff' }} />
  );
  const textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} rows={3} className="w-full rounded-xl p-3 text-sm outline-none border resize-none"
      style={{ background: theme.bgPrimary, borderColor: `${accent}25`, color: '#fff' }} />
  );
  const select = (props: React.SelectHTMLAttributes<HTMLSelectElement>, children: React.ReactNode) => (
    <select {...props} className="w-full rounded-xl p-3 text-sm outline-none border"
      style={{ background: theme.bgPrimary, borderColor: `${accent}25`, color: '#fff' }}>
      {children}
    </select>
  );

  const handleUpload = async (file: File, onDone: (url: string) => void) => {
    setUploading(true);
    try { const url = await uploadFile(file); onDone(url); }
    catch { alert('Erro no upload. Verifique o bucket Supabase.'); }
    finally { setUploading(false); }
  };

  const openAdd = () => { setEditing(null); setForm({ ...emptyProduct(), category: categories[0]?.id }); setShowForm(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm(p); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyProduct()); };

  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await updateProduct({ ...editing, ...form } as Product);
    else await addProduct(form as Product);
    closeForm();
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  /* ── sidebar items ── */
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'products', label: 'Produtos', icon: <ShoppingBag size={18} /> },
    { id: 'categories', label: 'Categorias', icon: <Grid size={18} /> },
    { id: 'settings', label: 'Configurações', icon: <Settings size={18} /> },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bgPrimary }}>
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: theme.bgPrimary, color: '#fff' }}>

      {/* ── Sidebar ── */}
      <aside className="w-60 flex-shrink-0 flex flex-col p-5 border-r hidden md:flex" style={{ background: bg, borderColor: `${accent}15` }}>
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-serif font-bold"
            style={{ borderColor: accent, color: accent }}>
            {storeId === 'tabacaria' ? 'TB' : 'AD'}
          </div>
          <span className="font-serif font-bold text-sm uppercase tracking-wider" style={{ color: accent }}>Admin</span>
        </div>

        <nav className="flex-grow space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all"
              style={tab === t.id
                ? { background: theme.gradientAccent, color: theme.bgPrimary }
                : { color: `${accent}80` }}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>

        <div className="space-y-2 mt-4">
          <Link to={`/${storeId}`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ color: `${accent}60` }}>
            <ArrowLeft size={14} /> Ver loja
          </Link>
          <button onClick={() => { sessionStorage.removeItem('admin_auth'); navigate('/admin'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold w-full text-red-400 hover:text-red-300 transition-all">
            <ArrowLeft size={14} /> Trocar loja / Sair
          </button>
        </div>
      </aside>

      {/* ── Mobile tab bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t" style={{ background: bg, borderColor: `${accent}15` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 flex flex-col items-center py-3 gap-1 text-[10px] font-bold transition-all"
            style={{ color: tab === t.id ? accent : `${accent}50` }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Main ── */}
      <main className="flex-grow overflow-y-auto p-6 md:p-10 pb-24 md:pb-10">
        <div className="max-w-5xl mx-auto">

          {/* ════ PRODUCTS TAB ════ */}
          {tab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-serif font-bold" style={{ color: accent }}>Produtos</h1>
                  <p className="text-xs mt-1" style={{ color: `${accent}60` }}>{products.length} cadastrados</p>
                </div>
                <button onClick={openAdd}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: theme.gradientCta, color: '#fff', boxShadow: theme.shadowCta }}>
                  <Plus size={16} /> Novo produto
                </button>
              </div>

              {/* Product table */}
              <div className="rounded-2xl overflow-hidden border" style={{ background: bg, borderColor: `${accent}15` }}>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest border-b" style={{ color: `${accent}50`, borderColor: `${accent}10` }}>
                      <th className="p-4">Produto</th>
                      <th className="p-4 hidden md:table-cell">Categoria</th>
                      <th className="p-4">Preço</th>
                      <th className="p-4 hidden sm:table-cell">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b transition-colors hover:bg-white/[0.02]" style={{ borderColor: `${accent}08` }}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border" style={{ borderColor: `${accent}20` }}>
                              {p.image
                                ? <img src={p.image} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center" style={{ background: bgCard }}><ImageIcon size={14} style={{ color: `${accent}40` }} /></div>}
                            </div>
                            <div>
                              <div className="text-sm font-bold">{p.name}</div>
                              <div className="text-[10px]" style={{ color: `${accent}50` }}>{p.subcategory}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell text-sm" style={{ color: `${accent}70` }}>{p.category}</td>
                        <td className="p-4 text-sm font-bold" style={{ color: accent }}>R$ {p.price?.toFixed(2)}</td>
                        <td className="p-4 hidden sm:table-cell">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.isActive !== false ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            {p.isActive !== false ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(p)} className="p-2 rounded-lg transition-all hover:bg-white/10" style={{ color: `${accent}80` }}><Edit2 size={14} /></button>
                            <button onClick={() => deleteProduct(p.id)} className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <div className="py-16 text-center text-sm" style={{ color: `${accent}40` }}>Nenhum produto cadastrado.</div>
                )}
              </div>
            </div>
          )}

          {/* ════ CATEGORIES TAB ════ */}
          {tab === 'categories' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-serif font-bold" style={{ color: accent }}>Categorias</h1>

              {/* Add category */}
              <div className="rounded-2xl p-6 border space-y-4" style={{ background: bg, borderColor: `${accent}15` }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: `${accent}60` }}>Nova categoria</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field('Nome', input({ placeholder: 'Ex: Charutos', value: newCatName, onChange: e => setNewCatName(e.target.value) }))}
                  {field('Subcategorias (separadas por vírgula)', input({ placeholder: 'Nacionais, Importados, Premium', value: form.subcategory, onChange: e => setForm({ ...form, subcategory: e.target.value }) }))}
                  <div className="md:col-span-2">
                    {field('Foto da categoria (URL ou upload)',
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-grow">
                            {input({ placeholder: 'https://...', value: newCatImage, onChange: e => setNewCatImage(e.target.value) })}
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer text-xs px-4 py-2 rounded-xl font-bold transition-all flex-shrink-0"
                            style={{ background: `${accent}20`, color: accent }}>
                            <ImageIcon size={14} />
                            {uploading ? '...' : 'Upload'}
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, url => setNewCatImage(url)); }} />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {newCatImage && <img src={newCatImage} className="h-24 rounded-xl object-cover border" style={{ borderColor: `${accent}20` }} />}
                <button
                  onClick={async () => { 
                    if (newCatName) { 
                      const subcats = form.subcategory ? ['Todos', ...form.subcategory.split(',').map(s => s.trim())] : ['Todos'];
                      await addCategory({
                        name: newCatName,
                        image: newCatImage,
                        subcategories: subcats
                      });
                      setNewCatName(''); 
                      setNewCatImage(''); 
                      setForm(f => ({ ...f, subcategory: 'Todos' }));
                    } 
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: theme.gradientAccent, color: theme.bgPrimary }}>
                  <Plus size={16} /> Adicionar categoria
                </button>
              </div>

              {/* Category list with visual cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {categories.map(c => (
                  <div key={c.id} className="relative rounded-2xl overflow-hidden border group" style={{ borderColor: `${accent}20` }}>
                    {c.image
                      ? <img src={c.image} className="w-full aspect-[4/3] object-cover" />
                      : <div className="w-full aspect-[4/3]" style={{ background: bgCard }} />}
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${theme.bgPrimary}EE, transparent 60%)` }} />
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end">
                      <span className="font-serif font-bold text-sm text-white">{c.name}</span>
                      <button onClick={() => deleteCategory(c.id)}
                        className="p-1.5 rounded-lg bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ SETTINGS TAB ════ */}
          {tab === 'settings' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-serif font-bold" style={{ color: accent }}>Configurações da Loja</h1>
              <div className="rounded-2xl p-8 border max-w-2xl" style={{ background: bg, borderColor: `${accent}15` }}>
                <form onSubmit={saveSettings} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {field('Nome da loja', input({ value: formSettings.name, onChange: e => setFormSettings({ ...formSettings, name: e.target.value }) }))}
                    {field('WhatsApp (55 + DDD + número)', input({ value: formSettings.whatsapp, onChange: e => setFormSettings({ ...formSettings, whatsapp: e.target.value }) }))}
                    {field('Slogan', input({ value: formSettings.slogan, onChange: e => setFormSettings({ ...formSettings, slogan: e.target.value }) }))}
                    {field('Instagram', input({ value: formSettings.instagram, placeholder: '@handle', onChange: e => setFormSettings({ ...formSettings, instagram: e.target.value }) }))}
                    <div className="md:col-span-2">
                      {field('Nicho / Descrição', input({ value: formSettings.niche, onChange: e => setFormSettings({ ...formSettings, niche: e.target.value }) }))}
                    </div>
                  </div>
                  <button type="submit"
                    className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: theme.gradientAccent, color: theme.bgPrimary }}>
                    {saved ? <><CheckCircle size={18} /> Salvo!</> : <><Save size={18} /> Salvar alterações</>}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Product Form Modal ── */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-3xl p-8 overflow-y-auto max-h-[92vh] border"
              style={{ background: bg, borderColor: `${accent}25` }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif font-bold" style={{ color: accent }}>{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={closeForm} style={{ color: `${accent}60` }} className="hover:text-white"><X size={22} /></button>
              </div>

              <form onSubmit={submitProduct} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {field('Nome *', input({ required: true, value: form.name, onChange: e => setForm({ ...form, name: e.target.value }) }))}
                  {field('Preço (R$) *', input({ type: 'number', step: '0.01', required: true, value: form.price, onChange: e => setForm({ ...form, price: parseFloat(e.target.value) }) }))}
                  <div className="md:col-span-2">
                    {field('Descrição', textarea({ value: form.description, onChange: e => setForm({ ...form, description: e.target.value }) }))}
                  </div>
                  {field('Categoria', select({ value: form.category, onChange: e => setForm({ ...form, category: e.target.value }) },
                    categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  ))}
                  {field('Subcategoria',
                    input({ placeholder: 'Ex: Importados', value: form.subcategory, onChange: e => setForm({ ...form, subcategory: e.target.value }) })
                  )}
                  {field('Preço de Atacado (R$)', 
                    input({ type: 'number', step: '0.01', value: form.wholesalePrice || '', onChange: e => setForm({ ...form, wholesalePrice: parseFloat(e.target.value) }) })
                  )}
                  {field('Qtd Mínima Atacado', 
                    input({ type: 'number', value: form.wholesaleMinQuantity || '', onChange: e => setForm({ ...form, wholesaleMinQuantity: parseInt(e.target.value) }) })
                  )}
                </div>

                {/* Photo upload */}
                {field('Foto do produto',
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-24 h-24 rounded-xl overflow-hidden border flex-shrink-0 flex items-center justify-center"
                        style={{ borderColor: `${accent}25`, background: theme.bgPrimary }}>
                        {form.image
                          ? <img src={form.image} className="w-full h-full object-cover" />
                          : <ImageIcon size={28} style={{ color: `${accent}30` }} />}
                      </div>
                      <div className="flex-grow space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer px-4 py-3 rounded-xl text-xs font-bold w-full justify-center transition-all hover:scale-105"
                          style={{ background: theme.gradientAccent, color: theme.bgPrimary }}>
                          <Plus size={14} /> {uploading ? 'Enviando...' : 'Carregar foto'}
                          <input type="file" accept="image/*,video/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, url => setForm({ ...form, image: url })); }} />
                        </label>
                        {input({ placeholder: 'Ou cole um link de imagem…', value: form.image, onChange: e => setForm({ ...form, image: e.target.value }) })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Toggles */}
                <div className="flex flex-wrap gap-5 pt-2 border-t" style={{ borderColor: `${accent}15` }}>
                  {[
                    { key: 'isActive' as keyof Product, label: 'Ativo na loja' },
                    { key: 'isCustomizable' as keyof Product, label: 'Produto especial / Kit' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={!!form[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.checked })}
                        className="w-4 h-4 rounded" />
                      <span style={{ color: `${accent}90` }}>{label}</span>
                    </label>
                  ))}
                </div>

                <button type="submit"
                  className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all hover:scale-[1.02]"
                  style={{ background: theme.gradientAccent, color: theme.bgPrimary, boxShadow: theme.shadowAccent }}>
                  <Save size={18} /> {editing ? 'Salvar alterações' : 'Cadastrar produto'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
