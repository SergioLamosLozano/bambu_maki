import { API_URL, API_BASE } from '../../config'
import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'

const API = `${API_BASE}`

// Paleta de marca
const BRAND = {
  yellow: '#ECDA35',
  green: '#75A721',
  red: '#FC2803',
  beige: '#C99B62',
  dark: '#112109',
}

const COLORS = [BRAND.yellow, BRAND.green, BRAND.red, BRAND.beige, '#a78bfa', '#38bdf8']

const fmt = (n) => `$${(n || 0).toLocaleString('es-CO')}`

// ── Tooltip personalizado ─────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, prefix = '$', suffix = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 shadow-xl">
      <p className="text-xs font-black text-gray-400 uppercase mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-black text-base" style={{ color: p.color }}>
          {prefix === '$' ? fmt(p.value) : `${p.value}${suffix}`}
          {' '}<span className="text-xs font-bold text-gray-400">{p.name}</span>
        </p>
      ))}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, icon, color }) => (
  <div
    className="rounded-3xl p-6 flex flex-col gap-2 relative overflow-hidden"
    style={{ background: '#fff', border: `2px solid ${color}20`, boxShadow: `0 4px 24px ${color}15` }}
  >
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-1"
      style={{ background: `${color}15` }}
    >
      {icon}
    </div>
    <p className="text-xs font-black uppercase tracking-wider text-gray-400">{label}</p>
    <p className="text-3xl font-black" style={{ color }}>{value}</p>
    {sub && <p className="text-xs font-bold text-gray-400">{sub}</p>}
    {/* accent bar */}
    <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-3xl" style={{ background: color }} />
  </div>
)

// ── Top Products Card ─────────────────────────────────────────────────────────
const TopProducts = ({ title, data, icon }) => (
  <div className="bg-white rounded-3xl p-6 border-2 border-gray-100">
    <h3 className="font-black text-sm uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
      <span>{icon}</span> {title}
    </h3>
    {!data?.length ? (
      <p className="text-gray-300 font-bold text-sm">Sin datos aún</p>
    ) : (
      <div className="space-y-3">
        {data.map((p, i) => {
          const max = data[0].qty
          const pct = (p.qty / max) * 100
          return (
            <div key={p.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-sm text-gray-700 truncate max-w-[70%]">
                  {i === 0 && <span className="mr-1">🥇</span>}
                  {i === 1 && <span className="mr-1">🥈</span>}
                  {i === 2 && <span className="mr-1">🥉</span>}
                  {p.name}
                </span>
                <span className="font-black text-sm" style={{ color: BRAND.green }}>
                  {p.qty} uds.
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: i === 0 ? BRAND.yellow : i === 1 ? BRAND.green : BRAND.beige }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
)

// ── Horas label ───────────────────────────────────────────────────────────────
const hourLabel = (h) => {
  const suffix = h >= 12 ? 'pm' : 'am'
  const display = h % 12 || 12
  return `${display}${suffix}`
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function Statistics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/orders/analytics`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="text-4xl mb-4">📊</div>
        <p className="font-black text-gray-400 uppercase tracking-widest text-sm">Cargando estadísticas...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="font-black text-red-500">{error}</p>
      </div>
    </div>
  )

  const { summary, revenue_by_day, top_day, top_week, top_month, orders_by_hour, delivery_split } = data

  // Rellenar días faltantes (últimos 14)
  const dayLabels = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dayLabels[key] = {
      day: key,
      label: d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
      revenue: 0,
      orders: 0
    }
  }
  revenue_by_day.forEach(r => {
    if (dayLabels[r.day]) {
      dayLabels[r.day].revenue = r.revenue
      dayLabels[r.day].orders = r.orders
    }
  })
  const revenueData = Object.values(dayLabels)

  // Horas: rellenar 0-23
  const hoursData = Array.from({ length: 24 }, (_, h) => {
    const found = orders_by_hour.find(r => r.hour === h)
    return { hour: hourLabel(h), count: found ? found.count : 0 }
  })

  // Delivery pie
  const deliveryData = delivery_split.map(d => ({
    name: d.type === 'domicilio' ? 'Domicilio' : 'Recoge en Local',
    value: d.count,
    revenue: d.revenue
  }))

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800">
          Estadísticas
        </h1>
        <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">
          Resumen de rendimiento del negocio
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Pedidos Hoy" value={summary.today_orders} icon="📦" color={BRAND.green} />
        <KPICard label="Ingresos Hoy" value={fmt(summary.today_revenue)} icon="💰" color={BRAND.yellow} />
        <KPICard label="Pedidos Semana" value={summary.week_orders} icon="📅" color={BRAND.beige} />
        <KPICard label="Ingresos Semana" value={fmt(summary.week_revenue)} icon="📈" color={BRAND.green} />
        <KPICard label="Pedidos Mes" value={summary.month_orders} icon="🗓️" color={BRAND.red} />
        <KPICard label="Ingresos Mes" value={fmt(summary.month_revenue)} icon="🏆" color={BRAND.red} />
      </div>

      {/* Ingresos por día — Área + Barras */}
      <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm">
        <h2 className="font-black text-sm uppercase tracking-wider text-gray-500 mb-6">
          📊 Ingresos últimos 14 días
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BRAND.green} stopOpacity={0.3} />
                <stop offset="95%" stopColor={BRAND.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Ingresos"
              stroke={BRAND.green}
              strokeWidth={3}
              fill="url(#revenueGrad)"
              dot={{ r: 4, fill: BRAND.green, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: BRAND.green }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Segunda fila: Top productos (día/semana/mes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TopProducts title="Más vendido hoy" data={top_day} icon="⚡️" />
        <TopProducts title="Más vendido esta semana" data={top_week} icon="📅" />
        <TopProducts title="Más vendido este mes" data={top_month} icon="🏆" />
      </div>

      {/* Tercera fila: Horas pico + Tipo de entrega */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horas pico */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm">
          <h2 className="font-black text-sm uppercase tracking-wider text-gray-500 mb-6">
            🕐 Pedidos por hora del día (30 días)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hoursData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={1} />
              <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip prefix="" suffix=" pedidos" />} />
              <Bar dataKey="count" name="Pedidos" fill={BRAND.yellow} radius={[6, 6, 0, 0]}>
                {hoursData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count === Math.max(...hoursData.map(h => h.count)) ? BRAND.red : BRAND.yellow}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs font-bold text-gray-400 mt-2 text-center">
            La barra <span className="text-red-500">roja</span> es tu hora pico
          </p>
        </div>

        {/* Pie de tipo entrega */}
        <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm">
          <h2 className="font-black text-sm uppercase tracking-wider text-gray-500 mb-4">
            🛵 Tipo de entrega (mes)
          </h2>
          {deliveryData.length === 0 ? (
            <p className="text-gray-300 font-bold text-sm mt-4">Sin datos aún</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={deliveryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deliveryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {deliveryData.map((d, i) => (
                  <div key={d.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-xs font-bold text-gray-600">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-gray-700">{d.value} pedidos</span>
                      <p className="text-[10px] font-bold text-gray-400">{fmt(d.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cuarta fila: Barras comparativas de pedidos diarios */}
      <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm">
        <h2 className="font-black text-sm uppercase tracking-wider text-gray-500 mb-6">
          📦 Pedidos completados últimos 14 días
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip prefix="" suffix=" pedidos" />} />
            <Bar dataKey="orders" name="Pedidos" fill={BRAND.beige} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
