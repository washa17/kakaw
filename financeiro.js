/**
 * kakaw · financeiro.js
 * Módulo de dados do painel financeiro: ingredientes, recheios,
 * casquinhas, enfeites e lotes (histórico de produção/venda).
 * Expõe window.kakawFin para uso em config.html.
 *
 * Uso: <script type="module" src="financeiro.js"></script>
 */

import { initializeApp, getApps, getApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc,
         getDoc, getDocs, addDoc, setDoc,
         deleteDoc, updateDoc, query, orderBy,
         serverTimestamp }                   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCv8YuWm13yscXDWfkIRvFtRy6ZVO0Wgok",
  authDomain:        "kakaw-web.firebaseapp.com",
  projectId:         "kakaw-web",
  storageBucket:     "kakaw-web.firebasestorage.app",
  messagingSenderId: "229104514189",
  appId:             "1:229104514189:web:3ae6c7c3de736f508e9ec4"
};

// Reaproveita o app já inicializado por auth.js (ou outro módulo), se existir
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db  = getFirestore(app);

/* ── Coleções ──────────────────────────────────────────────────
   config/valores/ingredientes/{id}   → { nome, valor, quantidade }
       (valor = preço pago; quantidade = tamanho da embalagem, ex: 395 em "395g")
   config/valores/recheios/{id}       → { nome, custoTotal,
                                           ingredientes?: [{ingredienteId, nome, percentual, valorCalculado}] }
       (custoTotal é digitado manualmente OU calculado como soma dos ingredientes escolhidos:
        valorCalculado = ingrediente.valor * (percentual / 100))
   config/valores/enfeites/{id}       → { nome (sabor), valor }
   config/geral (documento único)     → { casquinhaTrufa: {casca, embalagem},
                                           casquinhaCone: {casquinha, chocolate, embalagem, fecho, etiqueta},
                                           precoTrufa, precoCone }
   lotes/{id}                         → { tipo, sabor, valorRecheio, rendimento, quantidade,
                                           custoUnitario, custoTotal, lucroBruto, lucroLiquido, criadoEm }
─────────────────────────────────────────────────────────────── */

const COL_INGREDIENTES = ["config", "valores", "ingredientes"];
const COL_RECHEIOS     = ["config", "valores", "recheios"];
const COL_ENFEITES     = ["config", "valores", "enfeites"];
const DOC_GERAL        = ["config", "geral"];
const COL_LOTES        = ["lotes"];

function colRef(path) {
  return collection(db, ...path);
}
function docRef(path) {
  return doc(db, ...path);
}

/* ── Ingredientes ─────────────────────────────────────────────── */

