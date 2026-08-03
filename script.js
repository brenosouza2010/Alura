// script.js - tema: red <-> blue, contadores, progresso, export/import, atalhos e dicas
(function(){
  "use strict";

  // Configuração de chefes (adicione/edite aqui)
  const bosses = [
    { id: 'spider', name: 'Aranha Sufocada', note: 'Fuja do salto' },
    { id: 'coral', name: 'Coral Rainha', note: 'Priorize adds' },
    { id: 'blade', name: 'Mestre das Lâminas', note: 'Conte spins' },
    { id: 'flowers', name: 'Rainha das Flores', note: 'Evite áreas com espinhos' },
    { id: 'tome', name: 'Guardião do Tomo', note: 'Quebre o escudo primeiro' },
    { id: 'weblord', name: 'Senhor das Teias', note: 'Use dash lateral' }
  ];

  // Seletores
  const bossListEl = document.querySelector('.boss-list');
  const template = document.getElementById('boss-template');
  const totalCountEl = document.getElementById('total-count');
  const completedCountEl = document.getElementById('completed-count');
  const progressBar = document.getElementById('progress-bar');
  const progressWrap = document.getElementById('progress') || document.querySelector('.progress');
  const markAllBtn = document.getElementById('mark-all');
  const resetBtn = document.getElementById('reset');
  const exportBtn = document.getElementById('export');
  const importBtn = document.getElementById('import-btn');
  const importFileInput = document.getElementById('import-file');
  const modal = document.getElementById('completion-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const statusRegion = document.getElementById('status');
  const themeToggle = document.getElementById('theme-toggle');

  const STORAGE_KEY = 'silksong-v2-state';
  const THEME_KEY = 'silksong-theme';
  let state = loadState();

  // Inicialização
  totalCountEl.textContent = bosses.length;
  renderBosses();
  updateProgress();
  restoreTheme();

  // Render
  function renderBosses(){
    bossListEl.innerHTML = '';
    bosses.forEach(b => {
      const node = template.content.cloneNode(true);
      const bossEl = node.querySelector('.boss');
      const nameEl = node.querySelector('.boss-name');
      const noteEl = node.querySelector('.boss-note');
      const incBtn = node.querySelector('.inc');
      const decBtn = node.querySelector('.dec');
      const countEl = node.querySelector('.count');

      bossEl.dataset.id = b.id;
      nameEl.textContent = b.name;
      noteEl.textContent = b.note || '';

      const value = state[b.id] || 0;
      countEl.textContent = value;

      // Eventos
      incBtn.addEventListener('click', () => changeCount(b.id, +1, countEl));
      decBtn.addEventListener('click', () => changeCount(b.id, -1, countEl));
      incBtn.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); changeCount(b.id, +1, countEl); }});
      decBtn.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); changeCount(b.id, -1, countEl); }});

      bossListEl.appendChild(node);
    });
  }

  function changeCount(id, delta, countEl){
    const cur = state[id] || 0;
    const next = Math.max(0, cur + delta);
    state[id] = next;
    countEl.textContent = next;
    saveState();
    updateProgress();
    checkCompletion();
    announce(`Atualizado ${id}: ${next}`);
  }

  function updateProgress(){
    const completed = bosses.reduce((acc,b) => acc + ((state[b.id] || 0) > 0 ? 1 : 0), 0);
    const total = bosses.length;
    const pct = Math.round((completed / total) * 100);
    progressBar.style.width = pct + '%';
    if(progressWrap){
      progressWrap.setAttribute('aria-valuenow', completed);
      progressWrap.setAttribute('aria-valuetext', `${completed} de ${total} chefes`);
    }
    completedCountEl.textContent = completed;
  }

  function checkCompletion(){
    const all = bosses.every(b => (state[b.id] || 0) > 0);
    if(all) openModal();
  }

  function resetAll(){
    bosses.forEach(b => state[b.id] = 0);
    saveState();
    renderBosses();
    updateProgress();
    closeModal();
    announce('Progresso resetado');
  }

  function markAll(){
    bosses.forEach(b => state[b.id] = 1);
    saveState();
    renderBosses();
    updateProgress();
    checkCompletion();
    announce('Todos os chefes marcados');
  }

  // Modal
  function openModal(){
    modal.setAttribute('aria-hidden','false');
    closeModalBtn.focus();
    announce('Concluído! Você marcou todos os chefes.');
  }
  function closeModal(){
    modal.setAttribute('aria-hidden','true');
  }

  // Export / Import
  function exportState(){
    const data = { created: new Date().toISOString(), state };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'silksong-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    announce('Progresso exportado');
  }

  function importStateFile(file){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const parsed = JSON.parse(reader.result);
        if(parsed && parsed.state){
          state = Object.assign({}, state, parsed.state);
        }else if(parsed && typeof parsed === 'object'){
          state = Object.assign({}, state, parsed);
        }
        saveState();
        renderBosses();
        updateProgress();
        checkCompletion();
        announce('Progresso importado');
      }catch(e){
        announce('Erro ao importar arquivo: formato inválido');
        console.error(e);
      }
    };
    reader.readAsText(file);
  }

  // Persistence
  function loadState(){
    try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }catch(e){ return {}; }
  }
  function saveState(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){ console.error(e); } }

  // Accessibility: announcer
  function announce(message){
    if(statusRegion){
      statusRegion.textContent = message;
      setTimeout(()=> { statusRegion.textContent = ''; }, 2500);
    }
  }

  // Theme: defaults to 'red' (degrade), toggle to 'blue'
  function restoreTheme(){
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || 'red';
    setTheme(theme, false);
  }
  function setTheme(theme, save = true){
    if(theme === 'blue'){
      document.documentElement.setAttribute('data-theme','blue');
      themeToggle.setAttribute('aria-pressed','true');
      themeToggle.setAttribute('aria-label','Tema azul ativo — pressione para voltar ao vermelho');
    }else{
      document.documentElement.removeAttribute('data-theme'); // default red variables are :root
      themeToggle.setAttribute('aria-pressed','false');
      themeToggle.setAttribute('aria-label','Tema vermelho ativo — pressione para mudar para azul');
    }
    if(save) localStorage.setItem(THEME_KEY, theme);
    // Atualiza ícone do botão (pequena animação visual via CSS)
  }
  themeToggle.addEventListener('click', () => {
    const isBlue = document.documentElement.getAttribute('data-theme') === 'blue';
    setTheme(isBlue ? 'red' : 'blue');
  });

  // Event listeners
  resetBtn.addEventListener('click', resetAll);
  markAllBtn.addEventListener('click', markAll);
  exportBtn.addEventListener('click', exportState);
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) importStateFile(file);
    importFileInput.value = '';
  });

  closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    // Não ativar atalhos quando dentro de campos de texto
    const tag = document.activeElement && document.activeElement.tagName.toLowerCase();
    if(tag === 'input' || tag === 'textarea') return;

    if(e.key === 'Escape'){
      if(modal.getAttribute('aria-hidden') === 'false') closeModal();
    } else if(e.key === 'r' || e.key === 'R'){
      resetAll();
    } else if(e.key === 'm' || e.key === 'M'){
      markAll();
    } else if(e.key === 'e' || e.key === 'E'){
      exportState();
    } else if(e.key === 'i' || e.key === 'I'){
      importFileInput.click();
    }
  });

})();
