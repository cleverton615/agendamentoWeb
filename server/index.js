const express = require('express');
const cors = require('cors');
const { getAllAgendamentos, createAgendamento, deleteAgendamento, updateStatus } = require('./database');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/agendamentos', (req, res) => {
  const agendamentos = getAllAgendamentos();
  res.json(agendamentos);
});

app.post('/api/agendamentos', (req, res) => {
  const { nome, data, hora, valor_maquiagem, adiantamento, valor_adiantamento, penteado, valor_penteado, nome_penteadista } = req.body;

  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome é obrigatório.' });
  }
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return res.status(400).json({ error: 'Data inválida. Use o formato YYYY-MM-DD.' });
  }
  if (!hora || !/^\d{2}:\d{2}$/.test(hora)) {
    return res.status(400).json({ error: 'Hora inválida. Use o formato HH:MM.' });
  }

  const novo = createAgendamento(
    nome.trim(),
    data,
    hora,
    valor_maquiagem != null ? parseFloat(valor_maquiagem) : null,
    Boolean(adiantamento),
    adiantamento && valor_adiantamento != null ? parseFloat(valor_adiantamento) : null,
    Boolean(penteado),
    penteado && valor_penteado != null ? parseFloat(valor_penteado) : null,
    penteado && nome_penteadista ? nome_penteadista.trim() : null
  );
  res.status(201).json(novo);
});

app.patch('/api/agendamentos/:id/status', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
  if (!['pendente', 'realizado', 'cancelado'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }
  const atualizado = updateStatus(id, status);
  if (!atualizado) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  res.json(atualizado);
});

app.delete('/api/agendamentos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }
  deleteAgendamento(id);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
