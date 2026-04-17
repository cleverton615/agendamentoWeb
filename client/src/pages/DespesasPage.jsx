import { useState, useEffect, useMemo } from 'react'

const API_BASE = 'http://localhost:3001/api'

const MESES_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const FORMA_LABEL = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
}

function fmt(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const mesAtual = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const emptyForm = {
  nome: '',
  valor: '',
  forma_pagamento: 'pix',
  parcelas: '1',
  local: '',
  data: mesAtual(),
}

// Subtract (parcela_num - 1) months from a YYYY-MM string to get the starting month
function getStartingMonth(d) {
  if (!d.parcela_num || d.parcela_num === 1) return d.data
  const [year, month] = d.data.split('-').map(Number)
  const start = new Date(year, month - 1 - (d.parcela_num - 1), 1)
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
}

export default function DespesasPage() {
  const [despesas, setDespesas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editando, setEditando] = useState(null)        // id for single records
  const [editandoGrupo, setEditandoGrupo] = useState(null) // grupo_id for installment groups
  const [confirmDelete, setConfirmDelete] = useState(null) // { type: 'single'|'grupo', id }
  const [filtroMes, setFiltroMes] = useState(mesAtual())
  const [sucesso, setSucesso] = useState('')

  async function fetchDespesas() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/despesas`)
      if (!res.ok) throw new Error('Erro ao buscar despesas.')
      setDespesas(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDespesas() }, [])

  function showSucesso(msg) {
    setSucesso(msg)
    setTimeout(() => setSucesso(''), 3000)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'forma_pagamento' && value !== 'credito' ? { parcelas: '1' } : {}),
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditando(null)
    setEditandoGrupo(null)
    setError(null)
  }

  function iniciarEdicao(d) {
    const isGrupo = d.grupo_id != null
    if (isGrupo) {
      setEditandoGrupo(d.grupo_id)
      setEditando(null)
      setForm({
        nome: d.nome,
        valor: String(d.valor_total ?? d.valor * (d.parcelas ?? 1)),
        forma_pagamento: d.forma_pagamento,
        parcelas: String(d.parcelas ?? 1),
        local: d.local ?? '',
        data: getStartingMonth(d),
      })
    } else {
      setEditando(d.id)
      setEditandoGrupo(null)
      setForm({
        nome: d.nome,
        valor: String(d.valor),
        forma_pagamento: d.forma_pagamento,
        parcelas: d.parcelas != null ? String(d.parcelas) : '1',
        local: d.local ?? '',
        data: d.data,
      })
    }
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.nome.trim()) { setError('Informe o nome da despesa.'); return }
    if (!form.valor || isNaN(parseFloat(form.valor))) { setError('Informe um valor válido.'); return }

    const body = {
      nome: form.nome.trim(),
      valor: parseFloat(form.valor),
      forma_pagamento: form.forma_pagamento,
      parcelas: form.forma_pagamento === 'credito' ? parseInt(form.parcelas) : null,
      local: form.local.trim() || null,
      data: form.data,
    }

    try {
      let url, method
      if (editandoGrupo) {
        url = `${API_BASE}/despesas/grupo/${editandoGrupo}`
        method = 'PUT'
      } else if (editando) {
        url = `${API_BASE}/despesas/${editando}`
        method = 'PUT'
      } else {
        url = `${API_BASE}/despesas`
        method = 'POST'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar despesa.')
      }
      await fetchDespesas()
      showSucesso(editando || editandoGrupo ? 'Despesa atualizada!' : 'Despesa adicionada!')
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  async function executarDelete() {
    if (!confirmDelete) return
    try {
      const url = confirmDelete.type === 'grupo'
        ? `${API_BASE}/despesas/grupo/${confirmDelete.id}`
        : `${API_BASE}/despesas/${confirmDelete.id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir.')
      await fetchDespesas()
      showSucesso('Despesa excluída.')
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirmDelete(null)
    }
  }

  // Filtro e totais
  const despesasFiltradas = useMemo(
    () => filtroMes ? despesas.filter(d => d.data === filtroMes) : despesas,
    [despesas, filtroMes]
  )

  const totalFiltrado = despesasFiltradas.reduce((s, d) => s + d.valor, 0)

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(despesas.map(d => d.data))
    set.add(mesAtual())
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [despesas])

  function labelMes(yyyymm) {
    const [y, m] = yyyymm.split('-')
    return `${MESES_LABEL[parseInt(m) - 1]} ${y}`
  }

  const isEditando = editando !== null || editandoGrupo !== null

  return (
    <div className="page-content">
      <h1>Despesas</h1>
      <p className="subtitle">Controle de gastos por mês</p>

      {/* Formulário */}
      <div className="form-card">
        <h2>{isEditando ? 'Editar Despesa' : 'Nova Despesa'}</h2>
        <form onSubmit={handleSubmit}>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="desp-nome">Descrição</label>
              <input
                id="desp-nome"
                name="nome"
                type="text"
                placeholder="Ex: Tinta para sobrancelha"
                value={form.nome}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="desp-mes">
                {editandoGrupo ? 'Mês da 1ª parcela' : 'Mês de referência'}
              </label>
              <input
                id="desp-mes"
                name="data"
                type="month"
                value={form.data}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="desp-valor">
                {form.forma_pagamento === 'credito' && parseInt(form.parcelas) > 1
                  ? 'Valor total'
                  : 'Valor'}
              </label>
              <div className="input-currency-wrap">
                <span className="currency-prefix">R$</span>
                <input
                  id="desp-valor"
                  name="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.valor}
                  onChange={handleChange}
                  className="input-valor"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="desp-forma">Forma de pagamento</label>
              <select id="desp-forma" name="forma_pagamento" value={form.forma_pagamento} onChange={handleChange}>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="debito">Débito</option>
                <option value="credito">Cartão de crédito</option>
              </select>
            </div>

            {form.forma_pagamento === 'credito' && (
              <div className="form-group">
                <label htmlFor="desp-parcelas">Parcelas</label>
                <select id="desp-parcelas" name="parcelas" value={form.parcelas} onChange={handleChange}>
                  {Array.from({ length: 48 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}x</option>
                  ))}
                </select>
              </div>
            )}

            {form.forma_pagamento === 'credito' && parseInt(form.parcelas) > 1 && (
              <div className="desp-parcela-preview">
                <span className="desp-parcela-preview-label">Valor por parcela</span>
                <span className="desp-parcela-preview-valor">
                  {form.valor && !isNaN(parseFloat(form.valor))
                    ? fmt(parseFloat(form.valor) / parseInt(form.parcelas))
                    : '—'}
                </span>
              </div>
            )}

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="desp-local">Onde foi comprado</label>
              <input
                id="desp-local"
                name="local"
                type="text"
                placeholder="Ex: Mercado Livre, Farmácia..."
                value={form.local}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

          <div className="desp-form-actions">
            <button type="submit" className="btn-submit">
              {isEditando ? 'Salvar alterações' : 'Adicionar despesa'}
            </button>
            {isEditando && (
              <button type="button" className="btn-cancel-modal" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {sucesso && <div className="sucesso-msg">{sucesso}</div>}

      {/* Filtro por mês */}
      <div className="desp-filtro-row">
        <div className="list-filter-group">
          <label htmlFor="fil-desp-mes">Mês</label>
          <select id="fil-desp-mes" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
            <option value="">Todos os meses</option>
            {mesesDisponiveis.map(m => (
              <option key={m} value={m}>{labelMes(m)}</option>
            ))}
          </select>
        </div>
        {despesasFiltradas.length > 0 && (
          <div className="desp-total-mes">
            <span className="desp-total-mes-label">
              {filtroMes ? labelMes(filtroMes) : 'Total geral'}
            </span>
            <span className="desp-total-mes-valor">{fmt(totalFiltrado)}</span>
          </div>
        )}
      </div>

      {loading && <div className="loading-msg">Carregando...</div>}

      {!loading && despesasFiltradas.length === 0 && (
        <div className="empty-msg">
          {despesas.length === 0 ? 'Nenhuma despesa cadastrada.' : 'Nenhuma despesa neste mês.'}
        </div>
      )}

      {!loading && despesasFiltradas.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Pagamento</th>
                <th>Onde comprou</th>
                <th>Mês</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {despesasFiltradas.map(d => {
                const isGrupo = d.grupo_id != null
                const confirmKey = isGrupo ? `g-${d.grupo_id}` : `s-${d.id}`
                const isConfirming = confirmDelete && (
                  (confirmDelete.type === 'grupo' && confirmDelete.id === d.grupo_id) ||
                  (confirmDelete.type === 'single' && confirmDelete.id === d.id)
                )
                const isEditRow = (editando === d.id) || (editandoGrupo === d.grupo_id && d.grupo_id != null)
                return (
                  <tr key={d.id} className={isEditRow ? 'row-editando' : ''}>
                    <td>{d.nome}</td>
                    <td>
                      <strong>{fmt(d.valor)}</strong>
                      {isGrupo && d.valor_total != null && (
                        <span className="desp-total-hint"> de {fmt(d.valor_total)}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge-pagamento badge-pagamento-${d.forma_pagamento}`}>
                        {FORMA_LABEL[d.forma_pagamento]}
                        {d.forma_pagamento === 'credito' && d.parcelas > 1 && d.parcela_num != null
                          ? ` ${d.parcela_num}/${d.parcelas}`
                          : d.forma_pagamento === 'credito' && d.parcelas > 1
                            ? ` ${d.parcelas}x`
                            : null
                        }
                      </span>
                    </td>
                    <td>{d.local ?? <span className="icon-no">—</span>}</td>
                    <td>{labelMes(d.data)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-edit" onClick={() => iniciarEdicao(d)}>Editar</button>
                        {isConfirming ? (
                          <div className="delete-confirm">
                            <span className="delete-confirm-text">
                              {isGrupo ? `Excluir todas as ${d.parcelas} parcelas?` : 'Excluir?'}
                            </span>
                            <button className="btn-confirm-yes" onClick={executarDelete}>Sim</button>
                            <button className="btn-confirm-no" onClick={() => setConfirmDelete(null)}>Não</button>
                          </div>
                        ) : (
                          <button
                            className="btn-delete"
                            onClick={() => setConfirmDelete(
                              isGrupo
                                ? { type: 'grupo', id: d.grupo_id }
                                : { type: 'single', id: d.id }
                            )}
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
    </div>
  )
}
