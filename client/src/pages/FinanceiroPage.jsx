import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const API_BASE = 'http://localhost:3001/api'
const MESES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const SERVICOS = [
  { key: 'maquiagem',    label: 'Maquiagem',    cor: '#c97b84' },
  { key: 'penteado',     label: 'Penteado',      cor: '#7a4d8a' },
  { key: 'unhas',        label: 'Unhas',         cor: '#e05c8a' },
  { key: 'epilacao',     label: 'Epilação',      cor: '#d4846a' },
  { key: 'sobrancelhas', label: 'Sobrancelhas',  cor: '#9c6b30' },
  { key: 'cabeleireira', label: 'Cabeleireira',  cor: '#4a7c59' },
  { key: 'barbeiro',     label: 'Barbeiro',      cor: '#3a6080' },
]

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

function SecaoServico({ titulo, cor, total, count }) {
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
      </div>
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
  const [tipoFiltro, setTipoFiltro] = useState('')

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
      if (tipoFiltro !== '' && a.tipo !== tipoFiltro) return false
      return true
    })
  }, [agendamentos, anoFiltro, mesFiltro, tipoFiltro])

  const realizados = useMemo(
    () => filtrados.filter(a => a.status === 'realizado'),
    [filtrados]
  )

  const canceladosComAdiantamento = useMemo(
    () => filtrados.filter(a =>
      a.status === 'cancelado' && (
        (a.adiantamento && a.valor_adiantamento != null) ||
        (a.adiantamento_penteado && a.valor_adiantamento_penteado != null)
      )
    ),
    [filtrados]
  )

  const totaisPorTipo = useMemo(() => {
    return SERVICOS.map(s => ({
      ...s,
      total: realizados.filter(a => a.tipo === s.key).reduce((acc, a) => acc + (a.valor_maquiagem ?? 0), 0),
      count: realizados.filter(a => a.tipo === s.key).length,
    }))
  }, [realizados])

  const totaisPorTipoAtivos = totaisPorTipo.filter(s => s.count > 0)

  const totalPenteadoAddon = realizados.reduce((s, a) => s + (a.valor_penteado ?? 0), 0)
  const countPenteadoAddon = realizados.filter(a => a.penteado && a.valor_penteado != null).length

  const totalAdiantamentosRetidos = canceladosComAdiantamento.reduce(
    (s, a) => s + (a.valor_adiantamento ?? 0) + (a.valor_adiantamento_penteado ?? 0), 0
  )

  const totalServicos = totaisPorTipoAtivos.reduce((s, t) => s + t.total, 0)
  const totalGeral = totalServicos + totalPenteadoAddon + totalAdiantamentosRetidos

  // Tipos ativos no ano+tipo filtrados (para o gráfico)
  const tiposAtivosNoAno = useMemo(() => {
    return SERVICOS.filter(s =>
      (tipoFiltro === '' || tipoFiltro === s.key) &&
      agendamentos.some(a => {
        const [ano] = a.data.split('-')
        return parseInt(ano) === anoFiltro && a.tipo === s.key && a.status === 'realizado'
      })
    )
  }, [agendamentos, anoFiltro, tipoFiltro])

  // Dados mensais para gráfico (respeita tipoFiltro)
  const dadosMensais = useMemo(() => {
    return MESES_LABEL.map((mes, idx) => {
      const mesNum = idx + 1
      const realizadosDoMes = agendamentos.filter(a => {
        const [ano, m] = a.data.split('-')
        const tipoOk = tipoFiltro === '' || a.tipo === tipoFiltro
        return parseInt(ano) === anoFiltro && parseInt(m) === mesNum && a.status === 'realizado' && tipoOk
      })
      const canceladosDoMes = agendamentos.filter(a => {
        const [ano, m] = a.data.split('-')
        const tipoOk = tipoFiltro === '' || a.tipo === tipoFiltro
        return (
          parseInt(ano) === anoFiltro && parseInt(m) === mesNum && tipoOk &&
          a.status === 'cancelado' && (
            (a.adiantamento && a.valor_adiantamento != null) ||
            (a.adiantamento_penteado && a.valor_adiantamento_penteado != null)
          )
        )
      })
      const porTipo = {}
      SERVICOS.forEach(s => {
        porTipo[s.key] = realizadosDoMes
          .filter(a => a.tipo === s.key)
          .reduce((acc, a) => acc + (a.valor_maquiagem ?? 0), 0)
      })
      const penteadoAddon = realizadosDoMes.reduce((s, a) => s + (a.valor_penteado ?? 0), 0)
      const retidos = canceladosDoMes.reduce(
        (s, a) => s + (a.valor_adiantamento ?? 0) + (a.valor_adiantamento_penteado ?? 0), 0
      )
      const totalServicos = Object.values(porTipo).reduce((s, v) => s + v, 0)
      return { mes, ...porTipo, penteadoAddon, retidos, total: totalServicos + penteadoAddon + retidos }
    })
  }, [agendamentos, anoFiltro, tipoFiltro])

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
        <div className="fin-filter-group">
          <label htmlFor="fil-tipo">Tipo</label>
          <select id="fil-tipo" value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}>
            <option value="">Todos</option>
            {SERVICOS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="loading-msg">Carregando...</div>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && (
        <>
          {totaisPorTipoAtivos.length > 0 ? (
            <div className="fin-sections">
              {totaisPorTipoAtivos.map(s => (
                <SecaoServico
                  key={s.key}
                  titulo={s.label}
                  cor={s.cor}
                  total={s.total}
                  count={s.count}
                />
              ))}
              {countPenteadoAddon > 0 && (
                <SecaoServico
                  titulo="Serviço agregado"
                  cor="#7a4d8a"
                  total={totalPenteadoAddon}
                  count={countPenteadoAddon}
                />
              )}
            </div>
          ) : (
            <p className="fin-empty-msg">Nenhum atendimento realizado no período.</p>
          )}

          {/* Total Geral */}
          <div className="fin-total-geral">
            <div className="fin-total-geral-header">
              <h2 className="fin-section-title">Total Geral</h2>
              <span className="fin-total-geral-value">{fmt(totalGeral)}</span>
            </div>
            <p className="fin-total-geral-desc">
              Serviços ({fmt(totalServicos)})
              {totalPenteadoAddon > 0 && ` + Serviço agregado (${fmt(totalPenteadoAddon)})`}
              {totalAdiantamentosRetidos > 0 && ` + Adiantamentos retidos (${fmt(totalAdiantamentosRetidos)})`}
            </p>

            {mesFiltro === '' && (
              <div className="fin-chart-card" style={{ marginTop: 16 }}>
                <ResponsiveContainer width="100%" height={220}>
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
                    {tiposAtivosNoAno.map(s => (
                      <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.cor} radius={[3, 3, 0, 0]} maxBarSize={30} stackId="a" />
                    ))}
                    <Bar dataKey="penteadoAddon" name="Serviço agregado" fill="#7a4d8a" radius={[3, 3, 0, 0]} maxBarSize={30} stackId="a" />
                    <Bar dataKey="retidos" name="Adiant. retidos" fill="#e8a020" radius={[3, 3, 0, 0]} maxBarSize={30} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
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
                      <th>Adiant. serviço</th>
                      <th>Adiant. serviço agr.</th>
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
