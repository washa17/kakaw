/**
 * kakaw · clientes.js
 * Módulo de dados de clientes (edição simples de nome, exclusão)
 * e de backup (clientes + pedidos + pagamentos).
 * Reaproveita a coleção clientes/ já usada pela página clientes.html
 * (com subcoleções pedidos/ e pagamentos/), sem duplicar dados.
 * Expõe window.kakawClientes para uso em config.html.
 *
 * Uso: <script type="module" src="clientes.js"></script>
 */

import { initializeApp, getApps, getApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc,
         getDoc, getDocs, deleteDoc, updateDoc,
         addDoc, query, orderBy, limit,
         serverTimestamp }                  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCv8YuWm13yscXDWfkIRvFtRy6ZVO0Wgok",
  authDomain:        "kakaw-web.firebaseapp.com",
  projectId:         "kakaw-web",
  storageBucket:     "kakaw-web.firebasestorage.app",
  messagingSenderId: "229104514189",
  appId:             "1:229104514189:web:3ae6c7c3de736f508e9ec4"
};

// Reaproveita o app já inicializado por auth.js/financeiro.js, se existir
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db  = getFirestore(app);

const COL_CLIENTES = ["clientes"];
const COL_BACKUPS  = ["backups"];

function colRef(path) {
  return collection(db, ...path);
}

async function listarClientes() {
  const snap = await getDocs(colRef(COL_CLIENTES));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
}

async function renomearCliente(id, novoNome) {
  await updateDoc(doc(db, ...COL_CLIENTES, id), { nome: novoNome });
}

/**
 * Exclui um cliente e suas subcoleções (pedidos, pagamentos),
 * igual ao comportamento já usado em clientes.html.
 */
async function excluirCliente(id) {
  const [snapPedidos, snapPagamentos] = await Promise.all([
    getDocs(colRef([...COL_CLIENTES, id, "pedidos"])),
    getDocs(colRef([...COL_CLIENTES, id, "pagamentos"]))
  ]);
  for (const p of snapPedidos.docs) await deleteDoc(doc(db, ...COL_CLIENTES, id, "pedidos", p.id));
  for (const p of snapPagamentos.docs) await deleteDoc(doc(db, ...COL_CLIENTES, id, "pagamentos", p.id));
  await deleteDoc(doc(db, ...COL_CLIENTES, id));
}

/* ── Backup (clientes + pedidos + pagamentos) ────────────────────
   backups/{id} → { criadoEm, quantidadeClientes, dados: [ {..cliente, pedidos:[], pagamentos:[]} ] }
   Mantém só os últimos MAX_BACKUPS, apagando os mais antigos.
─────────────────────────────────────────────────────────────── */

const MAX_BACKUPS = 7;
const CHAVE_ULTIMO_BACKUP = "kakaw-ultimo-backup";

/**
 * Monta um snapshot completo: todos os clientes com suas subcoleções
 * de pedidos e pagamentos aninhadas dentro de cada um.
 */
async function coletarDadosCompletos() {
  const snapC = await getDocs(colRef(COL_CLIENTES));
  const dados = [];
  for (const docC of snapC.docs) {
    const [snapP, snapPg] = await Promise.all([
      getDocs(colRef([...COL_CLIENTES, docC.id, "pedidos"])),
      getDocs(colRef([...COL_CLIENTES, docC.id, "pagamentos"]))
    ]);
    dados.push({
      id: docC.id,
      ...docC.data(),
      pedidos: snapP.docs.map(p => ({ id: p.id, ...p.data() })),
      pagamentos: snapPg.docs.map(p => ({ id: p.id, ...p.data() }))
    });
  }
  return dados;
}

/**
 * Gera um novo backup no Firestore e remove os mais antigos
 * além do limite de MAX_BACKUPS.
 */
async function gerarBackup() {
  const dados = await coletarDadosCompletos();
  const backup = {
    criadoEm: serverTimestamp(),
    quantidadeClientes: dados.length,
    dados
  };
  const ref = await addDoc(colRef(COL_BACKUPS), backup);

  await limparBackupsAntigos();
  localStorage.setItem(CHAVE_ULTIMO_BACKUP, new Date().toISOString());

  return { id: ref.id, ...backup, criadoEm: new Date() };
}

async function limparBackupsAntigos() {
  const q = query(colRef(COL_BACKUPS), orderBy("criadoEm", "desc"));
  const snap = await getDocs(q);
  const excedentes = snap.docs.slice(MAX_BACKUPS);
  for (const d of excedentes) {
    await deleteDoc(doc(db, ...COL_BACKUPS, d.id));
  }
}

/**
 * Lista os backups existentes (sem o campo "dados" pesado,
 * só metadados, para exibir a lista rapidamente).
 */
async function listarBackups() {
  const q = query(colRef(COL_BACKUPS), orderBy("criadoEm", "desc"), limit(MAX_BACKUPS));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, criadoEm: data.criadoEm, quantidadeClientes: data.quantidadeClientes };
  });
}

/**
 * Busca um backup específico com todos os dados (para download).
 */
async function obterBackupCompleto(id) {
  const snap = await getDoc(doc(db, ...COL_BACKUPS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function excluirBackup(id) {
  await deleteDoc(doc(db, ...COL_BACKUPS, id));
}

/**
 * Verifica se já passou 1 dia (24h) desde o último backup gerado
 * (checagem via localStorage, para não precisar consultar o Firestore
 * toda vez só para saber a data). Se sim, gera um novo automaticamente.
 * Retorna o backup gerado, ou null se não era hora ainda.
 */
async function gerarBackupAutomaticoSeNecessario() {
  const ultimo = localStorage.getItem(CHAVE_ULTIMO_BACKUP);
  const umDiaMs = 24 * 60 * 60 * 1000;
  if (ultimo && (Date.now() - new Date(ultimo).getTime()) < umDiaMs) {
    return null; // ainda não passou 1 dia
  }
  return await gerarBackup();
}

window.kakawClientes = {
  listarClientes, renomearCliente, excluirCliente,
  gerarBackup, listarBackups, obterBackupCompleto, excluirBackup,
  gerarBackupAutomaticoSeNecessario
};

window.dispatchEvent(new Event("kakawClientesReady"));
