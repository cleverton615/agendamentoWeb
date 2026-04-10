import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const API_BASE = 'http://localhost:3001/api'
const MESES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmt(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function TooltipPersonalizado({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

function SecaoServico({ titulo, cor, total, count, dadosMensais, dataKey, mesFiltro }) {
  const ticketMedio = count > 0 ? total / count : 0

  return (
    <section className="fin-section">
      <h2 className="fin-section-title" style={{ color: cor }}>{titulo}</h2>

      <div className="fin-section-cards">
        <div className="fin-card">
          <span className="fin-card-label">Total</span>
          <span className="fin-card-value">{fmt(total)}</span>
        </div>
        <div className="fin-card">
          <span className="fin-card-label">Atendimentos</span>
          <span className="fin-card-value">{count}</span>
        </div>
        <div className="fin-card">
          <span className="fin-card-label">Ticket médio</span>
          <span className="fin-card-value">{fmt(ticketMedio)}</span>
        </div>
      </div>

      {mesFiltro === '' && (
        <div className="fin-chart-card">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dadosMensais} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0d0d5" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#a06070' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={v => `R$${v}`}
                tick={{ fontSize: 10, fill: '#a06070' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<TooltipPersonalizado />} />
              <Bar dataKey={dataKey} name={titulo} fill={cor} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

export default function FinanceiroPage() {
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const anoAtual = new Date().getFullYear()
  const [anoFiltro, setAnoFiltro] = useState(anoAtual)
  const [mesFiltro, setMesFiltro] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/agendamentos`)
      .then(r => r.json())
      .then(data => setAgendamentos(data))
      .catch(() => setError('Erro ao carregar dados.'))
      .finally(() => setLoading(false))
  }, [])

  const anos = useMemo(() => {
    const set = new Set(agendamentos.map(a => parseInt(a.data.split('-')[0])))
    set.add(anoAtual)
    return [...set].sort((a, b) => b - a)
  }, [agendamentos, anoAtual])

  const filtrados = useMemo(() => {
    return agendamentos.filter(a => {
      const [ano, mes] = a.data.split('-')
      if (parseInt(ano) !== anoFiltro) return false
      if (mesFiltro !== '' && parseInt(mes) !== parseInt(mesFiltro)) return false
      return true
    })
  }, [agendamentos, anoFiltro, mesFiltro])

  // Cancelados: somente os que têm algum adiantamento retido
  const canceladosComAdiantamento = useMemo(
    () => filtrados.filter(a =>
      a.status === 'cancelado' && (
        (a.adiantamento && a.valor_adiantamento != null) ||
        (a.adiantamento_penteado && a.valor_adiantamento_penteado != null)
      )
    ),
    [filtrados]
  )

  // Realizados e pendentes: excluem cancelados
  const ativos = useMemo(
    () => filtrados.filter(a => a.status !== 'cancelado'),
    [filtrados]
  )

  const dadosMensais = useMemo(() => {
    return MESES_LABEL.map((mes, idx) => {
      const mesNum = idx + 1
      const doMes = agendamentos.filter(a => {
        const [ano, m] = a.data.split('-')
        return parseInt(ano) === anoFiltro && parseInt(m) === mesNum && a.status !== 'cancelado'
      })
      return {
        mes,
        maquiagem: doMes.reduce((s, a) => s + (a.valor_maquiagem ?? 0), 0),
        penteado: doMes.reduce((s, a) => s + (a.valor_penteado ?? 0), 0),
      }
    })
  }, [agendamentos, anoFiltro])

  const totalMaquiagem = ativos.reduce((s, a) => s + (a.valor_maquiagem ?? 0), 0)
  const totalPenteado = ativos.reduce((s, a) => s + (a.valor_penteado ?? 0), 0)
  const countMaquiagem = ativos.filter(a => a.valor_maquiagem != null).length
  const countPenteado = ativos.filter(a => a.penteado).length

  const totalAdiantamentosRetidos = canceladosComAdiantamento.reduce(
    (s, a) => s + (a.valor_adiantamento ?? 0) + (a.valor_adiantamento_penteado ?? 0), 0
  )

  return (
    <div className="page-content">
      <h1>Financeiro</h1>
      <p className="subtitle">Receitas por serviço</p>

      <div className="fin-filters">
        <div className="fin-filter-group">
          <label htmlFor="fil-ano">Ano</label>
          <select id="fil-ano" value={anoFiltro} onChange={e => setAnoFiltro(parseInt(e.target.value))}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="fin-filter-group">
          <label htmlFor="fil-mes">Mês</label>
          <select id="fil-mes" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}>
            <option value="">Todos</option>
            {MESES_LABEL.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="loading-msg">Carregando...</div>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && (
        <>
          <div className="fin-sections">
            <SecaoServico
              titulo="Maquiagem"
              cor="#c97b84"
              total={totalMaquiagem}
              count={countMaquiagem}
              dadosMensais={dadosMensais}
              dataKey="maquiagem"
              mesFiltro={mesFiltro}
            />
            <SecaoServico
              titulo="Penteado"
              cor="#7a4d8a"
              total={totalPenteado}
              count={countPenteado}
              dadosMensais={dadosMensais}
              dataKey="penteado"
              mesFiltro={mesFiltro}
            />
          </div>

          {canceladosComAdiantamento.length > 0 && (
            <div className="fin-cancelamentos">
              <h2 className="fin-section-title fin-cancelamentos-title">
                Adiantamentos retidos — Cancelamentos
              </h2>
              <div className="fin-card fin-card-cancelamento" style={{ marginBottom: 14 }}>
                <span className="fin-card-label">Total retido</span>
                <span className="fin-card-value">{fmt(totalAdiantamentosRetidos)}</span>
                <span className="fin-card-label" style={{ marginTop: 4 }}>
                  {canceladosComAdiantamento.length} cancelamento{canceladosComAdiantamento.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Data</th>
                      <th>Adiant. maquiagem</th>
                      <th>Adiant. penteado</th>
                      <th>Total retido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canceladosComAdiantamento.map(ag => {
                      const totalRetido = (ag.valor_adiantamento ?? 0) + (ag.valor_adiantamento_penteado ?? 0)
                      return (
                        <tr key={ag.id}>
                          <td>{ag.nome}</td>
                          <td>{formatDate(ag.data)}</td>
                          <td>{ag.valor_adiantamento != null ? <span className="icon-yes">{fmt(ag.valor_adiantamento)}</span> : <span className="icon-no">—</span>}</td>
                          <td>{ag.valor_adiantamento_penteado != null ? <span className="icon-yes">{fmt(ag.valor_adiantamento_penteado)}</span> : <span className="icon-no">—</span>}</td>
                          <td><strong>{fmt(totalRetido)}</strong></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
