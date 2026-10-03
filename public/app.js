// ===== 开屏动画 =====
const codeSnippets = [
  '[    0.000000] Linux version 5.15.78-android13-4-sxre',
  '[    0.123456] Initializing cgroup subsys',
  '[    0.245678] CPU: ARMv8 Processor rev 12 (aarch64)',
  '[    0.367890] Memory: 8GB available',
  '[    0.489012] Loading SXRE kernel modules...',
  '[    0.612345] Mounting system partitions...',
  '[    0.734567] Starting Android Runtime (ART)',
  '[    0.856789] Zygote: Preloading classes...',
  '[    0.978901] SystemServer: Starting services...',
  '[    1.101234] ActivityManager: Starting SXRE Launcher',
  '[    1.223456] SurfaceFlinger: Initialized display',
  '[    1.345678] SXRE Optimization: AI Scheduler loaded',
  '[    1.467890] Root access: enabled by default',
  '[    1.590123] System boot completed successfully'
];
const codeBg = document.getElementById('codeBg');
for (let i = 0; i < 15; i++) {
  const line = document.createElement('div');
  line.className = 'code-line';
  line.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
  line.style.left = Math.random() * 100 + '%';
  line.style.animationDuration = (8 + Math.random() * 7) + 's';
  line.style.animationDelay = Math.random() * 3 + 's';
  codeBg.appendChild(line);
}
const bootSteps = [
  { progress: 10,  text: "正在初始化Linux内核..." },
  { progress: 25,  text: "加载SXRE专属内核模块..." },
  { progress: 40,  text: "挂载系统分区 /system /vendor..." },
  { progress: 55,  text: "启动Android运行时环境..." },
  { progress: 70,  text: "加载AI智能调度引擎..." },
  { progress: 85,  text: "初始化Root权限管理模块..." },
  { progress: 100, text: "系统启动完成，欢迎进入SXRE OS" }
];
const progressBar = document.getElementById('splashProgress');
const bootText = document.getElementById('bootText');
const splashScreen = document.getElementById('splashScreen');
let splashFinished = false;
function finishSplash() {
  if (splashFinished) return;
  splashFinished = true;
  splashScreen.classList.add('fade-out');
  initScrollObserver();
}
let stepIndex = 0;
const bootInterval = setInterval(() => {
  if (stepIndex < bootSteps.length) {
    const s = bootSteps[stepIndex];
    progressBar.style.width = s.progress + '%';
    bootText.textContent = s.text;
    stepIndex++;
  } else {
    clearInterval(bootInterval);
    setTimeout(finishSplash, 500);
  }
}, 350);

// ===== 状态 =====
let allGroups = [];
let teamMembers = [];   // 核心创始组：账号驱动
let me = null;
const ROLE_LABEL = { super: '超级管理员', operator: '运营者', sub: '子管理员', viewer: '普通用户' };

function getCookie(name) {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? m.pop() : '';
}

