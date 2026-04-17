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
  return [...db.despesas].sort((a, b) => {
    const dataCmp = b.data.localeCompare(a.data);
    if (dataCmp !== 0) return dataCmp;
    // Within same month: group installments together, ordered by parcela_num
    if (a.grupo_id != null && a.grupo_id === b.grupo_id) {
      return (a.parcela_num ?? 0) - (b.parcela_num ?? 0);
    }
    return 0;
  });
}

// Adds offset months to a YYYY-MM string
function addMonths(yyyymm, offset) {
  const [year, month] = yyyymm.split('-').map(Number);
  const d = new Date(year, month - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function createDespesa(fields) {
  const db = readDb();
  const { nome, valor, forma_pagamento, parcelas, local, data } = fields;

  if (forma_pagamento === 'credito' && parcelas && parcelas > 1) {
    const grupoId = db.nextId;
    const valorParcela = parseFloat((valor / parcelas).toFixed(2));
    const registros = [];

    for (let i = 0; i < parcelas; i++) {
      const id = db.nextId;
      db.nextId += 1;
      registros.push({
        id,
        grupo_id: grupoId,
        nome,
        valor: valorParcela,
        valor_total: valor,
        forma_pagamento,
        parcelas,
        parcela_num: i + 1,
        local: local || null,
        data: addMonths(data, i),
      });
    }

    db.despesas.push(...registros);
    writeDb(db);
    return registros;
  }

  // Single record (non-parcelada or 1x)
  const nova = {
    id: db.nextId,
    grupo_id: null,
    nome,
    valor,
    valor_total: null,
    forma_pagamento,
    parcelas: forma_pagamento === 'credito' ? (parcelas || 1) : null,
    parcela_num: null,
    local: local || null,
    data,
  };
  db.nextId += 1;
  db.despesas.push(nova);
  writeDb(db);
  return nova;
}

function updateDespesa(id, fields) {
  const db = readDb();
  const d = db.despesas.find(d => d.id === id);
  if (!d) return null;
  d.nome = fields.nome;
  d.valor = fields.valor;
  d.valor_total = null;
  d.forma_pagamento = fields.forma_pagamento;
  d.parcelas = fields.forma_pagamento === 'credito' ? (fields.parcelas ?? 1) : null;
  d.parcela_num = null;
  d.grupo_id = null;
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

function deleteDespesasByGrupo(grupo_id) {
  const db = readDb();
  db.despesas = db.despesas.filter(d => d.grupo_id !== grupo_id);
  writeDb(db);
}

// Deletes old group and recreates installments with new fields
function updateDespesaGrupo(grupo_id, fields) {
  deleteDespesasByGrupo(grupo_id);
  return createDespesa(fields);
}

module.exports = {
  getAllDespesas,
  createDespesa,
  updateDespesa,
  deleteDespesa,
  deleteDespesasByGrupo,
  updateDespesaGrupo,
};
