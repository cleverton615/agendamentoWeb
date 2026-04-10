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

export default function DespesasPage() {
  const [despesas, setDespesas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editando, setEditando] = useState(null)   // despesa sendo editada
  const [confirmId, setConfirmId] = useState(null)
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
    setError(null)
  }

  function iniciarEdicao(d) {
    setEditando(d.id)
    setForm({
      nome: d.nome,
      valor: String(d.valor),
      forma_pagamento: d.forma_pagamento,
      parcelas: d.parcelas != null ? String(d.parcelas) : '1',
      local: d.local ?? '',
      data: d.data,
    })
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
      const url = editando ? `${API_BASE}/despesas/${editando}` : `${API_BASE}/despesas`
      const method = editando ? 'PUT' : 'POST'
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
      showSucesso(editando ? 'Despesa atualizada!' : 'Despesa adicionada!')
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API_BASE}/despesas/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir.')
      await fetchDespesas()
      showSucesso('Despesa excluída.')
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirmId(null)
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

  return (
    <div className="page-content">
      <h1>Despesas</h1>
      <p className="subtitle">Controle de gastos por mês</p>

      {/* Formulário */}
      <div className="form-card">
        <h2>{editando ? 'Editar Despesa' : 'Nova Despesa'}</h2>
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
              <label htmlFor="desp-mes">Mês de referência</label>
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
              <label htmlFor="desp-valor">Valor</label>
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
              {editando ? 'Salvar alterações' : 'Adicionar despesa'}
            </button>
            {editando && (
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
              {despesasFiltradas.map(d => (
                <tr key={d.id} className={editando === d.id ? 'row-editando' : ''}>
                  <td>{d.nome}</td>
                  <td><strong>{fmt(d.valor)}</strong></td>
                  <td>
                    <span className={`badge-pagamento badge-pagamento-${d.forma_pagamento}`}>
                      {FORMA_LABEL[d.forma_pagamento]}
                      {d.forma_pagamento === 'credito' && d.parcelas > 1 && ` ${d.parcelas}x`}
                    </span>
                  </td>
                  <td>{d.local ?? <span className="icon-no">—</span>}</td>
                  <td>{labelMes(d.data)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-edit" onClick={() => iniciarEdicao(d)}>Editar</button>
                      {confirmId === d.id ? (
                        <div className="delete-confirm">
                          <span className="delete-confirm-text">Excluir?</span>
                          <button className="btn-confirm-yes" onClick={() => handleDelete(d.id)}>Sim</button>
                          <button className="btn-confirm-no" onClick={() => setConfirmId(null)}>Não</button>
                        </div>
                      ) : (
                        <button className="btn-delete" onClick={() => setConfirmId(d.id)}>Excluir</button>
                      )}
                    </div>
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
