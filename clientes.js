/**
 * kakaw · clientes.js
 * Módulo de dados de clientes (edição simples de nome, exclusão).
 * Reaproveita a coleção clientes/ já usada pela página clientes.html
 * (com subcoleções pedidos/ e pagamentos/), sem duplicar dados.
 * Expõe window.kakawClientes para uso em config.html.
 *
 * Uso: <script type="module" src="clientes.js"></script>
 */

import { initializeApp, getApps, getApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc,
         getDocs, deleteDoc, updateDoc }    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

window.kakawClientes = {
  listarClientes, renomearCliente, excluirCliente
};

window.dispatchEvent(new Event("kakawClientesReady"));
