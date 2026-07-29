// script.js — interatividade e persistência (localStorage)
// Boas práticas de acessibilidade: usar aria-pressed, aria-live e suportar teclado.

(() => {
  const ACTS = [1,2,3];
  const content = document.getElementById('content');
  const navBtns = document.querySelectorAll('.nav-btn');
  const tipBtns = document.querySelectorAll('.tip-btn');
  const completeBtns = document.querySelectorAll('.complete-btn');
  const statusEls = {
    1: document.getElementById('status-1'),
    2: document.getElementById('status-2'),
    3: document.getElementById('status-3'),
  };
  const clickCountEl = document.getElementById('click-count');
  const completionBanner = document.getElementById('completion-banner');
  const resetBtn = document.getElementById('reset-progress');
  const themeToggle = document.getElementById('theme-toggle');
  const statsModal = document.getElementById('stats-modal');
  const showStats = document.getElementById('show-stats');
  const closeStats = document.getElementById('close-stats');
  const statsContent = document.getElementById('stats-content');

  // State (persistido)
  const storage = {
    get(key, fallback){
      try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){return fallback}
    },
    set(key, value){
      try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){}
    }
  };

  let interactionCount = storage.get('interactionCount', 0);
  let completedActs = storage.get('completedActs', {1:false,2:false,3:false});
  let theme = storage.get('theme', 'light');

  // Inicialização do tema
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
  themeToggle.addEventListener('click', () => {
    theme = (theme === 'dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    storage.set('theme', theme);
    themeToggle.setAttribute('aria-pressed', theme === 'dark');
  });

  // Mostrar estatísticas (modal)
  showStats.addEventListener('click', () => {
    if (typeof statsModal.showModal === 'function') {
      statsContent.innerHTML = `<p>Total de interações (dicas mostradas): <strong>${interactionCount}</strong></p>
        <p>Atos concluídos: ${ACTS.filter(a => completedActs[a]).length} / ${ACTS.length}</p>`;
      statsModal.showModal();
    } else {
      alert(`Interações: ${interactionCount}\nAtos concluídos: ${ACTS.filter(a=>completedActs[a]).length}`);
    }
  });
  closeStats && closeStats.addEventListener('click', () => statsModal.close());

  // Atualiza UI de progresso
  function updateProgressUI(){
    ACTS.forEach(a=>{
      statusEls[a].textContent = completedActs[a] ? 'Concluído' : 'Pendente';
      const btn = document.querySelector(`.complete-btn[data-act="${a}"]`);
      if(btn){
        btn.setAttribute('aria-pressed', completedActs[a]);
        btn.textContent = completedActs[a] ? `Ato ${a} concluído` : `Marcar Ato ${a} como concluído`;
      }
    });
    clickCountEl.textContent = interactionCount;
    // Se todos completos, mostra banner
    const allDone = ACTS.every(a => completedActs[a]);
    completionBanner.hidden = !allDone;
  }

  // Navegação entre atos
  function showAct(actNumber){
    document.querySelectorAll('.act').forEach(el=>{
      el.hidden = String(el.dataset.act) !== String(actNumber);
    });
    // Marca nav buttons aria-pressed
    navBtns.forEach(nb=>{
      const pressed = nb.dataset.act === String(actNumber);
      nb.setAttribute('aria-pressed', pressed);
    });
    // Move foco para o título do ato
    const actEl = document.getElementById(`act-${actNumber}`);
    if(actEl){
      const h2 = actEl.querySelector('h2');
      h2 && h2.focus && h2.setAttribute('tabindex','-1') && h2.focus();
    }
  }

  // Eventos nav
  navBtns.forEach(b=>{
    b.addEventListener('click', () => showAct(b.dataset.act));
    b.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); }
    });
  });

  // Dicas: contador de interações (exemplo de contagem dinâmica)
  tipBtns.forEach(tb=>{
    tb.addEventListener('click', () => {
      interactionCount++;
      storage.set('interactionCount', interactionCount);
      clickCountEl.textContent = interactionCount;
      // Exibe dica em um alert acessível — em app real, usar region/tooltip
      const act = tb.closest('.act');
      const actNum = act ? act.dataset.act : '—';
      const message = `Dica do Ato ${actNum}: Lembre-se de adaptar sua build conforme a fase do chefe. (Interações: ${interactionCount})`;
      // Use polite live region update
      const lr = document.createElement('div');
      lr.setAttribute('aria-live','polite');
      lr.style.position='absolute';lr.style.left='-9999px';
      lr.textContent = message;
      document.body.appendChild(lr);
      setTimeout(()=>document.body.removeChild(lr),2000);
    });
  });

  // Marcar ato concluído
  completeBtns.forEach(cb=>{
    cb.addEventListener('click', () => {
      const act = cb.dataset.act;
      completedActs[act] = true;
      storage.set('completedActs', completedActs);
      updateProgressUI();
    });
  });

  resetBtn.addEventListener('click', () => {
    if(confirm('Resetar todo o progresso e interações?')){
      interactionCount = 0;
      completedActs = {1:false,2:false,3:false};
      storage.set('interactionCount', interactionCount);
      storage.set('completedActs', completedActs);
      updateProgressUI();
    }
  });

  // Inicialização: mostrar Ato 1 por padrão
  if(!document.querySelector('.act:not([hidden])')) showAct(1);
  updateProgressUI();

  // Lógica condicional adicional: se interações > 10 e nem todos completos, sugerir descanso
  setInterval(()=>{
    if(interactionCount > 10 && !ACTS.every(a=>completedActs[a])){
      // notificar o usuário de forma não intrusiva
      console.info('Lembrete: faça pausas regulares para manter a concentração.');
    }
  }, 60000);

  // Expor poucas funcionalidades para depuração (opcional)
  window.__guide = {showAct, getState:() => ({interactionCount, completedActs, theme})};
})();
