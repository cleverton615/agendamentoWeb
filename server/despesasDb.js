const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'despesas.json');
const BACKUP_FILE = path.join(__dirname, 'despesas.json.bak');

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { nextId: 1, despesas: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDb(data) {
  if (fs.existsSync(DB_FILE)) {
    fs.copyFileSync(DB_FILE, BACKUP_FILE);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getAllDespesas() {
  const db = readDb();
  return [...db.despesas].sort((a, b) => b.data.localeCompare(a.data));
}

function createDespesa(fields) {
  const db = readDb();
  const nova = {
    id: db.nextId,
    nome: fields.nome,
    valor: fields.valor,
    forma_pagamento: fields.forma_pagamento,
    parcelas: fields.forma_pagamento === 'credito' ? (fields.parcelas ?? 1) : null,
    local: fields.local || null,
    data: fields.data,
  };
  db.despesas.push(nova);
  db.nextId += 1;
  writeDb(db);
  return nova;
}

function updateDespesa(id, fields) {
  const db = readDb();
  const d = db.despesas.find(d => d.id === id);
  if (!d) return null;
  d.nome = fields.nome;
  d.valor = fields.valor;
  d.forma_pagamento = fields.forma_pagamento;
  d.parcelas = fields.forma_pagamento === 'credito' ? (fields.parcelas ?? 1) : null;
  d.local = fields.local || null;
  d.data = fields.data;
  writeDb(db);
  return d;
}

function deleteDespesa(id) {
  const db = readDb();
  db.despesas = db.despesas.filter(d => d.id !== id);
  writeDb(db);
}

module.exports = { getAllDespesas, createDespesa, updateDespesa, deleteDespesa };
