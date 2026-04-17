import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatValor(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function SortIcon({ sortKey, col, sortDir }) {
  if (sortKey !== col) return <span className="sort-icon sort-inactive">⇅</span>
  return <span className="sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

const TIPO_LABEL = {
  maquiagem: 'Maquiagem',
  penteado: 'Penteado',
  unhas: 'Unhas',
  epilacao: 'Epilação',
  sobrancelhas: 'Sobrancelhas',
  cabeleireira: 'Cabeleireira',
  barbeiro: 'Barbeiro',
}

const POR_PAGINA = 20

export default function AppointmentList({ agendamentos, onDelete, onUpdateStatus, onEdit, loading, mode = 'preview' }) {
  const [confirmId, setConfirmId] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [sortKey, setSortKey] = useState('data')
  const [sortDir, setSortDir] = useState('asc')
  const [pagina, setPagina] = useState(1)

  const hoje = new Date().toISOString().split('T')[0]

  // Reset para página 1 ao mudar filtros
  useEffect(() => { setPagina(1) }, [filtroStatus, filtroTipo, filtroDataInicio, filtroDataFim])

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function setHoje() {
    setFiltroDataInicio(hoje)
    setFiltroDataFim(hoje)
  }

  function limparFiltros() {
    setFiltroStatus('')
    setFiltroTipo('')
    setFiltroDataInicio('')
    setFiltroDataFim('')
  }

  const temFiltroAtivo = filtroStatus || filtroTipo || filtroDataInicio || filtroDataFim

  const filtrados = useMemo(() => {
    return agendamentos.filter(a => {
      if (filtroStatus && a.status !== filtroStatus) return false
      if (filtroTipo && a.tipo !== filtroTipo) return false
      if (filtroDataInicio && a.data < filtroDataInicio) return false
      if (filtroDataFim && a.data > filtroDataFim) return false
      return true
    })
  }, [agendamentos, filtroStatus, filtroTipo, filtroDataInicio, filtroDataFim])

  const ordenados = useMemo(() => {
    return [...filtrados].sort((a, b) => {
      let va, vb
      if (sortKey === 'nome') {
        va = a.nome.toLowerCase(); vb = b.nome.toLowerCase()
      } else if (sortKey === 'status') {
        va = a.status ?? 'pendente'; vb = b.status ?? 'pendente'
      } else {
        va = a.data + 'T' + a.hora; vb = b.data + 'T' + b.hora
      }
      const cmp = va.localeCompare(vb)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtrados, sortKey, sortDir])

  // Modo preview: 5 mais relevantes (próximos primeiro, passados recentes depois)
  const preview = useMemo(() => {
    const futuros = ordenados.filter(a => a.data >= hoje)
    const passados = [...ordenados.filter(a => a.data < hoje)].reverse()
    return [...futuros, ...passados].slice(0, 5)
  }, [ordenados, hoje])

  // Modo paginado
  const totalPaginas = Math.ceil(ordenados.length / POR_PAGINA)
  const paginados = useMemo(() => {
    const inicio = (pagina - 1) * POR_PAGINA
    return ordenados.slice(inicio, inicio + POR_PAGINA)
  }, [ordenados, pagina])

  const visiveis = mode === 'paginated' ? paginados : preview

  function exportCSV() {
    const header = ['Nome', 'Tipo', 'Data', 'Horário', 'Valor Serviço', 'Adiantamento', 'Serviço agregado', 'Valor serviço agr.', 'Nome serviço', 'Adiant. serviço agr.', 'Status', 'Observações']
    const rows = ordenados.map(ag => [
      ag.nome,
      ag.tipo ? TIPO_LABEL[ag.tipo] : '',
      formatDate(ag.data),
      ag.hora,
      ag.valor_maquiagem != null ? ag.valor_maquiagem : '',
      ag.adiantamento ? (ag.valor_adiantamento != null ? ag.valor_adiantamento : 'Sim') : 'Não',
      ag.penteado ? 'Sim' : 'Não',
      ag.valor_penteado != null ? ag.valor_penteado : '',
      ag.nome_penteadista ?? '',
      ag.adiantamento_penteado ? (ag.valor_adiantamento_penteado != null ? ag.valor_adiantamento_penteado : 'Sim') : 'Não',
      ag.status ?? 'pendente',
      ag.observacoes ?? '',
    ])
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agendamentos_${hoje}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="list-section">
      <div className="list-header">
        <h2>{mode === 'paginated' ? 'Todos os Agendamentos' : 'Próximos Agendamentos'}</h2>
        {mode === 'paginated' && agendamentos.length > 0 && (
          <button className="btn-csv" onClick={exportCSV} title="Exportar para CSV">
            ↓ CSV
          </button>
        )}
      </div>

      {mode === 'paginated' && (
        <div className="list-filters">
          <div className="list-filter-group">
            <label htmlFor="fil-status">Status</label>
            <select id="fil-status" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="realizado">Realizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="list-filter-group">
            <label htmlFor="fil-tipo">Tipo</label>
            <select id="fil-tipo" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="maquiagem">Maquiagem</option>
              <option value="penteado">Penteado</option>
              <option value="unhas">Unhas</option>
              <option value="epilacao">Epilação</option>
              <option value="sobrancelhas">Sobrancelhas</option>
              <option value="cabeleireira">Cabeleireira</option>
              <option value="barbeiro">Barbeiro</option>
            </select>
          </div>
          <div className="list-filter-group">
            <label htmlFor="fil-inicio">De</label>
            <input
              id="fil-inicio"
              type="date"
              value={filtroDataInicio}
              onChange={e => setFiltroDataInicio(e.target.value)}
            />
          </div>
          <div className="list-filter-group">
            <label htmlFor="fil-fim">Até</label>
            <input
              id="fil-fim"
              type="date"
              value={filtroDataFim}
              onChange={e => setFiltroDataFim(e.target.value)}
            />
          </div>
          <div className="list-filter-actions">
            <button className="btn-filtro-hoje" onClick={setHoje}>Hoje</button>
            {temFiltroAtivo && (
              <button className="btn-filtro-limpar" onClick={limparFiltros}>Limpar</button>
            )}
          </div>
        </div>
      )}

      {loading && <div className="loading-msg">Carregando...</div>}

      {!loading && ordenados.length === 0 && (
        <div className="empty-msg">
          {agendamentos.length === 0
            ? 'Nenhum agendamento encontrado.'
            : 'Nenhum resultado para os filtros aplicados.'}
        </div>
      )}

      {!loading && visiveis.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th className="th-sortable" onClick={() => toggleSort('nome')}>
                  Nome <SortIcon sortKey={sortKey} col="nome" sortDir={sortDir} />
                </th>
                <th>Tipo</th>
                <th className="th-sortable" onClick={() => toggleSort('data')}>
                  Data <SortIcon sortKey={sortKey} col="data" sortDir={sortDir} />
                </th>
                <th>Horário</th>
                <th>Serviço (R$)</th>
                <th>Adiantamento</th>
                <th>Serviço agregado</th>
                <th className="th-sortable" onClick={() => toggleSort('status')}>
                  Status <SortIcon sortKey={sortKey} col="status" sortDir={sortDir} />
                </th>
                <th>Obs</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map(ag => {
                const isHoje = ag.data === hoje
                return (
                  <tr
                    key={ag.id}
                    className={[
                      ag.status === 'cancelado' ? 'row-cancelado' : '',
                      isHoje ? 'row-hoje' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <td>
                      {ag.nome}
                      {isHoje && <span className="badge-hoje">Hoje</span>}
                    </td>
                    <td>
                      {ag.tipo
                        ? <span className={`badge-tipo badge-tipo-${ag.tipo}`}>{TIPO_LABEL[ag.tipo]}</span>
                        : <span className="icon-no">—</span>
                      }
                    </td>
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
                            {ag.adiantamento_penteado && (
                              <span className="sub-info">
                                Adiant.: {ag.valor_adiantamento_penteado != null ? formatValor(ag.valor_adiantamento_penteado) : '✓'}
                              </span>
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
                    <td className="obs-cell">
                      {ag.observacoes
                        ? <span className="obs-icon" title={ag.observacoes}>📝</span>
                        : <span className="icon-no">—</span>
                      }
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-edit" onClick={() => onEdit(ag)}>
                          Editar
                        </button>
                        {confirmId === ag.id ? (
                          <div className="delete-confirm">
                            <span className="delete-confirm-text">Excluir?</span>
                            <button
                              className="btn-confirm-yes"
                              onClick={() => { setConfirmId(null); onDelete(ag.id) }}
                            >
                              Sim
                            </button>
                            <button
                              className="btn-confirm-no"
                              onClick={() => setConfirmId(null)}
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-delete"
                            onClick={() => setConfirmId(ag.id)}
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {mode === 'paginated' && !loading && totalPaginas > 1 && (
        <div className="pagination">
          <button
            className="btn-page"
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {pagina} de {totalPaginas}
            <span className="pagination-total"> — {ordenados.length} agendamento{ordenados.length !== 1 ? 's' : ''}</span>
          </span>
          <button
            className="btn-page"
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Link para todos no modo preview */}
      {mode === 'preview' && !loading && agendamentos.length > 5 && (
        <Link to="/todos" className="link-ver-todos">
          Ver todos os agendamentos ({agendamentos.length}) →
        </Link>
      )}
    </div>
  )
}
