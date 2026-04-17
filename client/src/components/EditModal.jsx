import { useState } from 'react'


export default function EditModal({ agendamento, onSave, onClose }) {
  const [form, setForm] = useState({
    nome: agendamento.nome,
    tipo: agendamento.tipo ?? '',
    data: agendamento.data,
    hora: agendamento.hora,
    valor_maquiagem: agendamento.valor_maquiagem ?? '',
    adiantamento: agendamento.adiantamento,
    valor_adiantamento: agendamento.valor_adiantamento ?? '',
    penteado: agendamento.penteado,
    valor_penteado: agendamento.valor_penteado ?? '',
    nome_penteadista: agendamento.nome_penteadista ?? '',
    adiantamento_penteado: agendamento.adiantamento_penteado,
    valor_adiantamento_penteado: agendamento.valor_adiantamento_penteado ?? '',
    observacoes: agendamento.observacoes ?? '',
  })

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
    if (!form.nome.trim()) { alert('Por favor, informe o nome da cliente.'); return }
    if (!form.data) { alert('Por favor, informe a data.'); return }
    if (!form.hora) { alert('Por favor, informe o horário.'); return }
    onSave(agendamento.id, {
      ...form,
      tipo: form.tipo || null,
      valor_maquiagem: form.valor_maquiagem !== '' ? parseFloat(form.valor_maquiagem) : null,
      valor_adiantamento: form.adiantamento && form.valor_adiantamento !== ''
        ? parseFloat(form.valor_adiantamento) : null,
      valor_penteado: form.penteado && form.valor_penteado !== ''
        ? parseFloat(form.valor_penteado) : null,
      nome_penteadista: form.penteado && form.nome_penteadista.trim() !== ''
        ? form.nome_penteadista.trim() : null,
      adiantamento_penteado: form.penteado ? form.adiantamento_penteado : false,
      valor_adiantamento_penteado: form.penteado && form.adiantamento_penteado && form.valor_adiantamento_penteado !== ''
        ? parseFloat(form.valor_adiantamento_penteado) : null,
    })
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>Editar Agendamento</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="edit-nome">Nome da cliente</label>
              <input
                id="edit-nome"
                name="nome"
                type="text"
                placeholder="Ex: Maria Silva"
                value={form.nome}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-tipo">Tipo</label>
              <select id="edit-tipo" name="tipo" value={form.tipo} onChange={handleChange}>
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
              <label htmlFor="edit-data">Data</label>
              <input
                id="edit-data"
                name="data"
                type="date"
                value={form.data}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-hora">Horário</label>
              <input
                id="edit-hora"
                name="hora"
                type="time"
                value={form.hora}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-valor_maquiagem">Valor</label>
            <div className="input-currency-wrap">
              <span className="currency-prefix">R$</span>
              <input
                id="edit-valor_maquiagem"
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
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-observacoes">Observações</label>
            <textarea
              id="edit-observacoes"
              name="observacoes"
              placeholder="Anotações sobre a cliente ou atendimento..."
              value={form.observacoes}
              onChange={handleChange}
              className="input-obs"
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel-modal" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit">
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