async function api(url, options = {}) {
  const opts = { credentials: 'same-origin', ...options, headers: { ...(options.headers || {}) } };
  if (opts.body && typeof opts.body !== 'string') {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  if (opts.method && opts.method !== 'GET') {
    opts.headers['X-CSRFToken'] = getCookie('csrftoken');
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ('请求失败 ' + res.status));
  return data;
}
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

const GROUP_ICONS = {
  core:   '<path d="M12 3l2.5 5.4 5.9.6-4.4 3.9 1.3 5.8L12 15.8 6.7 18.7l1.3-5.8-4.4-3.9 5.9-.6z"/>',
  dev:    '<polyline points="8.5 7.5 4.5 12 8.5 16.5"/><polyline points="15.5 7.5 19.5 12 15.5 16.5"/><line x1="13.2" y1="6" x2="10.8" y2="18"/>',
  design: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.9-.9 1.9-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A4.8 4.8 0 0 0 21 9.5C21 5.9 16.9 3 12 3z"/><circle cx="7.8" cy="11" r=".9" fill="url(#sxreGrad)" stroke="none"/><circle cx="12" cy="8" r=".9" fill="url(#sxreGrad)" stroke="none"/><circle cx="16.2" cy="11" r=".9" fill="url(#sxreGrad)" stroke="none"/>',
  test:   '<circle cx="12" cy="12" r="8.5"/><path d="M8.4 12.2l2.4 2.4 4.8-5"/>',
  new:    '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18.5 15.5l.8 2.1 2.2.8-2.2.8-.8 2.1-.8-2.1-2.2-.8 2.2-.8z"/>'
};

// 返回某个分组当前应展示的成员列表
function groupMembersFor(group) {
  if (group.key === 'core') {
    return teamMembers.map(t => ({
      avatar: t.avatar,
      name: t.display_name,
      role: t.title || '',
      desc: t.bio || '',
      qq: t.qq || '',
      coolapk: t.coolapk || '',
    }));
  }
  return group.members;
}

function renderTeamGrid() {
  const g = document.getElementById('teamGrid');
  g.innerHTML = '';
  allGroups.forEach(group => {
    const members = groupMembersFor(group);
    const card = document.createElement('div');
    card.className = 'glass-card rounded-2xl p-6 text-center hover:scale-105 transition-all duration-300 cursor-pointer group fade-in';
    const icon = GROUP_ICONS[group.key] || GROUP_ICONS.new;
    card.innerHTML = `
      <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/25 flex items-center justify-center text-primary group-hover:scale-110 group-hover:text-white group-hover:from-primary/60 group-hover:to-secondary/60 transition-all duration-300" style="font-size:1.9rem"><svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="url(#sxreGrad)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg></div>
      <h4 class="font-bold text-lg mb-1">${escapeHtml(group.title)}</h4>
      <p class="text-gray-400 text-sm">${members.length} 位成员</p>`;
    card.addEventListener('click', () => openGroupModal(group.key));
    g.appendChild(card);
  });
  observeFadeElements();
}

function openGroupModal(key) {
  const group = allGroups.find(g => g.key === key);
  if (!group) return;
  document.getElementById('groupTitle').textContent = group.title;
  const list = document.getElementById('memberList');
  list.innerHTML = '';
  const members = groupMembersFor(group);
  if (members.length === 0) {
    list.innerHTML = '<p class="col-span-full text-center text-gray-400 py-8">暂未添加成员</p>';
  } else {
    members.forEach(m => {
      const it = document.createElement('div');
      it.className = 'glass-card rounded-xl p-4 text-center hover:scale-105 transition-all duration-300 cursor-pointer';
      it.innerHTML = `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-3 flex items-center justify-center font-bold">${escapeHtml(m.avatar)}</div>
        <p class="font-bold">${escapeHtml(m.name)}</p>
        <p class="text-gray-400 text-xs">${escapeHtml(m.role)}</p>`;
      it.addEventListener('click', () => openMemberDetail(m));
      list.appendChild(it);
    });
  }
  const modal = document.getElementById('groupSelectModal');
  const content = document.getElementById('groupModalContent');
  modal.classList.remove('hidden');
  setTimeout(() => content.classList.add('modal-enter'), 10);
}

function openMemberDetail(m) {
  document.getElementById('detailAvatar').textContent = m.avatar;
  document.getElementById('detailName').textContent = m.name;
  document.getElementById('detailRole').textContent = m.role;
  document.getElementById('detailDesc').textContent = m.desc;
  document.getElementById('detailQQ').href = m.qq || '#';
  document.getElementById('detailCoolapk').href = m.coolapk || '#';
  closeGroupModal();
  const modal = document.getElementById('memberDetailModal');
  const content = document.getElementById('detailModalContent');
  modal.classList.remove('hidden');
  setTimeout(() => content.classList.add('modal-enter'), 10);
}

function closeGroupModal() {
  const m = document.getElementById('groupSelectModal');
  const c = document.getElementById('groupModalContent');
  c.classList.remove('modal-enter');
  setTimeout(() => m.classList.add('hidden'), 300);
}
function closeDetailModal() {
  const m = document.getElementById('memberDetailModal');
  const c = document.getElementById('detailModalContent');
  c.classList.remove('modal-enter');
  setTimeout(() => m.classList.add('hidden'), 300);
}

function openLoginModal() {
  const m = document.getElementById('adminLoginModal');
  const c = document.getElementById('loginModalContent');
  m.classList.remove('hidden');
  setTimeout(() => c.classList.add('modal-enter'), 10);
}
function closeLoginModal() {
  const m = document.getElementById('adminLoginModal');
  const c = document.getElementById('loginModalContent');
  c.classList.remove('modal-enter');
  setTimeout(() => {
    m.classList.add('hidden');
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
  }, 300);
}

async function handleLogin() {
  const u = document.getElementById('adminUsername').value.trim();
  const p = document.getElementById('adminPassword').value.trim();
  if (!u || !p) { alert('请输入账号和密码'); return; }
  const btn = document.getElementById('loginSubmitBtn');
  btn.disabled = true;
  try {
    const d = await api('/api/login', { method: 'POST', body: { username: u, password: p } });
    me = d;
    closeLoginModal();
    await openManageModal();
  } catch (e) { alert(e.message); }
  finally { btn.disabled = false; }
}

async function handleLogout() {
  try { await api('/api/logout', { method: 'POST' }); } catch (_) {}
  me = null;
  closeManageModal();
}

async function openManageModal() {
  document.getElementById('currentAdminInfo').textContent =
    `当前登录：${me.display_name || me.username}（${ROLE_LABEL[me.role] || me.role}）`;

  document.getElementById('subAdminManageSection').classList.toggle('hidden', !me.isSuper);
  document.getElementById('addMemberSection').classList.toggle('hidden', !me.canManageContent);
  document.getElementById('groupEditSection').classList.toggle('hidden', !me.canManageGroup);
  document.getElementById('teamManageSection').classList.toggle('hidden', !me.canManageGroup);
  document.getElementById('serverConsoleSection')?.classList.toggle('hidden', !me.canManageGroup);
  document.getElementById('manageMemberSection').classList.toggle('hidden', !me.canManageContent);

  if (me.isSuper) await renderAccounts();
  if (me.canManageGroup) {
    renderGroupEditor();
    await renderTeamManageList();
  }
  if (me.canManageContent) renderManageMemberList();

  const modal = document.getElementById('memberManageModal');
  const content = document.getElementById('manageModalContent');
  modal.classList.remove('hidden');
  setTimeout(() => content.classList.add('modal-enter'), 10);
}
function closeManageModal() {
  const m = document.getElementById('memberManageModal');
  const c = document.getElementById('manageModalContent');
  c.classList.remove('modal-enter');
  setTimeout(() => m.classList.add('hidden'), 300);
}

// ===== 账号管理 =====
async function renderAccounts() {
  const list = document.getElementById('subAdminList');
  list.innerHTML = '<p class="text-gray-400 text-sm py-2">加载中...</p>';
  try {
    const d = await api('/api/accounts');
    list.innerHTML = '';
    d.accounts.forEach(a => {
      const it = document.createElement('div');
      it.className = 'glass-card rounded-lg p-3 flex justify-between items-center';
      const isSelf = a.username === me.username;
      it.innerHTML = `
        <div>
          <span class="font-bold">${escapeHtml(a.username)}</span>
          <span class="text-xs text-gray-400 ml-2">${escapeHtml(a.display_name)}</span>
          <span class="text-xs ml-2 text-secondary">${ROLE_LABEL[a.role] || a.role}</span>
        </div>
        ${isSelf ? '<span class="text-xs text-gray-500">（当前账号）</span>' :
          `<button data-id="${a.id}" class="del text-red-400 hover:text-red-300 px-3 py-1 rounded-lg hover:bg-red-500/10">删除</button>`}
      `;
      const btn = it.querySelector('.del');
      if (btn) btn.addEventListener('click', () => deleteAccount(a.id, a.username));
      list.appendChild(it);
    });
  } catch (e) {
    list.innerHTML = `<p class="text-red-400 text-sm py-2">加载失败：${escapeHtml(e.message)}</p>`;
  }
}

async function addAccount() {
  const username = document.getElementById('newSubAdminUser').value.trim();
  const password = document.getElementById('newSubAdminPwd').value.trim();
  const role = document.getElementById('newAccountRole').value;
  if (!username || !password) { alert('请填写完整的用户名和密码'); return; }
  try {
    await api('/api/accounts', { method: 'POST', body: { username, password, role } });
    document.getElementById('newSubAdminUser').value = '';
    document.getElementById('newSubAdminPwd').value = '';
    await renderAccounts();
    alert('账号已创建');
  } catch (e) { alert(e.message); }
}

async function deleteAccount(id, username) {
  if (!confirm(`确定要删除账号 ${username} 吗？`)) return;
  try {
    await api('/api/accounts/' + id, { method: 'DELETE' });
    await renderAccounts();
    await renderTeamManageList();
  } catch (e) { alert(e.message); }
}

// ===== 分组标题编辑 =====
function renderGroupEditor() {
  const box = document.getElementById('groupEditList');
  box.innerHTML = '';
  allGroups.forEach(g => {
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-center';
    row.innerHTML = `
      <span class="text-gray-400 text-xs w-16 shrink-0">${escapeHtml(g.key)}</span>
      <input class="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white" value="${escapeHtml(g.title)}">
      <button class="glass-card px-3 py-2 rounded-lg hover:scale-105 transition">保存</button>
    `;
    const input = row.querySelector('input');
    row.querySelector('button').addEventListener('click', async () => {
      try {
        const d = await api('/api/groups/' + encodeURIComponent(g.key), {
          method: 'PUT', body: { title: input.value.trim() }
        });
        allGroups = d.groups;
        renderTeamGrid();
        renderGroupEditor();
        alert('已保存');
      } catch (e) { alert(e.message); }
    });
    box.appendChild(row);
  });
}

// ===== 核心创始组管理（账号驱动） =====
async function renderTeamManageList() {
  const box = document.getElementById('teamManageList');
  box.innerHTML = '<p class="text-gray-400 text-sm py-2">加载中...</p>';
  try {
    const d = await api('/api/team/manage');
    box.innerHTML = '';
    if (d.members.length === 0) {
      box.innerHTML = '<p class="text-gray-500 text-sm py-2">暂无账号，先到上面"账号管理"创建</p>';
      return;
    }
    d.members.forEach(m => {
      const row = document.createElement('div');
      row.className = 'glass-card rounded-lg p-4 space-y-2';
      row.innerHTML = `
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" class="team-show" ${m.show_in_team ? 'checked' : ''}>
            展示在核心创始组
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" class="team-helper" ${m.helper_flag === 1 ? 'checked' : ''}>
            帮助成员（data=1）
          </label>
          <span class="font-bold ml-2">${escapeHtml(m.username)}</span>
          <span class="text-xs text-gray-400">(${ROLE_LABEL[m.role] || m.role})</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input class="team-display bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="显示名" value="${escapeHtml(m.display_name)}">
          <input class="team-title bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="特殊头衔（如：系统架构师）" value="${escapeHtml(m.title)}">
          <input class="team-avatar bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="头像缩写" maxlength="3" value="${escapeHtml(m.avatar)}">
          <input class="team-order bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" type="number" placeholder="排序号（小在前）" value="${m.team_order}">
          <input class="team-qq bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="QQ链接" value="${escapeHtml(m.qq)}">
          <input class="team-coolapk bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="酷安链接" value="${escapeHtml(m.coolapk)}">
        </div>
        <textarea class="team-bio w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" rows="2" placeholder="个人简介">${escapeHtml(m.bio)}</textarea>
        <div class="flex justify-end">
          <button class="glass-card px-4 py-2 rounded-lg hover:scale-105 transition text-sm">保存</button>
        </div>
      `;
      row.querySelector('button').addEventListener('click', () => saveTeamMember(m.id, row));
      box.appendChild(row);
    });
  } catch (e) {
    box.innerHTML = `<p class="text-red-400 text-sm py-2">加载失败：${escapeHtml(e.message)}</p>`;
  }
}

async function saveTeamMember(id, row) {
  const payload = {
    display_name: row.querySelector('.team-display').value.trim(),
    title:        row.querySelector('.team-title').value.trim(),
    avatar:       row.querySelector('.team-avatar').value.trim().slice(0, 3),
    bio:          row.querySelector('.team-bio').value.trim(),
    qq:           row.querySelector('.team-qq').value.trim(),
    coolapk:      row.querySelector('.team-coolapk').value.trim(),
    show_in_team: row.querySelector('.team-show').checked,
    helper_flag:  row.querySelector('.team-helper').checked ? 1 : 0,
    team_order:   parseInt(row.querySelector('.team-order').value, 10) || 0,
  };
  try {
    await api('/api/team/' + id, { method: 'PATCH', body: payload });
    const t = await api('/api/team');
    teamMembers = t.members;
    renderTeamGrid();
    await renderTeamManageList();
    alert('已保存，刷新首页即可看到');
  } catch (e) { alert(e.message); }
}

// ===== 其他分组成员 =====
async function addNewMember() {
  const p = {
    avatar:  document.getElementById('newMemberAvatar').value.trim().slice(0, 3),
    name:    document.getElementById('newMemberName').value.trim(),
    role:    document.getElementById('newMemberRole').value.trim(),
    group:   document.getElementById('newMemberGroup').value,
    desc:    document.getElementById('newMemberDesc').value.trim(),
    qq:      document.getElementById('newMemberQQ').value.trim(),
    coolapk: document.getElementById('newMemberCoolapk').value.trim()
  };
  if (!p.avatar || !p.name || !p.role || !p.desc || !p.qq || !p.coolapk) {
    alert('请填写完整的成员信息'); return;
  }
  try {
    const d = await api('/api/members', { method: 'POST', body: p });
    allGroups = d.groups;
    renderTeamGrid();
    renderManageMemberList();
    ['newMemberAvatar','newMemberName','newMemberRole','newMemberDesc','newMemberQQ','newMemberCoolapk']
      .forEach(id => document.getElementById(id).value = '');
    alert('成员添加成功');
  } catch (e) { alert(e.message); }
}

async function deleteMember(id, name) {
  if (!confirm(`确定要删除成员 ${name} 吗？`)) return;
  try {
    const d = await api('/api/members/' + id, { method: 'DELETE' });
    allGroups = d.groups;
    renderTeamGrid();
    renderManageMemberList();
  } catch (e) { alert(e.message); }
}

function renderManageMemberList() {
  const list = document.getElementById('manageMemberList');
  list.innerHTML = '';
  allGroups.forEach(g => {
    if (g.key === 'core') return; // 核心创始组走账号管理
    g.members.forEach(m => {
      const it = document.createElement('div');
      it.className = 'glass-card rounded-lg p-3 flex justify-between items-center';
      it.innerHTML = `<div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-sm">${escapeHtml(m.avatar)}</div>
        <div><p class="font-bold">${escapeHtml(m.name)} <span class="text-xs text-gray-400 ml-2">${escapeHtml(g.title)}</span></p>
        <p class="text-xs text-gray-400">${escapeHtml(m.role)}</p></div></div>
        <button class="text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10">删除</button>`;
      it.querySelector('button').addEventListener('click', () => deleteMember(m.id, m.name));
      list.appendChild(it);
    });
  });
  if (list.children.length === 0) {
    list.innerHTML = '<p class="text-center text-gray-400 py-4">其他分组暂无成员</p>';
  }
}

// ===== 滚动动画 =====
let observer = null;
function initScrollObserver() {
  if (observer) return;
  if (!('IntersectionObserver' in window)) { document.body.classList.add('no-observer'); return; }
  observer = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  observeFadeElements();
}
function observeFadeElements() {
  if (!observer) return;
  document.querySelectorAll('.fade-in:not(.visible)').forEach(el => observer.observe(el));
}
window.addEventListener('scroll', () => {
  document.querySelector('nav').classList.toggle('is-scrolled', window.scrollY > 50);
}, { passive: true });

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const s = await api('/api/session');
    if (s.loggedIn) me = s;
  } catch (e) {}

  try {
    const d = await api('/api/members');
    allGroups = d.groups;
  } catch (e) {
    document.getElementById('teamGrid').innerHTML =
      `<p class="col-span-full text-center text-red-400 py-8">成员加载失败：${escapeHtml(e.message)}</p>`;
  }

  try {
    const t = await api('/api/team');
    teamMembers = t.members;
  } catch (e) {
    console.warn('核心创始组加载失败', e);
  }

  renderTeamGrid();

  const mm = document.getElementById('mobileMenu');
  const mb = document.getElementById('mobileMenuBtn');
  mb.addEventListener('click', () => {
    const hidden = mm.classList.toggle('hidden');
    mb.setAttribute('aria-expanded', String(!hidden));
  });
  document.querySelectorAll('#mobileMenu a').forEach(a => a.addEventListener('click', () => {
    mm.classList.add('hidden');
    mb.setAttribute('aria-expanded', 'false');
  }));

  document.getElementById('closeGroupModal').addEventListener('click', closeGroupModal);
  document.getElementById('groupOverlay').addEventListener('click', closeGroupModal);
  document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
  document.getElementById('detailOverlay').addEventListener('click', closeDetailModal);
  document.getElementById('openLoginBtn').addEventListener('click', openLoginModal);
  document.getElementById('closeLoginModal').addEventListener('click', closeLoginModal);
  document.getElementById('loginOverlay').addEventListener('click', closeLoginModal);
  document.getElementById('loginSubmitBtn').addEventListener('click', handleLogin);
  document.getElementById('closeManageModal').addEventListener('click', closeManageModal);
  document.getElementById('manageOverlay').addEventListener('click', closeManageModal);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('addSubAdminBtn').addEventListener('click', addAccount);

  // ---- 服务器控制台 ----
  document.getElementById('execRunBtn')?.addEventListener('click', runServerCommand);
  document.getElementById('execClearBtn')?.addEventListener('click', () => {
    const o = document.getElementById('execOutput');
    if (o) o.textContent = '等待执行...';
  });
  document.getElementById('execAuditBtn')?.addEventListener('click', loadAuditLog);
  document.getElementById('execCommand')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') runServerCommand();
  });
  document.getElementById('addNewMemberBtn').addEventListener('click', addNewMember);

  // ---- 注册 ----
  document.getElementById('openRegisterBtn')?.addEventListener('click', () => {
    closeLoginModal();
    setTimeout(openRegisterModal, 320);
  });
  document.getElementById('closeRegisterModal')?.addEventListener('click', closeRegisterModal);
  document.getElementById('registerOverlay')?.addEventListener('click', closeRegisterModal);
  document.getElementById('registerSubmitBtn')?.addEventListener('click', handleRegister);
  ['regUsername','regPassword','regPassword2'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleRegister();
    });
  });

  ['adminUsername','adminPassword'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  });

  setTimeout(() => { if (!splashFinished) finishSplash(); }, 6000);
});


