import { useState, useEffect } from 'react'
import AppointmentForm from '../components/AppointmentForm'
import AppointmentList from '../components/AppointmentList'

const API_BASE = 'http://localhost:3001/api'

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function fetchAgendamentos() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/agendamentos`)
      if (!res.ok) throw new Error('Erro ao buscar agendamentos.')
      const data = await res.json()
      setAgendamentos(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(formData) {
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Erro ao criar agendamento.')
      }
      await fetchAgendamentos()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/agendamentos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir agendamento.')
      await fetchAgendamentos()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUpdateStatus(id, status) {
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/agendamentos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar status.')
      await fetchAgendamentos()
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchAgendamentos()
  }, [])

  return (
    <div className="page-content">
      <h1>Agendamentos</h1>
      <p className="subtitle">Gerenciamento de clientes de maquiagem</p>

      <AppointmentForm onSubmit={handleCreate} />

      {error && <div className="error-msg">{error}</div>}

      <AppointmentList
        agendamentos={agendamentos}
        onDelete={handleDelete}
        onUpdateStatus={handleUpdateStatus}
        loading={loading}
      />
    </div>
  )
}
