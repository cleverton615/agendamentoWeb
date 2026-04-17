import { useState } from 'react'


const emptyForm = {
  nome: '',
  tipo: '',
  data: '',
  hora: '',
  valor_maquiagem: '',
  adiantamento: false,
  valor_adiantamento: '',
  penteado: false,
  valor_penteado: '',
  nome_penteadista: '',
  adiantamento_penteado: false,
  valor_adiantamento_penteado: '',
  observacoes: '',
}

export default function AppointmentForm({ onSubmit }) {
  const [form, setForm] = useState(emptyForm)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    if (name === 'adiantamento') {
      setForm(prev => ({
        ...prev,
        adiantamento: checked,
        valor_adiantamento: checked ? prev.valor_adiantamento : '',
      }))
    } else if (name === 'penteado') {
      setForm(prev => ({
        ...prev,
        penteado: checked,
        valor_penteado: checked ? prev.valor_penteado : '',
        nome_penteadista: checked ? prev.nome_penteadista : '',
        adiantamento_penteado: checked ? prev.adiantamento_penteado : false,
        valor_adiantamento_penteado: checked ? prev.valor_adiantamento_penteado : '',
      }))
    } else if (name === 'adiantamento_penteado') {
      setForm(prev => ({
        ...prev,
        adiantamento_penteado: checked,
        valor_adiantamento_penteado: checked ? prev.valor_adiantamento_penteado : '',
      }))
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) {
      alert('Por favor, informe o nome da cliente.')
      return
    }
    if (!form.data) {
      alert('Por favor, informe a data.')
      return
    }
    if (!form.hora) {
      alert('Por favor, informe o horário.')
      return
    }
    onSubmit({
      ...form,
      valor_maquiagem: form.valor_maquiagem !== '' ? parseFloat(form.valor_maquiagem) : null,
      valor_adiantamento: form.adiantamento && form.valor_adiantamento !== ''
        ? parseFloat(form.valor_adiantamento)
        : null,
      valor_penteado: form.penteado && form.valor_penteado !== ''
        ? parseFloat(form.valor_penteado)
        : null,
      nome_penteadista: form.penteado && form.nome_penteadista.trim() !== ''
        ? form.nome_penteadista.trim()
        : null,
      adiantamento_penteado: form.penteado ? form.adiantamento_penteado : false,
      valor_adiantamento_penteado: form.penteado && form.adiantamento_penteado && form.valor_adiantamento_penteado !== ''
        ? parseFloat(form.valor_adiantamento_penteado)
        : null,
    })
    setForm(emptyForm)
  }

  return (
    <div className="form-card">
      <h2>Novo Agendamento</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label htmlFor="nome">Nome da cliente</label>
            <input
              id="nome"
              name="nome"
              type="text"
              placeholder="Ex: Maria Silva"
              value={form.nome}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tipo">Tipo</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={handleChange}>
              <option value="">— Selecione —</option>
              <option value="maquiagem">Maquiagem</option>
              <option value="penteado">Penteado</option>
              <option value="unhas">Unhas</option>
              <option value="epilacao">Epilação</option>
              <option value="sobrancelhas">Sobrancelhas</option>
              <option value="cabeleireira">Cabeleireira</option>
              <option value="barbeiro">Barbeiro</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="data">Data</label>
            <input
              id="data"
              name="data"
              type="date"
              value={form.data}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="hora">Horário</label>
            <input
              id="hora"
              name="hora"
              type="time"
              value={form.hora}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="valor_maquiagem">Valor</label>
          <div className="input-currency-wrap">
            <span className="currency-prefix">R$</span>
            <input
              id="valor_maquiagem"
              name="valor_maquiagem"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.valor_maquiagem}
              onChange={handleChange}
              className="input-valor"
            />
          </div>
        </div>

        <div className="checkboxes">
          <div className="checkbox-with-value">
            <label className="checkbox-group">
              <input
                name="adiantamento"
                type="checkbox"
                checked={form.adiantamento}
                onChange={handleChange}
              />
              Adiantamento pago
            </label>
            {form.adiantamento && (
              <div className="valor-adiantamento">
                <span className="currency-prefix">R$</span>
                <input
                  name="valor_adiantamento"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.valor_adiantamento}
                  onChange={handleChange}
                  className="input-valor"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="checkbox-with-value">
            <label className="checkbox-group">
              <input
                name="penteado"
                type="checkbox"
                checked={form.penteado}
                onChange={handleChange}
              />
              Serviço agregado
            </label>
            {form.penteado && (
              <div className="penteado-extras">
                <input
                  name="nome_penteadista"
                  type="text"
                  placeholder="Nome do serviço (ex: Penteado noiva, Manicure...)"
                  value={form.nome_penteadista}
                  onChange={handleChange}
                  className="input-penteadista"
                />
                <div className="valor-adiantamento">
                  <span className="currency-prefix">R$</span>
                  <input
                    name="valor_penteado"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={form.valor_penteado}
                    onChange={handleChange}
                    className="input-valor"
                  />
                </div>
                <div className="checkbox-with-value">
                  <label className="checkbox-group">
                    <input
                      name="adiantamento_penteado"
                      type="checkbox"
                      checked={form.adiantamento_penteado}
                      onChange={handleChange}
                    />
                    Adiantamento pago
                  </label>
                  {form.adiantamento_penteado && (
                    <div className="valor-adiantamento">
                      <span className="currency-prefix">R$</span>
                      <input
                        name="valor_adiantamento_penteado"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={form.valor_adiantamento_penteado}
                        onChange={handleChange}
                        className="input-valor"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="observacoes">Observações</label>
          <textarea
            id="observacoes"
            name="observacoes"
            placeholder="Anotações sobre a cliente ou atendimento..."
            value={form.observacoes}
            onChange={handleChange}
            className="input-obs"
            rows={3}
          />
        </div>

        <button type="submit" className="btn-submit">Salvar</button>
      </form>
    </div>
  )
}
