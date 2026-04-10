const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'agendamentos.json');
const BACKUP_FILE = path.join(__dirname, 'agendamentos.json.bak');

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { nextId: 1, agendamentos: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDb(data) {
  if (fs.existsSync(DB_FILE)) {
    fs.copyFileSync(DB_FILE, BACKUP_FILE);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getAllAgendamentos() {
  const db = readDb();
  return [...db.agendamentos].sort((a, b) => {
    const da = a.data + 'T' + a.hora;
    const db2 = b.data + 'T' + b.hora;
    return da.localeCompare(db2);
  });
}

function hasConflict(data, hora, excludeId = null) {
  const db = readDb();
  return db.agendamentos.some(a =>
    a.data === data && a.hora === hora && (excludeId === null || a.id !== excludeId)
  );
}

function createAgendamento(nome, data, hora, valor_maquiagem, adiantamento, valor_adiantamento, penteado, valor_penteado, nome_penteadista, adiantamento_penteado, valor_adiantamento_penteado, observacoes) {
  const db = readDb();
  const novo = {
    id: db.nextId,
    nome,
    data,
    hora,
    valor_maquiagem: valor_maquiagem ?? null,
    adiantamento: Boolean(adiantamento),
    valor_adiantamento: adiantamento && valor_adiantamento != null ? valor_adiantamento : null,
    penteado: Boolean(penteado),
    valor_penteado: penteado && valor_penteado != null ? valor_penteado : null,
    nome_penteadista: penteado && nome_penteadista ? nome_penteadista : null,
    adiantamento_penteado: penteado ? Boolean(adiantamento_penteado) : false,
    valor_adiantamento_penteado: penteado && adiantamento_penteado && valor_adiantamento_penteado != null ? valor_adiantamento_penteado : null,
    observacoes: observacoes ? observacoes.trim() : null,
    status: 'pendente',
  };
  db.agendamentos.push(novo);
  db.nextId += 1;
  writeDb(db);
  return novo;
}

function deleteAgendamento(id) {
  const db = readDb();
  db.agendamentos = db.agendamentos.filter(a => a.id !== id);
  writeDb(db);
}

function updateStatus(id, status) {
  const db = readDb();
  const ag = db.agendamentos.find(a => a.id === id);
  if (!ag) return null;
  ag.status = status;
  writeDb(db);
  return ag;
}

function updateAgendamento(id, fields) {
  const db = readDb();
  const ag = db.agendamentos.find(a => a.id === id);
  if (!ag) return null;

  const {
    nome, data, hora, valor_maquiagem,
    adiantamento, valor_adiantamento,
    penteado, valor_penteado, nome_penteadista,
    adiantamento_penteado, valor_adiantamento_penteado,
    observacoes,
  } = fields;

  ag.nome = nome;
  ag.data = data;
  ag.hora = hora;
  ag.valor_maquiagem = valor_maquiagem ?? null;
  ag.adiantamento = Boolean(adiantamento);
  ag.valor_adiantamento = adiantamento && valor_adiantamento != null ? valor_adiantamento : null;
  ag.penteado = Boolean(penteado);
  ag.valor_penteado = penteado && valor_penteado != null ? valor_penteado : null;
  ag.nome_penteadista = penteado && nome_penteadista ? nome_penteadista : null;
  ag.adiantamento_penteado = penteado ? Boolean(adiantamento_penteado) : false;
  ag.valor_adiantamento_penteado = penteado && adiantamento_penteado && valor_adiantamento_penteado != null ? valor_adiantamento_penteado : null;
  ag.observacoes = observacoes ? observacoes.trim() : null;

  writeDb(db);
  return ag;
}

module.exports = { getAllAgendamentos, createAgendamento, deleteAgendamento, updateStatus, updateAgendamento, hasConflict };
