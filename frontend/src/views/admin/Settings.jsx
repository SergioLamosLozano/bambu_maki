import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Save, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const Settings = () => {
  const { token } = useAuthStore()
  const [deliveryCost, setDeliveryCost] = useState('')
  const [whatsappTemplate, setWhatsappTemplate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings/')
      if (res.ok) {
        const data = await res.json()
        const delivery = data.find(s => s.key === 'delivery_cost')
        const whatsapp = data.find(s => s.key === 'whatsapp_template')
        
        if (delivery) setDeliveryCost(delivery.value)
        if (whatsapp) setWhatsappTemplate(whatsapp.value)
      }
    } catch (error) {
      console.error("Error fetching settings", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      // Save delivery cost
      await fetch('http://127.0.0.1:8000/api/settings/delivery_cost', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value: deliveryCost.toString() })
      })

      // Save whatsapp template
      await fetch('http://127.0.0.1:8000/api/settings/whatsapp_template', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value: whatsappTemplate })
      })

      setSaved(true)
      toast.success("Ajustes guardados correctamente")
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      toast.error("Error al guardar ajustes")
      console.error("Error saving settings", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8">Cargando ajustes...</div>
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black uppercase text-slate-800 mb-8 border-b border-gray-200 pb-4">
        Ajustes del Sistema
      </h1>

      <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        
        {/* Delivery Cost */}
        <div className="mb-8">
          <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">
            Precio de Domicilio ($)
          </label>
          <p className="text-xs text-gray-500 mb-3 font-bold">
            Este es el costo base de envío que se suma al total del carrito.
          </p>
          <input
            type="number"
            value={deliveryCost}
            onChange={(e) => setDeliveryCost(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 font-bold text-gray-700 focus:outline-none focus:border-yellow-400 transition-colors"
            required
            min="0"
          />
        </div>

        {/* WhatsApp Template */}
        <div className="mb-8">
          <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">
            Mensaje de WhatsApp
          </label>
          <p className="text-xs text-gray-500 mb-3 font-bold leading-relaxed">
            Personaliza el mensaje que se enviará al cliente cuando aceptes su pedido.
            <br/>
            <span className="text-red-500 font-black">Nota:</span> El número de pedido, tipo de entrega y costo total se adjuntarán <span className="underline">automáticamente</span> al final del mensaje.
          </p>
          <textarea
            value={whatsappTemplate}
            onChange={(e) => setWhatsappTemplate(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 font-bold text-gray-700 focus:outline-none focus:border-yellow-400 transition-colors"
            rows="4"
            required
            placeholder="Ej. ¡Hola! Tu pedido en Bambu Maki ha sido ACEPTADO..."
          ></textarea>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-black uppercase tracking-wider py-4 px-8 rounded-xl transition-all w-full md:w-auto"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>

          {saved && (
            <span className="flex items-center gap-2 text-green-600 font-bold animate-pulse">
              <CheckCircle size={20} /> Guardado con éxito
            </span>
          )}
        </div>

      </form>
    </div>
  )
}

export default Settings
