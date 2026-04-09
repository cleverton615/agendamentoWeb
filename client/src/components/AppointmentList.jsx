import { useState } from 'react'

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatValor(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const STATUS_LABEL = {
  pendente:  'Pendente',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
}

export default function AppointmentList({ agendamentos, onDelete, onUpdateStatus, loading }) {
  const [confirmId, setConfirmId] = useState(null)

  function handleDeleteClick(id) {
    setConfirmId(id)
  }

  function handleConfirm(id) {
    setConfirmId(null)
    onDelete(id)
  }

  function handleCancel() {
    setConfirmId(null)
  }

  return (
    <div className="list-section">
      <h2>Agendamentos</h2>

      {loading && <div className="loading-msg">Carregando...</div>}

      {!loading && agendamentos.length === 0 && (
        <div className="empty-msg">Nenhum agendamento encontrado.</div>
      )}

      {!loading && agendamentos.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Data</th>
                <th>Horário</th>
                <th>Maquiagem</th>
                <th>Adiantamento</th>
                <th>Penteado</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map(ag => (
                <tr key={ag.id} className={ag.status === 'cancelado' ? 'row-cancelado' : ''}>
                  <td>{ag.nome}</td>
                  <td>{formatDate(ag.data)}</td>
                  <td>{ag.hora}</td>
                  <td>
                    {ag.valor_maquiagem != null
                      ? <span className="icon-yes">{formatValor(ag.valor_maquiagem)}</span>
                      : <span className="icon-no">—</span>
                    }
                  </td>
                  <td>
                    {ag.adiantamento
                      ? ag.valor_adiantamento != null
                        ? <span className="icon-yes">{formatValor(ag.valor_adiantamento)}</span>
                        : <span className="icon-yes">✓</span>
                      : <span className="icon-no">—</span>
                    }
                  </td>
                  <td>
                    {ag.penteado
                      ? <span className="icon-yes">
                          {ag.valor_penteado != null ? formatValor(ag.valor_penteado) : '✓'}
                          {ag.nome_penteadista && (
                            <span className="sub-info">{ag.nome_penteadista}</span>
                          )}
                        </span>
                      : <span className="icon-no">—</span>
                    }
                  </td>
                  <td>
                    <select
                      className={`status-select status-${ag.status ?? 'pendente'}`}
                      value={ag.status ?? 'pendente'}
                      onChange={e => onUpdateStatus(ag.id, e.target.value)}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="realizado">Realizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td>
                    {confirmId === ag.id ? (
                      <div className="delete-confirm">
                        <span className="delete-confirm-text">Excluir?</span>
                        <button className="btn-confirm-yes" onClick={() => handleConfirm(ag.id)}>Sim</button>
                        <button className="btn-confirm-no" onClick={handleCancel}>Não</button>
                      </div>
                    ) : (
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteClick(ag.id)}
                      >
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
