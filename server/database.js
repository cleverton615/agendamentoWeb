const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'agendamentos.json');

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { nextId: 1, agendamentos: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDb(data) {
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

function createAgendamento(nome, data, hora, valor_maquiagem, adiantamento, valor_adiantamento, penteado, valor_penteado, nome_penteadista) {
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

module.exports = { getAllAgendamentos, createAgendamento, deleteAgendamento, updateStatus };