async function listarIngredientes() {
  const snap = await getDocs(colRef(COL_INGREDIENTES));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function salvarIngrediente({ id, nome, valor, quantidade }) {
  const dados = { nome, valor: Number(valor), quantidade: Number(quantidade) };
  if (id) {
    await updateDoc(doc(db, ...COL_INGREDIENTES, id), dados);
    return id;
  }
  const ref = await addDoc(colRef(COL_INGREDIENTES), dados);
  return ref.id;
}

async function excluirIngrediente(id) {
  await deleteDoc(doc(db, ...COL_INGREDIENTES, id));
}

/* ── Recheios ─────────────────────────────────────────────────── */

async function listarRecheios() {
  const snap = await getDocs(colRef(COL_RECHEIOS));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function salvarRecheio({ id, nome, custoTotal, ingredientes }) {
  const dados = { nome, custoTotal: Number(custoTotal) };
  // ingredientes: [{ ingredienteId, nome, percentual, valorCalculado }] ou null se for valor manual
  dados.ingredientes = ingredientes || null;
  if (id) {
    await updateDoc(doc(db, ...COL_RECHEIOS, id), dados);
    return id;
  }
  const ref = await addDoc(colRef(COL_RECHEIOS), dados);
  return ref.id;
}

/**
 * Calcula o custo de um recheio a partir de ingredientes escolhidos.
 * ingredientes: [{ ingredienteId, percentual }]
 * Retorna { total, detalhes: [{...ingrediente, percentual, valorCalculado}] }
 */
function calcularCustoRecheioPorIngredientes(ingredientesEscolhidos, todosIngredientes) {
  const detalhes = ingredientesEscolhidos.map(sel => {
    const ing = todosIngredientes.find(i => i.id === sel.ingredienteId);
    const valorCalculado = ing ? Number(ing.valor) * (Number(sel.percentual) / 100) : 0;
    return {
      ingredienteId: sel.ingredienteId,
      nome: ing ? ing.nome : "?",
      percentual: Number(sel.percentual),
      valorCalculado
    };
  });
  const total = detalhes.reduce((s, d) => s + d.valorCalculado, 0);
  return { total, detalhes };
}

async function excluirRecheio(id) {
  await deleteDoc(doc(db, ...COL_RECHEIOS, id));
}

/* ── Enfeites (1 por sabor) ───────────────────────────────────── */

async function listarEnfeites() {
  const snap = await getDocs(colRef(COL_ENFEITES));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function salvarEnfeite({ id, nome, valor }) {
  const dados = { nome, valor: Number(valor) };
  if (id) {
    await updateDoc(doc(db, ...COL_ENFEITES, id), dados);
    return id;
  }
  const ref = await addDoc(colRef(COL_ENFEITES), dados);
  return ref.id;
}

async function excluirEnfeite(id) {
  await deleteDoc(doc(db, ...COL_ENFEITES, id));
}

/* ── Config geral: casquinhas e preços de venda ──────────────── */

const GERAL_PADRAO = {
  casquinhaTrufa: { casca: 0, embalagem: 0 },
  casquinhaCone:  { casquinha: 0, chocolate: 0, embalagem: 0, fecho: 0, etiqueta: 0 },
  precoTrufa: 3,
  precoCone: 10
};

async function obterGeral() {
  const ref  = docRef(DOC_GERAL);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    // merge raso com padrão, garante que campos novos não quebrem
    const d = snap.data();
    return {
      casquinhaTrufa: { ...GERAL_PADRAO.casquinhaTrufa, ...(d.casquinhaTrufa || {}) },
      casquinhaCone:  { ...GERAL_PADRAO.casquinhaCone,  ...(d.casquinhaCone  || {}) },
      precoTrufa: d.precoTrufa ?? GERAL_PADRAO.precoTrufa,
      precoCone:  d.precoCone  ?? GERAL_PADRAO.precoCone
    };
  }
  await setDoc(ref, GERAL_PADRAO);
  return GERAL_PADRAO;
}

async function salvarGeral(parcial) {
  await setDoc(docRef(DOC_GERAL), parcial, { merge: true });
}

function custoCasquinhaTrufa(g) {
  return Number(g.casquinhaTrufa.casca || 0) + Number(g.casquinhaTrufa.embalagem || 0);
}
function custoCasquinhaCone(g) {
  const c = g.casquinhaCone;
  return Number(c.casquinha||0) + Number(c.chocolate||0) + Number(c.embalagem||0) + Number(c.fecho||0) + Number(c.etiqueta||0);
}

/* ── Lotes (histórico permanente de produção/venda) ──────────── */

/**
 * Calcula o custo/lucro de um lote e salva no Firestore.
 * tipo: "cone" | "trufa"
 * sabor: nome do sabor (string livre — pode ou não existir como recheio cadastrado)
 * valorRecheio: custo total da receita usada nessa leva (editável, vem pré-preenchido se sabor for cadastrado)
 * rendimento: quantas unidades essa receita específica rendeu
 * quantidade: número de unidades produzidas (normalmente igual ao rendimento, mas pode diferir se sobrou/faltou)
 */
async function lancarLote({ tipo, sabor, valorRecheio, rendimento, quantidade }) {
  const g = await obterGeral();
  const qtd = Number(quantidade);
  const custoRecheioUnit = Number(valorRecheio) / Number(rendimento);

  let custoUnitario, precoVenda;
  if (tipo === "cone") {
    const enfeites = await listarEnfeites();
    const enfeite = enfeites.find(e => e.nome.toLowerCase() === String(sabor).toLowerCase());
    const custoEnfeite = enfeite ? Number(enfeite.valor) : 0;
    custoUnitario = custoRecheioUnit + custoCasquinhaCone(g) + custoEnfeite;
    precoVenda = Number(g.precoCone);
  } else {
    custoUnitario = custoRecheioUnit + custoCasquinhaTrufa(g);
    precoVenda = Number(g.precoTrufa);
  }

  const custoTotal    = custoUnitario * qtd;
  const lucroBruto    = precoVenda * qtd;
  const lucroLiquido  = lucroBruto - custoTotal;

  const lote = {
    tipo,
    sabor,
    valorRecheio: Number(valorRecheio),
    rendimento: Number(rendimento),
    quantidade: qtd,
    custoUnitario,
    custoTotal,
    lucroBruto,
    lucroLiquido,
    criadoEm: serverTimestamp()
  };

  const ref = await addDoc(colRef(COL_LOTES), lote);
  return { id: ref.id, ...lote, criadoEm: new Date() };
}

async function listarLotes() {
  const q = query(colRef(COL_LOTES), orderBy("criadoEm", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function excluirLote(id) {
  await deleteDoc(doc(db, "lotes", id));
}

window.kakawFin = {
  listarIngredientes, salvarIngrediente, excluirIngrediente,
  listarRecheios, salvarRecheio, excluirRecheio, calcularCustoRecheioPorIngredientes,
  listarEnfeites, salvarEnfeite, excluirEnfeite,
  obterGeral, salvarGeral, custoCasquinhaTrufa, custoCasquinhaCone,
  lancarLote, listarLotes, excluirLote
};

window.dispatchEvent(new Event("kakawFinReady"));
