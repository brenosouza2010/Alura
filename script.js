// script.js - interatividade: contadores, tema, lógica condicional e persistência
(function(){
  "use strict";

  const bosses = [
    { id: 'spider', name: 'Aranha Sufocada' },
    { id: 'coral', name: 'Coral Rainha' },
    { id: 'blade', name: 'Mestre das Lâminas' }
  ];

  // Elementos
  const bossListEl = document.querySelector('.boss-list');
  const template = document.getElementById('boss-template');
  const totalEl = document.getElementById('total');
  const totalTargetEl = document.getElementById('total-target');
  const resetBtn = document.getElementById('reset');
  const markAllBtn = document.getElementById('mark-all');
  const modal = document.getElementById('completion-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const themeToggle = document.getElementById('theme-toggle');

  const STORAGE_KEY = 'silksong-alma-state-v1';
  let state = loadState();

  // Inicializa UI
  totalTargetEl.textContent = bosses.length;
  renderBosses();
  updateTotal();
  restoreTheme();

  // Renderiza itens a partir do template
  function renderBosses(){
    bossListEl.innerHTML = '';
    bosses.forEach(b => {
      const node = template.content.cloneNode(true);
      const bossEl = node.querySelector('.boss');
      const nameEl = node.querySelector('.boss-name');
      const incBtn = node.querySelector('.inc');
      const decBtn = node.querySelector('.dec');
      const countEl = node.querySelector('.count');

      bossEl.dataset.id = b.id;
      nameEl.textContent = b.name;
      const value = state[b.id] || 0;
      countEl.textContent = value;

      incBtn.addEventListener('click', () => { changeCount(b.id, +1, countEl); });
      decBtn.addEventListener('click', () => { changeCount(b.id, -1, countEl); });

      // Keyboard accessible: Enter increments
      incBtn.addEventListener('keydown', e => { if(e.key === 'Enter') changeCount(b.id, +1, countEl); });
      decBtn.addEventListener('keydown', e => { if(e.key === 'Enter') changeCount(b.id, -1, countEl); });

      bossListEl.appendChild(node);
    });
  }

  function changeCount(id, delta, countEl){
    const current = state[id] || 0;
    const next = Math.max(0, current + delta);
    state[id] = next;
    countEl.textContent = next;
    saveState();
    updateTotal();
    checkCompletion();
  }

  function updateTotal(){
    const total = bosses.reduce((acc,b) => acc + (state[b.id] || 0), 0);
    totalEl.textContent = total;
  }

  function resetAll(){
    bosses.forEach(b => state[b.id] = 0);
    saveState();
    renderBosses();
    updateTotal();
    closeModal();
  }

  function markAll(){
    bosses.forEach(b => state[b.id] = 1);
    saveState();
    renderBosses();
    updateTotal();
    checkCompletion();
  }

  function checkCompletion(){
    const allDone = bosses.every(b => (state[b.id] || 0) > 0);
    if(allDone) openModal();
  }

  // Modal accessible
  function openModal(){
    modal.setAttribute('aria-hidden','false');
    // move focus para o botão fechar
    closeModalBtn.focus();
  }
  function closeModal(){
    modal.setAttribute('aria-hidden','true');
  }

  // Event listeners
  resetBtn.addEventListener('click', resetAll);
  markAllBtn.addEventListener('click', markAll);
  closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
      if(modal.getAttribute('aria-hidden') === 'false') closeModal();
    }
  });

  // Persistence
  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    }catch(e){ return {}; }
  }
  function saveState(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  }

  // Theme toggle with persistence
  function restoreTheme(){
    const saved = localStorage.getItem('silksong-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    setTheme(theme);
  }

  function setTheme(theme){
    if(theme === 'dark'){
      document.documentElement.setAttribute('data-theme','dark');
      themeToggle.setAttribute('aria-pressed','true');
    }else{
      document.documentElement.removeAttribute('data-theme');
      themeToggle.setAttribute('aria-pressed','false');
    }
    localStorage.setItem('silksong-theme', theme);
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
  });

})();
