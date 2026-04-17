const express = require('express');
const cors = require('cors');
const { getAllAgendamentos, createAgendamento, deleteAgendamento, updateStatus, updateAgendamento, hasConflict } = require('./database');
const { getAllDespesas, createDespesa, updateDespesa, deleteDespesa, deleteDespesasByGrupo, updateDespesaGrupo } = require('./despesasDb');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/agendamentos', (req, res) => {
  const agendamentos = getAllAgendamentos();
  res.json(agendamentos);
});

app.post('/api/agendamentos', (req, res) => {
  const {
    nome, data, hora, tipo, valor_maquiagem,
    adiantamento, valor_adiantamento,
    penteado, valor_penteado, nome_penteadista,
    adiantamento_penteado, valor_adiantamento_penteado,
    observacoes,
  } = req.body;

  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome é obrigatório.' });
  }
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return res.status(400).json({ error: 'Data inválida. Use o formato YYYY-MM-DD.' });
  }
  if (!hora || !/^\d{2}:\d{2}$/.test(hora)) {
    return res.status(400).json({ error: 'Hora inválida. Use o formato HH:MM.' });
  }
  if (tipo && !['maquiagem', 'penteado', 'unhas', 'epilacao', 'sobrancelhas', 'cabeleireira', 'barbeiro'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo inválido.' });
  }
  if (hasConflict(data, hora)) {
    const [a, m, d] = data.split('-');
    return res.status(409).json({ error: `Já existe um agendamento em ${d}/${m}/${a} às ${hora}.` });
  }

  const novo = createAgendamento(
    nome.trim(), data, hora,
    valor_maquiagem != null ? parseFloat(valor_maquiagem) : null,
    Boolean(adiantamento),
    adiantamento && valor_adiantamento != null ? parseFloat(valor_adiantamento) : null,
    Boolean(penteado),
    penteado && valor_penteado != null ? parseFloat(valor_penteado) : null,
    penteado && nome_penteadista ? nome_penteadista.trim() : null,
    Boolean(adiantamento_penteado),
    penteado && adiantamento_penteado && valor_adiantamento_penteado != null ? parseFloat(valor_adiantamento_penteado) : null,
    observacoes || null,
    tipo || null,
  );
  res.status(201).json(novo);
});