// ===== 注册 =====
function openRegisterModal() {
  const m = document.getElementById('registerModal');
  const c = document.getElementById('registerModalContent');
  if (!m) return;
  m.classList.remove('hidden');
  setTimeout(() => c.classList.add('modal-enter'), 10);
}
function closeRegisterModal() {
  const m = document.getElementById('registerModal');
  const c = document.getElementById('registerModalContent');
  if (!m) return;
  c.classList.remove('modal-enter');
  setTimeout(() => {
    m.classList.add('hidden');
    document.getElementById('regUsername').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regPassword2').value = '';
  }, 300);
}

async function handleRegister() {
  const u = document.getElementById('regUsername').value.trim();
  const p = document.getElementById('regPassword').value.trim();
  const p2 = document.getElementById('regPassword2').value.trim();
  if (!u || !p) { alert('请填写用户名和密码'); return; }
  if (p !== p2) { alert('两次输入的密码不一致'); return; }
  const btn = document.getElementById('registerSubmitBtn');
  btn.disabled = true;
  try {
    const d = await api('/api/register', { method: 'POST', body: { username: u, password: p, password2: p2 } });
    me = d;
    closeRegisterModal();
    alert(`注册成功，欢迎 ${d.display_name || d.username}！`);
  } catch (e) {
    alert(e.message);
  } finally {
    btn.disabled = false;
  }
}


