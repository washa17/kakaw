/**
 * kakaw · menu.js
 * Injeta o menu lateral e overlay em qualquer página.
 * Uso: <script src="menu.js"></script>  (antes do </body>)
 *
 * Para adicionar uma nova página basta incluir um item em NAV_ITEMS.
 */

(function () {

  /* ── Itens de navegação ─────────────────────────────────────── */
  const NAV_ITEMS = [
    { href: "index.html",     label: "Nova Compra", sub: "registrar pedido"          },
    { href: "tabela.html",    label: "Tabela",      sub: "débitos ativos"            },
    { href: "mensagem.html",  label: "Mensagem",    sub: "template whatsapp"         },
    { href: "clientes.html",  label: "Clientes",    sub: "gestão de cadastros"       },
    { href: "importar.html",  label: "Importar",    sub: "vários clientes de uma vez"},
    { href: "historico.html", label: "Histórico",   sub: "últimos 7 dias"            },
  ];

  /* ── Detecta página ativa pelo pathname ─────────────────────── */
  function paginaAtiva(href) {
    const path = window.location.pathname;
    const file = path.split("/").pop();
    const atual = (!file || file === "") ? "index.html" : file;
    return atual === href;
  }

  /* ── SVG da flor ─────────────────────────────────────────────── */
  function florSVG(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="10" stroke="#3A5C2C" stroke-width="1.5"/>
      <circle cx="48" cy="48" r="4" fill="#3A5C2C"/>
      <path d="M48 38 C43 26 31 25 30 35 C29 45 40 47 48 38Z" fill="#3A5C2C" opacity=".12" stroke="#3A5C2C" stroke-width="1.1"/>
      <path d="M58 48 C70 43 71 31 61 30 C51 29 49 40 58 48Z" fill="#5C3418" opacity=".12" stroke="#5C3418" stroke-width="1.1"/>
      <path d="M48 58 C53 70 65 71 66 61 C67 51 56 49 48 58Z" fill="#3A5C2C" opacity=".12" stroke="#3A5C2C" stroke-width="1.1"/>
      <path d="M38 48 C26 53 25 65 35 66 C45 67 47 56 38 48Z" fill="#5C3418" opacity=".12" stroke="#5C3418" stroke-width="1.1"/>
    </svg>`;
  }

  /* ── HTML do menu ────────────────────────────────────────────── */
  function menuHTML() {
    const navItems = NAV_ITEMS.map(item => {
      const ativo = paginaAtiva(item.href);
      return `
        <a class="kakaw-nav-item${ativo ? " ativo" : ""}" href="${item.href}">
          <div class="kakaw-nav-label">${item.label}</div>
          <div class="kakaw-nav-sub">${item.sub}</div>
        </a>`;
    }).join("");

    return `
      <div id="kakaw-overlay"></div>

      <div id="kakaw-menu" role="navigation" aria-label="Menu principal">

        <div class="kakaw-menu-header">
          ${florSVG(32)}
          <div class="kakaw-menu-title">kakaw</div>
          <div class="kakaw-menu-divider"></div>
          <div class="kakaw-menu-subtitle">doces artesanais</div>
        </div>

        <nav class="kakaw-menu-nav">
          ${navItems}
        </nav>

        <div class="kakaw-menu-footer">
          <span>versão 1.0 · kakaw</span>
          <button id="kakaw-config-btn" class="kakaw-config-btn" title="Configurações" aria-label="Abrir configurações">
            ${gearSVG(15)}
          </button>
        </div>

      </div>`;
  }

  /* ── SVG da engrenagem ────────────────────────────────────────── */
  function gearSVG(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`;
  }

  /* ── HTML do modal de login admin ────────────────────────────── */
  function loginModalHTML() {
    return `
      <div id="kakaw-admin-overlay" class="kakaw-admin-overlay">
        <div id="kakaw-admin-modal" class="kakaw-admin-modal" role="dialog" aria-modal="true" aria-label="Login administrador">
          <button id="kakaw-admin-close" class="kakaw-admin-close" aria-label="Fechar">&times;</button>

          ${gearSVG(30)}
          <div class="kakaw-admin-title">Configurações</div>
          <div class="kakaw-admin-subtitle">acesso restrito</div>

          <div class="kakaw-admin-field">
            <span class="kakaw-admin-lbl">Usuário</span>
            <input class="kakaw-admin-inp" id="kakaw-admin-login" value="admin" autocomplete="username"/>
          </div>

          <div class="kakaw-admin-field">
            <span class="kakaw-admin-lbl">Senha</span>
            <input class="kakaw-admin-inp" id="kakaw-admin-senha" type="password" placeholder="digite a senha..." autocomplete="current-password"/>
          </div>

          <div id="kakaw-admin-erro" class="kakaw-admin-erro">senha incorreta</div>

          <button id="kakaw-admin-entrar" class="kakaw-admin-entrar">entrar</button>
        </div>
      </div>`;
  }

  /* ── CSS ─────────────────────────────────────────────────────── */
  function injetarCSS() {
    if (document.getElementById("kakaw-menu-css")) return;
    const style = document.createElement("style");
    style.id = "kakaw-menu-css";
    style.textContent = `
      /* ── Overlay ── */
      #kakaw-overlay {
        position: fixed;
        inset: 0;
        background: rgba(26,18,8,.45);
        z-index: 98;
        opacity: 0;
        pointer-events: none;
        transition: opacity .3s;
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
      }
      #kakaw-overlay.open {
        opacity: 1;
        pointer-events: auto;
      }

      /* ── Painel ── */
      #kakaw-menu {
        position: fixed;
        top: 0;
        left: 0;
        /*
          100dvh (dynamic viewport height) acompanha a barra de
          endereço do browser mobile, eliminando o gap/corte.
          Fallback para 100vh em browsers sem suporte.
        */
        height: 100vh;
        height: 100dvh;
        width: 260px;
        background: var(--bg, #F5EFE2);
        z-index: 99;
        transform: translateX(-100%);
        transition: transform .35s cubic-bezier(.4,0,.2,1);
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--div, #DDD4BC);
        overflow: hidden; /* o scroll fica só na nav interna */
      }
      #kakaw-menu.open {
        transform: translateX(0);
      }

      /* ── Header (fixo no topo do menu) ── */
      .kakaw-menu-header {
        padding: 52px 32px 28px;
        border-bottom: 1px solid var(--div, #DDD4BC);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: .45rem;
        flex-shrink: 0;
      }
      .kakaw-menu-title {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-weight: 400;
        font-size: 1.5rem;
        color: var(--dark, #1A1208);
        letter-spacing: .02em;
        line-height: 1;
      }
      .kakaw-menu-divider {
        height: 1px;
        width: 70px;
        background: var(--choco, #5C3418);
        opacity: .4;
      }
      .kakaw-menu-subtitle {
        font-family: 'DM Mono', monospace;
        font-size: .3rem;
        letter-spacing: .45em;
        text-transform: uppercase;
        color: var(--choco, #5C3418);
      }

      /* ── Nav — única área que scrolla ── */
      .kakaw-menu-nav {
        flex: 1;
        padding: 8px 0;
        overflow-y: auto;
        overflow-x: hidden;
        /*
          overscroll-behavior: contain impede que o scroll
          do menu propague para a página de fundo (desktop e mobile).
        */
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }
      /* esconde scrollbar mas mantém scroll funcional */
      .kakaw-menu-nav::-webkit-scrollbar { width: 0; }
      .kakaw-menu-nav { scrollbar-width: none; }

      /* ── Itens de navegação ── */
      .kakaw-nav-item {
        display: block;
        padding: 20px 32px;
        cursor: pointer;
        border-bottom: 1px solid var(--div, #DDD4BC);
        border-left: 3px solid transparent;
        transition: background .2s, border-color .2s;
        text-decoration: none;
      }
      .kakaw-nav-item:hover {
        background: var(--bgCard, #EDE5D4);
      }
      .kakaw-nav-item.ativo {
        background: var(--bgCard, #EDE5D4);
        border-left-color: var(--verde, #3A5C2C);
        padding-left: 29px; /* compensa os 3px da borda ativa */
      }
      .kakaw-nav-label {
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        font-weight: 300;
        font-size: 1.18rem;
        color: var(--dark, #1A1208);
      }
      .kakaw-nav-sub {
        font-family: 'DM Mono', monospace;
        font-size: .46rem;
        letter-spacing: .3em;
        text-transform: uppercase;
        color: var(--muted, #8A7860);
        margin-top: 3px;
      }

      /* ── Footer (fixo na base do menu) ── */
      .kakaw-menu-footer {
        padding: 20px 32px;
        border-top: 1px solid var(--div, #DDD4BC);
        font-family: 'DM Mono', monospace;
        font-size: .46rem;
        letter-spacing: .28em;
        text-transform: uppercase;
        color: var(--mutedL, #B0A890);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .kakaw-config-btn {
        background: none;
        border: none;
        padding: 4px;
        margin: -4px;
        cursor: pointer;
        color: var(--mutedL, #B0A890);
        display: flex;
        align-items: center;
        transition: color .2s, transform .3s;
        flex-shrink: 0;
      }
      .kakaw-config-btn:hover {
        color: var(--verde, #3A5C2C);
        transform: rotate(45deg);
      }

      /*
        Trava o scroll do body quando o menu está aberto.
        position: fixed + width: 100% é necessário no iOS,
        onde overflow: hidden sozinho não impede o scroll.
      */
      body.kakaw-menu-open {
        overflow: hidden;
        position: fixed;
        width: 100%;
        /* preserva a posição do scroll para não pular ao abrir */
        top: var(--kakaw-scroll-top, 0);
      }

      /* ── Modal de login admin ── */
      .kakaw-admin-overlay {
        position: fixed;
        inset: 0;
        background: rgba(26,18,8,.55);
        z-index: 300;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        opacity: 0;
        pointer-events: none;
        transition: opacity .25s;
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
      }
      .kakaw-admin-overlay.open {
        opacity: 1;
        pointer-events: auto;
      }
      .kakaw-admin-modal {
        position: relative;
        width: 100%;
        max-width: 320px;
        background: var(--bg, #F5EFE2);
        border: 1px solid var(--div, #DDD4BC);
        border-radius: 8px;
        padding: 40px 28px 28px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        color: var(--verde, #3A5C2C);
        transform: translateY(12px);
        transition: transform .25s;
        box-shadow: 0 12px 40px rgba(26,18,8,.25);
      }
      .kakaw-admin-overlay.open .kakaw-admin-modal {
        transform: translateY(0);
      }
      .kakaw-admin-close {
        position: absolute;
        top: 10px;
        right: 14px;
        background: none;
        border: none;
        font-size: 1.3rem;
        line-height: 1;
        color: var(--mutedL, #B0A890);
        cursor: pointer;
        padding: 6px;
      }
      .kakaw-admin-close:hover { color: var(--choco, #5C3418); }
      .kakaw-admin-title {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-weight: 400;
        font-size: 1.3rem;
        color: var(--dark, #1A1208);
        margin-top: 6px;
      }
      .kakaw-admin-subtitle {
        font-family: 'DM Mono', monospace;
        font-size: .42rem;
        letter-spacing: .35em;
        text-transform: uppercase;
        color: var(--choco, #5C3418);
        margin-bottom: 18px;
      }
      .kakaw-admin-field {
        width: 100%;
        margin-bottom: 14px;
      }
      .kakaw-admin-lbl {
        display: block;
        font-family: 'DM Mono', monospace;
        font-size: .44rem;
        letter-spacing: .3em;
        text-transform: uppercase;
        color: var(--muted, #8A7860);
        margin-bottom: 7px;
      }
      .kakaw-admin-inp {
        width: 100%;
        padding: 11px 13px;
        background: var(--white, #FFFCF5);
        border: 1px solid var(--div, #DDD4BC);
        border-radius: 5px;
        font-family: 'Jost', sans-serif;
        font-weight: 300;
        font-size: .95rem;
        color: var(--dark, #1A1208);
        outline: none;
        transition: border .2s, box-shadow .2s;
      }
      .kakaw-admin-inp:focus {
        border-color: var(--verde, #3A5C2C);
        box-shadow: 0 0 0 3px rgba(58,92,44,.12);
      }
      .kakaw-admin-erro {
        display: none;
        width: 100%;
        text-align: left;
        font-family: 'DM Mono', monospace;
        font-size: .44rem;
        letter-spacing: .2em;
        text-transform: uppercase;
        color: #A03030;
        margin: -6px 0 12px;
      }
      .kakaw-admin-erro.show { display: block; }
      .kakaw-admin-entrar {
        width: 100%;
        padding: 14px;
        background: var(--verde, #3A5C2C);
        border: none;
        border-radius: 5px;
        outline: none;
        font-family: 'DM Mono', monospace;
        font-size: .5rem;
        letter-spacing: .35em;
        text-transform: uppercase;
        color: var(--white, #FFFCF5);
        cursor: pointer;
        transition: background .2s;
        margin-top: 4px;
      }
      .kakaw-admin-entrar:hover:not(:disabled) { background: #4A7A38; }
      .kakaw-admin-entrar:disabled { opacity: .5; cursor: default; }
    `;
    document.head.appendChild(style);
  }

  /* ── Salva/restaura posição do scroll ao travar o body ──────── */
  let scrollY = 0;

  function travarBody() {
    scrollY = window.scrollY;
    document.documentElement.style.setProperty("--kakaw-scroll-top", `-${scrollY}px`);
    document.body.classList.add("kakaw-menu-open");
  }

  function liberarBody() {
    document.body.classList.remove("kakaw-menu-open");
    document.documentElement.style.removeProperty("--kakaw-scroll-top");
    window.scrollTo(0, scrollY);
  }

  /* ── Injeta HTML no início do body ──────────────────────────── */
  function injetar() {
    injetarCSS();

    const root = document.createElement("div");
    root.id = "kakaw-menu-root";
    root.innerHTML = menuHTML();
    document.body.insertBefore(root, document.body.firstChild);

    const modalRoot = document.createElement("div");
    modalRoot.id = "kakaw-admin-root";
    modalRoot.innerHTML = loginModalHTML();
    document.body.appendChild(modalRoot);

    document.getElementById("kakaw-overlay")
      .addEventListener("click", () => window.kakawMenu.close());

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        window.kakawMenu.close();
        fecharAdminModal();
      }
    });

    document.getElementById("kakaw-config-btn")
      .addEventListener("click", abrirAdminModal);
    document.getElementById("kakaw-admin-close")
      .addEventListener("click", fecharAdminModal);
    document.getElementById("kakaw-admin-overlay")
      .addEventListener("click", (e) => {
        if (e.target.id === "kakaw-admin-overlay") fecharAdminModal();
      });

    const btnEntrar = document.getElementById("kakaw-admin-entrar");
    const inpSenha  = document.getElementById("kakaw-admin-senha");
    btnEntrar.addEventListener("click", tentarLogin);
    inpSenha.addEventListener("keydown", e => {
      if (e.key === "Enter") tentarLogin();
    });
  }

  /* ── Modal admin: abrir/fechar ───────────────────────────────── */
  function abrirAdminModal() {
    document.getElementById("kakaw-admin-overlay").classList.add("open");
    document.getElementById("kakaw-admin-erro").classList.remove("show");
    const senha = document.getElementById("kakaw-admin-senha");
    senha.value = "";
    setTimeout(() => senha.focus(), 150);
  }

  function fecharAdminModal() {
    document.getElementById("kakaw-admin-overlay")?.classList.remove("open");
  }

  /* ── Carrega auth.js dinamicamente (import de módulo ES) ─────── */
  let authPromise = null;
  function aguardarAuth() {
    if (window.kakawAuth) return Promise.resolve();
    if (!authPromise) {
      // import() dinâmico funciona em scripts normais, não só em type="module"
      authPromise = import("./auth.js").then(() => {
        if (!window.kakawAuth) {
          // fallback: aguarda o evento caso o módulo dispare depois de resolver a promise
          return new Promise(resolve => {
            window.addEventListener("kakawAuthReady", () => resolve(), { once: true });
            setTimeout(resolve, 3000);
          });
        }
      });
    }
    return authPromise;
  }

  /* ── Login: valida contra Firestore config/admin ─────────────── */
  async function tentarLogin() {
    const btn   = document.getElementById("kakaw-admin-entrar");
    const erro  = document.getElementById("kakaw-admin-erro");
    const login = document.getElementById("kakaw-admin-login").value.trim();
    const senha = document.getElementById("kakaw-admin-senha").value;

    erro.classList.remove("show");
    btn.disabled = true;
    btn.textContent = "verificando...";

    try {
      await aguardarAuth();
      const ok = await window.kakawAuth.verificar(login, senha);
      if (ok) {
        window.kakawAuth.salvarSessao(login);
        window.location.href = "config.html";
      } else {
        erro.textContent = "usuário ou senha incorretos";
        erro.classList.add("show");
        btn.disabled = false;
        btn.textContent = "entrar";
      }
    } catch (e) {
      console.error("Erro ao validar login:", e);
      erro.textContent = "erro de conexão, tente novamente";
      erro.classList.add("show");
      btn.disabled = false;
      btn.textContent = "entrar";
    }
  }

  /* ── API pública ─────────────────────────────────────────────── */
  window.kakawMenu = {
    open() {
      document.getElementById("kakaw-menu")?.classList.add("open");
      document.getElementById("kakaw-overlay")?.classList.add("open");
      travarBody();
      aguardarAuth(); // pré-carrega auth.js em segundo plano, sem bloquear a UI
    },
    close() {
      document.getElementById("kakaw-menu")?.classList.remove("open");
      document.getElementById("kakaw-overlay")?.classList.remove("open");
      liberarBody();
    },
    toggle() {
      const aberto = document.getElementById("kakaw-menu")?.classList.contains("open");
      aberto ? this.close() : this.open();
    }
  };

  /* Retrocompatibilidade com os HTMLs existentes */
  window.openMenu  = () => window.kakawMenu.open();
  window.closeMenu = () => window.kakawMenu.close();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injetar);
  } else {
    injetar();
  }

})();
