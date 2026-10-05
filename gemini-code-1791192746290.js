const STORE_KEY = 'vball_tournament_apps_v1';
const pages = [...document.querySelectorAll('.page')];
const traitOptions = ['喊聲擔當', '飛撲救球', '氣氛大師', '穩健發球', '努力狂奔', '精準舉球', '安全第一', '佛系打球'];

// 多頁面切換
function go(id) {
  pages.forEach(p => p.classList.toggle('active', p.id === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'admin') renderAdmin();
}
document.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => go(el.dataset.go)));

// 標籤選擇器 Setup
function setupTagPickers() {
  document.querySelectorAll('[data-tag-picker]').forEach(box => {
    const list = box.querySelector('[data-options]');
    const hidden = box.querySelector('[data-tag-value]');
    const count = box.querySelector('.tag-count');
    const max = Number(box.dataset.max || 3);
    
    list.innerHTML = '';
    traitOptions.forEach(val => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag-chip';
      btn.textContent = val;
      btn.addEventListener('click', () => {
        btn.classList.toggle('selected');
        const selected = [...list.querySelectorAll('.tag-chip.selected')].map(b => b.textContent);
        if (selected.length > max) {
          btn.classList.remove('selected');
          alert(`最多只能選擇 ${max} 個標籤！`);
          return;
        }
        hidden.value = selected.join('、');
        count.textContent = `${selected.length} / ${max}`;
      });
      list.appendChild(btn);
    });
  });
}

// 步驟表單切換
let step = 1;
const stepEls = [...document.querySelectorAll('.form-step')];
const progressEls = [...document.querySelectorAll('.progress > div')];

function showStep(n) {
  step = n;
  stepEls.forEach(el => el.classList.toggle('show', Number(el.dataset.step) === n));
  progressEls.forEach((el, i) => el.classList.toggle('active', i < n));
}

document.querySelectorAll('.next').forEach(btn => btn.addEventListener('click', () => {
  const current = document.querySelector(`.form-step[data-step="${step}"]`);
  const fields = [...current.querySelectorAll('input, select, textarea')];
  for (const f of fields) {
    if (!f.checkValidity()) { f.reportValidity(); return; }
  }
  showStep(Math.min(3, step + 1));
}));

document.querySelectorAll('.prev').forEach(btn => btn.addEventListener('click', () => showStep(Math.max(1, step - 1))));

// 載入與儲存 LocalStorage
function loadApps() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; } }
function saveApps(apps) { localStorage.setItem(STORE_KEY, JSON.stringify(apps)); renderAdmin(); }

// 表單送出
document.getElementById('registrationForm').addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const apps = loadApps();
  const app = {
    id: `VB-${String(apps.length + 1).padStart(3, '0')}`,
    name: fd.get('name'), nickname: fd.get('nickname'), gender: fd.get('gender'),
    department: fd.get('department'), phone: fd.get('phone'), email: fd.get('email'),
    level: fd.get('level'), position: fd.get('position'), frequency: fd.get('frequency'),
    referee: fd.get('referee'), traits: fd.get('traits'), sockSize: fd.get('sockSize'),
    drink: fd.get('drink'), miniGame: fd.get('miniGame'), organizerNote: fd.get('organizerNote'),
    createdAt: new Date().toLocaleString('zh-TW')
  };
  apps.unshift(app);
  saveApps(apps);
  alert(`報名成功！你的報名編號為：${app.id}`);
  e.currentTarget.reset();
  showStep(1);
  go('status');
  document.getElementById('statusKey').value = app.email;
  findStatus(app.email);
});

// 查詢狀態
function findStatus(key) {
  const apps = loadApps();
  const app = apps.find(a => a.email === key || a.phone === key);
  const box = document.getElementById('statusResult');
  box.classList.remove('hidden');
  if (app) {
    box.innerHTML = `
      <h3>報名成功！編號：#${app.id}</h3>
      <p><b>姓名：</b>${app.name} (${app.nickname})</p>
      <p><b>部門：</b>${app.department}</p>
      <p><b>戰力等級：</b>${app.level} 級</p>
      <p><b>排球襪尺寸：</b>${app.sockSize}</p>
      <p><b>慶功飲料：</b>${app.drink}</p>
    `;
  } else {
    box.innerHTML = `<p>查無報名資料，請確認 Email 或手機是否填寫正確。</p>`;
  }
}
document.getElementById('statusBtn').addEventListener('click', () => findStatus(document.getElementById('statusKey').value.trim()));

// 後台渲染與預設資料
function renderAdmin() {
  const apps = loadApps();
  document.getElementById('kpiTotal').textContent = apps.length;
  document.getElementById('kpiHigh').textContent = apps.filter(a => ['S', 'A'].includes(a.level)).length;
  document.getElementById('kpiLow').textContent = apps.filter(a => ['B', 'C'].includes(a.level)).length;
  
  const container = document.getElementById('admin-review');
  if (!apps.length) { container.innerHTML = '<p>目前尚無報名資料。</p>'; return; }
  
  container.innerHTML = apps.map(a => `
    <article class="app-card">
      <h3>#${a.id} ${a.name} (${a.nickname}) — <small>${a.department}</small></h3>
      <p><b>性別/等級：</b>${a.gender}｜${a.level} 級 (${a.position})</p>
      <p><b>特質標籤：</b>${a.traits || '無'}</p>
      <p><b>襪子/飲料：</b>${a.sockSize}｜${a.drink}</p>
      <p><b>偷分大作戰：</b>${a.miniGame}</p>
      <small style="opacity:0.6">報名時間：${a.createdAt}</small>
    </article>
  `).join('');
}

document.getElementById('seedDemo').addEventListener('click', () => {
  const seed = [
    { id: 'VB-001', name: '王大明', nickname: 'Ming', gender: '男', department: '技術部', phone: '0911222333', email: 'ming@company.com', level: 'S', position: '主攻', frequency: '每週 2 次以上', referee: '沒問題', traits: '飛撲救球', sockSize: 'L (28 - 30 cm)', drink: '紅茶拿鐵 微糖去冰', miniGame: '超想上去！', createdAt: '2026/10/05 10:00' },
    { id: 'VB-002', name: '陳小美', nickname: 'May', gender: '女', department: '行銷部', phone: '0944555666', email: 'may@company.com', level: 'C', position: '沒有固定位置', frequency: '偶爾', referee: '聽從大會安排', traits: '氣氛大師', sockSize: 'S (22 - 24 cm)', drink: '四季春茶 無糖微冰', miniGame: '在場邊喝水加油', createdAt: '2026/10/05 10:15' }
  ];
  localStorage.setItem(STORE_KEY, JSON.stringify(seed));
  renderAdmin();
});

// 初始化
setupTagPickers();