// ===== 服务器控制台 =====
async function runServerCommand() {
  const cmdEl = document.getElementById('execCommand');
  const pwdEl = document.getElementById('execPassword');
  const out = document.getElementById('execOutput');
  const cmd = cmdEl.value.trim();
  const pwd = pwdEl.value;
  if (!cmd) { alert('请输入命令'); return; }
  if (!pwd) { alert('请输入登录密码确认'); return; }
  out.textContent = `$ ${cmd}\n执行中...`;
  try {
    const d = await api('/api/server/exec', {
      method: 'POST', body: { command: cmd, password: pwd }
    });
    let text = `$ ${cmd}\n`;
    if (d.stdout) text += d.stdout;
    if (d.stderr) text += (d.stdout ? '\n' : '') + '[stderr]\n' + d.stderr;
    text += `\n[exit ${d.exit_code}]`;
    out.textContent = text;
    pwdEl.value = '';
  } catch (e) {
    out.textContent = `$ ${cmd}\n[错误] ${e.message}`;
  }
}

async function loadAuditLog() {
  const box = document.getElementById('auditLogBox');
  if (!box) return;
  box.classList.toggle('hidden');
  if (box.classList.contains('hidden')) return;
  box.textContent = '加载中...';
  try {
    const d = await api('/api/server/audit');
    box.innerHTML = d.logs.map(l =>
      `<div class="border-b border-white/10 py-1">
        <span class="text-gray-500">${escapeHtml(l.created_at)}</span>
        <span class="text-yellow-400 ml-2">${escapeHtml(l.username)}</span>
        <span class="ml-2 text-white font-mono">${escapeHtml(l.command)}</span>
        <span class="text-gray-500 ml-2">[exit ${l.exit_code}]</span>
      </div>`
    ).join('') || '<p class="text-gray-500">暂无记录</p>';
  } catch (e) {
    box.textContent = '加载失败：' + e.message;
  }
}
