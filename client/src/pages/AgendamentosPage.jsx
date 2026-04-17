import { useState, useEffect } from 'react'
import AppointmentForm from '../components/AppointmentForm'
import AppointmentList from '../components/AppointmentList'
import EditModal from '../components/EditModal'
import Toast, { useToast } from '../components/Toast'

const API_BASE = 'http://localhost:3001/api'

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editAgendamento, setEditAgendamento] = useState(null)
  const { toasts, addToast } = useToast()

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
      addToast('Agendamento criado com sucesso!')
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
      addToast('Agendamento excluído.')
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
      addToast('Status atualizado.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleEdit(id, formData) {
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/agendamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Erro ao editar agendamento.')
      }
      setEditAgendamento(null)
      await fetchAgendamentos()
      addToast('Agendamento atualizado!')
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
      <p className="subtitle">Gerenciamento de clientes</p>

      <AppointmentForm onSubmit={handleCreate} />

      {error && <div className="error-msg">{error}</div>}

      <AppointmentList
        agendamentos={agendamentos}
        onDelete={handleDelete}
        onUpdateStatus={handleUpdateStatus}
        onEdit={ag => setEditAgendamento(ag)}
        loading={loading}
      />

      {editAgendamento && (
        <EditModal
          agendamento={editAgendamento}
          onSave={handleEdit}
          onClose={() => setEditAgendamento(null)}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  )
}