app.put('/api/agendamentos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

  const {
    nome, data, hora, tipo, valor_maquiagem,
    adiantamento, valor_adiantamento,
    penteado, valor_penteado, nome_penteadista,
    adiantamento_penteado, valor_adiantamento_penteado,
    observacoes,
  } = req.body;

  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome é obrigatório.' });
  }
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return res.status(400).json({ error: 'Data inválida.' });
  }
  if (!hora || !/^\d{2}:\d{2}$/.test(hora)) {
    return res.status(400).json({ error: 'Hora inválida.' });
  }
  if (tipo && !['maquiagem', 'penteado', 'unhas', 'epilacao', 'sobrancelhas', 'cabeleireira', 'barbeiro'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo inválido.' });
  }
  if (hasConflict(data, hora, id)) {
    const [a, m, d] = data.split('-');
    return res.status(409).json({ error: `Já existe um agendamento em ${d}/${m}/${a} às ${hora}.` });
  }

  const atualizado = updateAgendamento(id, {
    nome: nome.trim(), data, hora,
    tipo: tipo || null,
    valor_maquiagem: valor_maquiagem != null ? parseFloat(valor_maquiagem) : null,
    adiantamento: Boolean(adiantamento),
    valor_adiantamento: adiantamento && valor_adiantamento != null ? parseFloat(valor_adiantamento) : null,
    penteado: Boolean(penteado),
    valor_penteado: penteado && valor_penteado != null ? parseFloat(valor_penteado) : null,
    nome_penteadista: penteado && nome_penteadista ? nome_penteadista.trim() : null,
    adiantamento_penteado: Boolean(adiantamento_penteado),
    valor_adiantamento_penteado: penteado && adiantamento_penteado && valor_adiantamento_penteado != null ? parseFloat(valor_adiantamento_penteado) : null,
    observacoes: observacoes || null,
  });

  if (!atualizado) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  res.json(atualizado);
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

// ── Despesas ──────────────────────────────────────────────────

const FORMAS_VALIDAS = ['dinheiro', 'pix', 'debito', 'credito'];

function validarDespesa(body, res) {
  const { nome, valor, forma_pagamento, parcelas, data } = body;
  if (!nome || typeof nome !== 'string' || nome.trim() === '')
    return res.status(400).json({ error: 'Nome é obrigatório.' });
  if (valor == null || isNaN(parseFloat(valor)) || parseFloat(valor) < 0)
    return res.status(400).json({ error: 'Valor inválido.' });
  if (!FORMAS_VALIDAS.includes(forma_pagamento))
    return res.status(400).json({ error: 'Forma de pagamento inválida.' });
  if (forma_pagamento === 'credito') {
    const p = parseInt(parcelas);
    if (isNaN(p) || p < 1 || p > 48)
      return res.status(400).json({ error: 'Número de parcelas inválido (1–48).' });
  }
  if (!data || !/^\d{4}-\d{2}$/.test(data))
    return res.status(400).json({ error: 'Data inválida. Use o formato YYYY-MM.' });
  return null;
}

app.get('/api/despesas', (req, res) => {
  res.json(getAllDespesas());
});

app.post('/api/despesas', (req, res) => {
  const err = validarDespesa(req.body, res);
  if (err) return err;
  const { nome, valor, forma_pagamento, parcelas, local, data } = req.body;
  const nova = createDespesa({
    nome: nome.trim(),
    valor: parseFloat(valor),
    forma_pagamento,
    parcelas: forma_pagamento === 'credito' ? parseInt(parcelas) : null,
    local: local ? local.trim() : null,
    data,
  });
  res.status(201).json(nova);
});

// Group routes must come before /:id to avoid matching 'grupo' as an id
app.delete('/api/despesas/grupo/:grupo_id', (req, res) => {
  const grupo_id = parseInt(req.params.grupo_id, 10);
  if (isNaN(grupo_id)) return res.status(400).json({ error: 'ID de grupo inválido.' });
  deleteDespesasByGrupo(grupo_id);
  res.json({ success: true });
});

app.put('/api/despesas/grupo/:grupo_id', (req, res) => {
  const grupo_id = parseInt(req.params.grupo_id, 10);
  if (isNaN(grupo_id)) return res.status(400).json({ error: 'ID de grupo inválido.' });
  const err = validarDespesa(req.body, res);
  if (err) return err;
  const { nome, valor, forma_pagamento, parcelas, local, data } = req.body;
  const resultado = updateDespesaGrupo(grupo_id, {
    nome: nome.trim(),
    valor: parseFloat(valor),
    forma_pagamento,
    parcelas: forma_pagamento === 'credito' ? parseInt(parcelas) : null,
    local: local ? local.trim() : null,
    data,
  });
  res.json(resultado);
});

app.put('/api/despesas/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
  const err = validarDespesa(req.body, res);
  if (err) return err;
  const { nome, valor, forma_pagamento, parcelas, local, data } = req.body;
  const atualizada = updateDespesa(id, {
    nome: nome.trim(),
    valor: parseFloat(valor),
    forma_pagamento,
    parcelas: forma_pagamento === 'credito' ? parseInt(parcelas) : null,
    local: local ? local.trim() : null,
    data,
  });
  if (!atualizada) return res.status(404).json({ error: 'Despesa não encontrada.' });
  res.json(atualizada);
});

app.delete('/api/despesas/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
  deleteDespesa(id);
  res.json({ success: true });
});

// ──────────────────────────────────────────────────────────────

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
