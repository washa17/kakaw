/**
 * kakaw · auth.js
 * Módulo de autenticação do painel de administração.
 * Lê/cria o documento config/admin no Firestore e expõe
 * window.kakawAuth para uso em menu.js e config.html.
 *
 * Uso: <script type="module" src="auth.js"></script>
 */

import { initializeApp }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc,
         getDoc, setDoc }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCv8YuWm13yscXDWfkIRvFtRy6ZVO0Wgok",
  authDomain:        "kakaw-web.firebaseapp.com",
  projectId:         "kakaw-web",
  storageBucket:     "kakaw-web.firebasestorage.app",
  messagingSenderId: "229104514189",
  appId:             "1:229104514189:web:3ae6c7c3de736f508e9ec4"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const SENHA_PADRAO = "kakaw2025";
const SESSAO_KEY    = "kakaw-admin-sessao";

/**
 * Busca config/admin no Firestore. Se não existir, cria com
 * login "admin" e a senha padrão (primeiro acesso).
 */
async function garantirDocAdmin() {
  const ref  = doc(db, "config", "admin");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data();
  }
  const dados = { login: "admin", senha: SENHA_PADRAO };
  await setDoc(ref, dados);
  return dados;
}

/**
 * Verifica se login/senha batem com o documento config/admin.
 */
async function verificar(login, senha) {
  const dados = await garantirDocAdmin();
  return dados.login === login && dados.senha === senha;
}

/**
 * Troca a senha do admin no Firestore.
 */
async function trocarSenha(novaSenha) {
  const ref = doc(db, "config", "admin");
  await setDoc(ref, { senha: novaSenha }, { merge: true });
}

/**
 * Troca o login do admin no Firestore.
 */
async function trocarLogin(novoLogin) {
  const ref = doc(db, "config", "admin");
  await setDoc(ref, { login: novoLogin }, { merge: true });
}

/* ── Sessão (localStorage — fica logado até clicar em "sair") ── */

function salvarSessao(login) {
  localStorage.setItem(SESSAO_KEY, JSON.stringify({ login, em: Date.now() }));
}

function sessaoAtiva() {
  try {
    return !!localStorage.getItem(SESSAO_KEY);
  } catch (e) {
    return false;
  }
}

function sair() {
  localStorage.removeItem(SESSAO_KEY);
}

window.kakawAuth = {
  verificar,
  trocarSenha,
  trocarLogin,
  salvarSessao,
  sessaoAtiva,
  sair,
  db // exposto para config.html usar outras coleções se precisar
};

// Sinaliza que o módulo terminou de carregar (menu.js pode aguardar isso)
window.dispatchEvent(new Event("kakawAuthReady"));
