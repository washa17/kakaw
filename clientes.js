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
const COL_HISTORICO = ["historico"];

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

/* ── Backup (clientes + pedidos + pagamentos + histórico) ────────
   backups/{id} → formato legível, organizado por seções:
     {
       geradoEm: "15/07/2026 às 14:30",
       criadoEm: <timestamp>,
       resumo: { totalClientes, totalPedidos, totalPagamentos, totalHistorico },
       clientes: [ { nome, ativo, pedidos: [...], pagamentos: [...] } ],
       historico: [ {...} ]
     }
   Mantém só os últimos MAX_BACKUPS, apagando os mais antigos.
─────────────────────────────────────────────────────────────── */

const MAX_BACKUPS = 7;
const CHAVE_ULTIMO_BACKUP = "kakaw-ultimo-backup";
const DIAS_EXPIRACAO_HISTORICO = 45;

function formatarDataHoraBR(d) {
  return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function timestampParaData(ts) {
  return ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
}

/**
 * Monta um snapshot completo e organizado: todos os clientes com suas
 * subcoleções de pedidos e pagamentos aninhadas, mais o histórico completo.
 * Datas viram texto legível (dd/mm/aaaa às hh:mm) em vez de timestamps crus.
 */
async function coletarDadosCompletos() {
  const snapC = await getDocs(colRef(COL_CLIENTES));
  const clientes = [];
  let totalPedidos = 0;
  let totalPagamentos = 0;

  for (const docC of snapC.docs) {
    const [snapP, snapPg] = await Promise.all([
      getDocs(colRef([...COL_CLIENTES, docC.id, "pedidos"])),
      getDocs(colRef([...COL_CLIENTES, docC.id, "pagamentos"]))
    ]);
    const dadosCliente = docC.data();
    const pedidos = snapP.docs.map(p => formatarRegistro(p.id, p.data()));
    const pagamentos = snapPg.docs.map(p => formatarRegistro(p.id, p.data()));
    totalPedidos += pedidos.length;
    totalPagamentos += pagamentos.length;

    clientes.push({
      id: docC.id,
      nome: dadosCliente.nome || "(sem nome)",
      ativo: dadosCliente.ativo !== undefined ? dadosCliente.ativo : true,
      criadoEm: formatarCampoData(dadosCliente.criadoEm),
      pedidos,
      pagamentos
    });
  }

  const snapH = await getDocs(colRef(COL_HISTORICO));
  const historico = snapH.docs.map(h => formatarRegistro(h.id, h.data()));

  return {
    clientes,
    historico,
    resumo: {
      totalClientes: clientes.length,
      totalPedidos,
      totalPagamentos,
      totalHistorico: historico.length
    }
  };
}

/**
 * Formata um registro genérico (pedido, pagamento ou item de histórico),
 * convertendo campos de data conhecidos para texto legível.
 */
function formatarRegistro(id, dados) {
  const copia = { id, ...dados };
  ["criadoEm", "expiraEm"].forEach(campo => {
    if (copia[campo] !== undefined) copia[campo] = formatarCampoData(copia[campo]);
  });
  return copia;
}

function formatarCampoData(valor) {
  const d = timestampParaData(valor);
  return d ? formatarDataHoraBR(d) : null;
}

/**
 * Gera um novo backup no Firestore e remove os mais antigos
 * além do limite de MAX_BACKUPS.
 */
async function gerarBackup() {
  const { clientes, historico, resumo } = await coletarDadosCompletos();
  const agora = new Date();
  const backup = {
    criadoEm: serverTimestamp(),
    geradoEm: formatarDataHoraBR(agora),
    resumo,
    clientes,
    historico
  };
  const ref = await addDoc(colRef(COL_BACKUPS), backup);

  await limparBackupsAntigos();
  localStorage.setItem(CHAVE_ULTIMO_BACKUP, agora.toISOString());

  return { id: ref.id, ...backup, criadoEm: agora };
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
 * Lista os backups existentes (sem os campos pesados de clientes/histórico,
 * só metadados + resumo, para exibir a lista rapidamente).
 */
async function listarBackups() {
  const q = query(colRef(COL_BACKUPS), orderBy("criadoEm", "desc"), limit(MAX_BACKUPS));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, criadoEm: data.criadoEm, geradoEm: data.geradoEm, resumo: data.resumo };
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

/* ── Limpeza automática do histórico (45 dias) ───────────────────
   O histórico grava um campo expiraEm (criadoEm + 45 dias). Esta função
   varre a coleção e apaga de fato os registros já vencidos — algo que
   antes só existia como campo salvo, sem rotina real de exclusão.
─────────────────────────────────────────────────────────────── */
async function limparHistoricoExpirado() {
  const snap = await getDocs(colRef(COL_HISTORICO));
  const agora = Date.now();
  let apagados = 0;

  for (const d of snap.docs) {
    const dados = d.data();
    const expiraEm = timestampParaData(dados.expiraEm);
    if (expiraEm && expiraEm.getTime() <= agora) {
      await deleteDoc(doc(db, ...COL_HISTORICO, d.id));
      apagados++;
    }
  }
  return apagados;
}

window.kakawClientes = {
  listarClientes, renomearCliente, excluirCliente,
  gerarBackup, listarBackups, obterBackupCompleto, excluirBackup,
  gerarBackupAutomaticoSeNecessario, limparHistoricoExpirado
};

window.dispatchEvent(new Event("kakawClientesReady"));
