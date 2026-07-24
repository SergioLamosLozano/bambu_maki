import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Products() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [description, setDescription] = useState('');
  const [includesRolls, setIncludesRolls] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  // New States
  const [productTypes, setProductTypes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newTypeId, setNewTypeId] = useState('');
  
  // Daily Roll States
  const [dailyRolls, setDailyRolls] = useState([
    { day_of_week: 0, product_variation_id: '', discount_price: '' },
    { day_of_week: 1, product_variation_id: '', discount_price: '' },
    { day_of_week: 2, product_variation_id: '', discount_price: '' },
    { day_of_week: 3, product_variation_id: '', discount_price: '' },
    { day_of_week: 4, product_variation_id: '', discount_price: '' },
    { day_of_week: 5, product_variation_id: '', discount_price: '' },
    { day_of_week: 6, product_variation_id: '', discount_price: '' },
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/products/');
      const types = response.data;
      setProductTypes(types);
      
      let allVariations = [];
      types.forEach(type => {
        allVariations = [...allVariations, ...type.variations];
      });
      setProducts(allVariations);
      
      // Fetch Daily Rolls Weekly Schedule
      const drRes = await axios.get('http://localhost:8000/api/products/daily_rolls');
      if (drRes.data && drRes.data.length > 0) {
        const fetchedRolls = drRes.data.map(dr => ({
          day_of_week: dr.day_of_week,
          product_variation_id: dr.product_variation_id,
          discount_price: dr.discount_price || ''
        }));
        
        // Merge with defaults for missing days
        setDailyRolls(prev => prev.map(d => {
          const found = fetchedRolls.find(f => f.day_of_week === d.day_of_week);
          return found || d;
        }));
      }
      
    } catch (error) {
      toast.error("Error al cargar productos");
      console.error("Error fetching products", error);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setNewName(item.name || '');
    setNewPrice(item.base_price || '');
    setDescription(item.description || '');
    setIncludesRolls(item.includes_rolls || 0);
    setPreview(item.image_url ? `http://localhost:8000${item.image_url}` : null);
    setFile(null);
    setIsCreating(false);
  };
  
  const openCreate = () => {
    setEditingItem({});
    setNewName('');
    setNewPrice('');
    setDescription('');
    setIncludesRolls(0);
    setPreview(null);
    setFile(null);
    setIsCreating(true);
    setNewTypeId(productTypes[0]?.id || '');
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSave = async () => {
    try {
      let imageUrl = editingItem.image_url;
      
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await axios.post('http://localhost:8000/api/upload/', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        imageUrl = uploadRes.data.url;
      }

      const payload = {
        name: newName,
        base_price: parseInt(newPrice) || 0,
        description,
        image_url: imageUrl,
        includes_rolls: parseInt(includesRolls) || 0
      };

      if (isCreating) {
        payload.product_type_id = newTypeId;
        await axios.post('http://localhost:8000/api/products/variations', payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        await axios.put(`http://localhost:8000/api/products/variations/${editingItem.id}`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      setEditingItem(null);
      setIsCreating(false);
      fetchProducts();
      toast.success(isCreating ? "Producto creado con éxito" : "Producto guardado con éxito");
    } catch (error) {
      console.error("Error saving item", error);
      toast.error("Hubo un error al guardar el producto");
    }
  };

  const handleSaveDailyRolls = async () => {
    try {
      // Filter out empty selections
      const validRolls = dailyRolls.filter(dr => dr.product_variation_id !== '');
      
      await axios.put(`http://localhost:8000/api/products/daily_rolls`, validRolls, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success("Programación semanal del Rollo del Día guardada con éxito");
    } catch (error) {
      console.error("Error saving daily rolls", error);
      toast.error("Hubo un error al guardar la programación");
    }
  };

  const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  
  const updateDailyRoll = (dayIndex, field, value) => {
    setDailyRolls(prev => {
      const newRolls = [...prev];
      newRolls[dayIndex] = { ...newRolls[dayIndex], [field]: value };
      return newRolls;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && editingItem) {
        setEditingItem(null);
        setIsCreating(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingItem]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold uppercase text-gray-800">Menú - Editor de Productos</h2>
        <button 
          onClick={openCreate}
          className="bg-green-500 hover:bg-green-600 text-white font-black py-2 px-6 rounded-xl transition-all shadow-sm"
        >
          + Crear Producto
        </button>
      </div>
      
      {/* Daily Roll Config */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-[2rem] p-6 mb-8 flex flex-col gap-4">
        <h3 className="text-xl font-black text-yellow-900 uppercase tracking-tight mb-2">⭐ Programación Semanal del Rollo del Día</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dailyRolls.map((dr, index) => (
            <div key={index} className="bg-white rounded-xl p-4 border-2 border-yellow-300 shadow-sm">
              <label className="block text-sm font-black text-yellow-800 uppercase tracking-widest mb-2">{dayNames[index]}</label>
              <select 
                value={dr.product_variation_id}
                onChange={(e) => updateDailyRoll(index, 'product_variation_id', e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-2 mb-3 text-sm font-bold text-gray-700 focus:outline-none"
              >
                <option value="">-- Sin promoción --</option>
                {products.filter(p => productTypes.find(t => t.id === p.product_type_id)?.slug === 'rollo').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input 
                type="number"
                value={dr.discount_price}
                onChange={(e) => updateDailyRoll(index, 'discount_price', e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-2 text-sm font-bold text-gray-700 focus:outline-none"
                placeholder="Precio tachado (ej: 25000)"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-2">
          <button 
            onClick={handleSaveDailyRolls}
            className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black py-3 px-8 rounded-xl transition-all shadow-md"
          >
            Guardar Toda la Semana
          </button>
        </div>
      </div>
      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow p-4 border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-lg">{item.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                {item.image_url && <img src={`http://localhost:8000${item.image_url}`} alt={item.name} className="h-32 w-full object-cover rounded-lg mb-2" />}
                <p className="font-bold text-green-600">${item.base_price}</p>
                {item.includes_rolls > 0 && (
                  <p className="text-xs font-bold text-yellow-600 mt-1 bg-yellow-100 p-1 rounded inline-block">
                    Incluye {item.includes_rolls} rollos
                  </p>
                )}
              </div>
              <button 
                onClick={() => openEdit(item)}
                className="mt-4 bg-yellow-300 hover:bg-yellow-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border-4 border-yellow-300 transform transition-all max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => { setEditingItem(null); setIsCreating(false); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-black mb-6 text-gray-800 uppercase tracking-tight pr-8">
              {isCreating ? "Crear Nuevo Producto" : <>Editando:<br/><span className="text-red-600">{editingItem.name}</span></>}
            </h3>

            {isCreating && (
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Categoría (Tipo)</label>
                <select 
                  value={newTypeId}
                  onChange={(e) => setNewTypeId(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:outline-none focus:border-yellow-400 transition-colors"
                >
                  {productTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre del Producto</label>
              <input 
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="Ej. Combo Familiar"
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Precio Base</label>
              <input 
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="Ej. 45000"
              />
            </div>
            
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Descripción</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:outline-none focus:border-yellow-400 transition-colors"
                rows="3"
                placeholder="Ej. Delicioso rollo con queso crema..."
              ></textarea>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">¿Cuántos rollos incluye? (Solo Combos)</label>
              <input 
                type="number"
                min="0"
                value={includesRolls}
                onChange={(e) => setIncludesRolls(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="Ej. 2"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Imagen de Referencia</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="w-full border-2 border-dashed border-yellow-300 bg-yellow-50 hover:bg-yellow-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors">
                  <span className="text-3xl mb-2">📸</span>
                  <span className="text-sm font-bold text-yellow-800">
                    {file ? file.name : 'Haz clic o arrastra una imagen aquí'}
                  </span>
                  <span className="text-xs text-yellow-600 mt-1">Formatos: JPG, PNG, WEBP</span>
                </div>
              </div>
              {preview && (
                <div className="mt-4 relative rounded-2xl overflow-hidden shadow-sm border-2 border-gray-100">
                  <img src={preview} alt="Preview" className="h-48 w-full object-cover" />
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-8">
              <button onClick={() => { setEditingItem(null); setIsCreating(false); }} className="px-6 py-3 bg-gray-100 text-gray-500 hover:bg-gray-200 font-bold uppercase rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-6 py-3 bg-green-500 text-white font-black uppercase rounded-xl hover:bg-green-600 hover:-translate-y-0.5 transition-all shadow-md shadow-green-200">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
