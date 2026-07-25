import { API_URL } from '../../config'
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function Options() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [productTypes, setProductTypes] = useState([])
  
  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  const [editingOption, setEditingOption] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  
  // Forms state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    product_type_id: '',
    is_required: false,
    max_selections: '',
    is_active: true,
    allow_quantity: false
  })
  
  const [optionForm, setOptionForm] = useState({
    name: '',
    extra_price: 0,
    emoji: '',
    is_active: true
  })

  const fetchData = async () => {
    try {
      const [catsRes, typesRes] = await Promise.all([
        axios.get(`${API_URL}/options/categories`),
        axios.get(`${API_URL}/products/`)
      ])
      setCategories(catsRes.data)
      setProductTypes(typesRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCategoryModalOpen(false)
        setIsOptionModalOpen(false)
        setEditingOption(null)
        setEditingCategory(null)
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const confirmDeleteCategory = (id, name) => {
    toast((t) => (
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-red-100 max-w-sm">
        <h3 className="font-black text-red-600 mb-2">¿Eliminar {name}?</h3>
        <p className="text-sm text-gray-600 mb-4">Esta acción también eliminará todas las opciones dentro de la categoría.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm">Cancelar</button>
          <button onClick={() => { handleDeleteCategory(id); toast.dismiss(t.id); }} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">Eliminar</button>
        </div>
      </div>
    ), { duration: Infinity })
  }

  const confirmDeleteOption = (id, name) => {
    toast((t) => (
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-red-100 max-w-sm">
        <h3 className="font-black text-red-600 mb-2">¿Eliminar {name}?</h3>
        <p className="text-sm text-gray-600 mb-4">Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm">Cancelar</button>
          <button onClick={() => { handleDeleteOption(id); toast.dismiss(t.id); }} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">Eliminar</button>
        </div>
      </div>
    ), { duration: Infinity })
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...categoryForm,
        product_type_id: categoryForm.product_type_id || null,
        max_selections: categoryForm.max_selections ? parseInt(categoryForm.max_selections) : null
      }
      
      if (editingCategory) {
        await axios.put(`${API_URL}/options/categories/${editingCategory.id}`, payload)
        toast.success('Categoría actualizada correctamente')
      } else {
        await axios.post(`${API_URL}/options/categories`, payload)
        toast.success('Categoría creada correctamente')
      }
      
      setIsCategoryModalOpen(false)
      setEditingCategory(null)
      setCategoryForm({ name: '', product_type_id: '', is_required: false, max_selections: '', is_active: true, allow_quantity: false })
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || (editingCategory ? "Error al actualizar categoría" : "Error al crear categoría"))
      console.error("Error saving category:", error)
    }
  }

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`${API_URL}/options/categories/${id}`)
      toast.success('Categoría eliminada')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar categoría")
      console.error("Error deleting category:", error)
    }
  }

  const handleSaveOption = async (e) => {
    e.preventDefault()
    try {
      if (editingOption) {
        await axios.put(`${API_URL}/options/options/${editingOption.id}`, optionForm)
        toast.success('Opción actualizada')
      } else {
        await axios.post(`${API_URL}/options/categories/${selectedCategory.id}/options`, optionForm)
        toast.success('Opción agregada')
      }
      setIsOptionModalOpen(false)
      setOptionForm({ name: '', extra_price: 0, emoji: '', is_active: true })
      setEditingOption(null)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || (editingOption ? "Error al actualizar" : "Error al agregar opción"))
      console.error("Error saving option:", error)
    }
  }

  const handleDeleteOption = async (id) => {
    try {
      await axios.delete(`${API_URL}/options/options/${id}`)
      toast.success('Opción eliminada')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar opción")
      console.error("Error deleting option:", error)
    }
  }

  if (loading) return <div className="p-8">Cargando opciones...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Opciones Adicionales</h1>
          <p className="text-gray-500 font-bold">Administra extras, gaseosas y salsas</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setCategoryForm({ name: '', product_type_id: '', is_required: false, max_selections: '', is_active: true, allow_quantity: false });
            setIsCategoryModalOpen(true);
          }}
          className="bg-[#FC2803] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#d82202] transition-colors shadow-lg"
        >
          + Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-3xl p-6 shadow-sm border-2 border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-black text-gray-800">{cat.name}</h2>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {cat.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                    {cat.product_type_id ? productTypes.find(t => t.id === cat.product_type_id)?.name : 'Global'}
                  </span>
                  {cat.allow_quantity && (
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-100 text-blue-700">
                      Permite Cantidad (+/-)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setEditingCategory(cat);
                    setCategoryForm({
                      name: cat.name,
                      product_type_id: cat.product_type_id || '',
                      is_required: cat.is_required,
                      max_selections: cat.max_selections || '',
                      is_active: cat.is_active,
                      allow_quantity: cat.allow_quantity
                    });
                    setIsCategoryModalOpen(true);
                  }}
                  className="text-gray-400 hover:text-blue-500 font-black px-2"
                >
                  ✎
                </button>
                <button onClick={() => confirmDeleteCategory(cat.id, cat.name)} className="text-red-500 hover:text-red-700 font-bold px-2">
                  X
                </button>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 border-b-2 border-gray-50 pb-2">Opciones</h3>
              <ul className="space-y-3 mb-6">
                {cat.options.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">Sin opciones</p>
                ) : (
                  cat.options.map(opt => (
                    <li key={opt.id} className={`flex justify-between items-center p-3 rounded-xl border ${opt.is_active ? 'bg-gray-50 border-gray-100' : 'bg-red-50/50 border-red-100 opacity-75'}`}>
                      <div className="flex items-center gap-2">
                        {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
                        <div>
                          <span className={`font-bold ${opt.is_active ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{opt.name}</span>
                          {!opt.is_active && <span className="ml-2 text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Inactiva</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-green-600 font-black">+${opt.extra_price.toLocaleString()}</span>
                        <button 
                          onClick={() => {
                            setSelectedCategory(cat);
                            setEditingOption(opt);
                            setOptionForm({ name: opt.name, extra_price: opt.extra_price, emoji: opt.emoji || '', is_active: opt.is_active });
                            setIsOptionModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-blue-500 font-black px-2"
                        >
                          ✎
                        </button>
                        <button onClick={() => confirmDeleteOption(opt.id, opt.name)} className="text-gray-400 hover:text-red-500 font-black px-2">x</button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
            
            <button 
              onClick={() => { 
                setSelectedCategory(cat);
                setEditingOption(null);
                setOptionForm({ name: '', extra_price: 0, emoji: '', is_active: true });
                setIsOptionModalOpen(true);
              }}
              className="w-full py-3 border-2 border-dashed border-[#FC2803] text-[#FC2803] rounded-2xl font-bold hover:bg-red-50 transition-colors"
            >
              + Agregar Opción
            </button>
          </div>
        ))}
      </div>

      {/* MODAL CATEGORIA */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
            <button 
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-black mb-6 pr-8">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Nombre de la Categoría</label>
                <input 
                  type="text" required
                  placeholder="Ej: Gaseosas, Adicionales..."
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold focus:border-[#FC2803] outline-none"
                  value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Aplica para</label>
                <select 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold focus:border-[#FC2803] outline-none"
                  value={categoryForm.product_type_id} onChange={e => setCategoryForm({...categoryForm, product_type_id: e.target.value})}
                >
                  <option value="">Global (Todos los productos)</option>
                  {productTypes.map(t => (
                    <option key={t.id} value={t.id}>Solo {t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border-2 border-gray-100 cursor-pointer" onClick={() => setCategoryForm({...categoryForm, allow_quantity: !categoryForm.allow_quantity})}>
                <input type="checkbox" checked={categoryForm.allow_quantity} readOnly className="w-5 h-5 accent-[#FC2803]" />
                <div>
                  <label className="font-bold text-gray-800 cursor-pointer">Permitir cantidad (+/-)</label>
                  <p className="text-xs text-gray-500">Actívalo para ítems como Gaseosas donde el cliente puede pedir varias.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border-2 border-gray-100 cursor-pointer" onClick={() => setCategoryForm({...categoryForm, is_active: !categoryForm.is_active})}>
                <input type="checkbox" checked={categoryForm.is_active} readOnly className="w-5 h-5 accent-[#FC2803]" />
                <label className="font-bold text-gray-800 cursor-pointer">Categoría Activa</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#FC2803] text-white font-bold rounded-xl hover:bg-[#d82202] transition-colors">
                  {editingCategory ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OPCION */}
      {isOptionModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
            <button 
              onClick={() => setIsOptionModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-black mb-6 pr-8">
              {editingOption ? 'Editar Opción' : `Agregar a ${selectedCategory.name}`}
            </h2>
            <form onSubmit={handleSaveOption} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">Nombre</label>
                <input 
                  type="text" required
                  placeholder="Ej: Coca Cola, Salsa Teriyaki"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold focus:border-[#FC2803] outline-none"
                  value={optionForm.name} onChange={e => setOptionForm({...optionForm, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Precio Extra</label>
                  <input 
                    type="number" min="0" required
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold focus:border-[#FC2803] outline-none"
                    value={optionForm.extra_price} onChange={e => setOptionForm({...optionForm, extra_price: e.target.value === '' ? '' : parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Emoji (Opcional)</label>
                  <input 
                    type="text" maxLength="2"
                    placeholder="🥤"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold focus:border-[#FC2803] outline-none text-center"
                    value={optionForm.emoji} onChange={e => setOptionForm({...optionForm, emoji: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border-2 border-gray-100 cursor-pointer" onClick={() => setOptionForm({...optionForm, is_active: !optionForm.is_active})}>
                <input type="checkbox" checked={optionForm.is_active} readOnly className="w-5 h-5 accent-[#FC2803]" />
                <label className="font-bold text-gray-800 cursor-pointer">Opción Activa</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsOptionModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#FC2803] text-white font-bold rounded-xl hover:bg-[#d82202] transition-colors">
                  {editingOption ? 'Guardar Cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
