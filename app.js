/* ===========================
   PARTICLE ANIMATION
=========================== */
(function() {
  const canvas = document.getElementById('particle-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  let count = Math.min(isMobile ? 40 : 100, Math.floor(window.innerWidth / 10));

  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.6,
      speed: Math.random() * 0.6 + 0.1
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    particles.forEach(p => {
      p.y -= p.speed;
      if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
      ctx.moveTo(p.x + p.size, p.y);
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
})();

/* ===========================
   PAGE SWITCHING
=========================== */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ===========================
   LOGIN TAB TOGGLE
=========================== */
const btnSlider = document.getElementById('btn');

function showLogin() {
  document.getElementById('LogIn').classList.add('active');
  document.getElementById('Register').classList.remove('active');
  btnSlider.style.left = '0';
}

function showRegister() {
  document.getElementById('Register').classList.add('active');
  document.getElementById('LogIn').classList.remove('active');
  btnSlider.style.left = '50%';
}

/* ===========================
   PASSWORD TOGGLE
=========================== */
document.getElementById('sifreToggle').addEventListener('change', function() {
  document.getElementById('girissifre').type = this.checked ? 'text' : 'password';
});

/* ===========================
   DEFAULT ADMIN USER
=========================== */
if (!localStorage.getItem('admin')) {
  localStorage.setItem('admin', JSON.stringify({ username:'admin', password:'admin123', email:'admin@example.com' }));
}

/* ===========================
   LOG IN
=========================== */
function veriGirisYap() {
  const username = document.getElementById('giriskullanici').value.trim();
  const password = document.getElementById('girissifre').value;
  const err = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  err.style.display = 'none';
  btn.disabled = true;
  btn.classList.add('loading');

  if (!username || !password) {
    return showErr(err, btn, 'Username and password cannot be empty!', 'GİRİŞ YAP');
  }

  const storedRaw = localStorage.getItem(username);
  if (!storedRaw) return showErr(err, btn, 'User not found!', 'GİRİŞ YAP');

  const user = JSON.parse(storedRaw);
  if (user.password !== password) return showErr(err, btn, 'Incorrect password!', 'GİRİŞ YAP');

  sessionStorage.setItem('loggedInUser', username);
  showSuccess(err, 'Login successful! Redirecting...');
  setTimeout(() => {
    btn.disabled = false;
    btn.classList.remove('loading');
    loadAnasayfa();
  }, 1200);
}

/* ===========================
   REGISTER
=========================== */
function veriKayitOl() {
  const username = document.getElementById('kayitkullanici').value.trim();
  const password = document.getElementById('kayitsifre').value.trim();
  const email    = document.getElementById('kayitmail').value.trim();
  const err = document.getElementById('registerError');
  const btn = document.getElementById('registerBtn');

  err.style.display = 'none';
  btn.disabled = true;
  btn.classList.add('loading');

  if (!username || !password || !email) return showErr(err, btn, 'Please fill in all fields!', 'KAYIT OL');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return showErr(err, btn, 'Invalid email address!', 'KAYIT OL');

  if (password.length < 6) return showErr(err, btn, 'Password must be at least 6 characters!', 'KAYIT OL');

  if (localStorage.getItem(username)) return showErr(err, btn, 'Username is already taken!', 'KAYIT OL');

  localStorage.setItem(username, JSON.stringify({ username, password, email }));
  showSuccess(err, 'Registration successful! You can now log in.');
  setTimeout(() => {
    btn.disabled = false;
    btn.classList.remove('loading');
    showLogin();
  }, 1400);
}

function showErr(el, btn, msg, btnText) {
  el.textContent = msg;
  el.style.color = '#ff6b6b';
  el.style.display = 'block';
  btn.disabled = false;
  btn.classList.remove('loading');
}

function showSuccess(el, msg) {
  el.textContent = msg;
  el.style.color = '#4CAF50';
  el.style.display = 'block';
}

/* ===========================
   MAIN PAGE
=========================== */
let todos = [];
let currentUser = '';

function loadAnasayfa() {
  currentUser = sessionStorage.getItem('loggedInUser');
  if (!currentUser) { showPage('page-login'); return; }

  // Admin default tasks
  const key = `todos_${currentUser}`;
  if (currentUser === 'admin' && !localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify([
      { text: 'Perform system update', completed: false },
      { text: 'Check user passwords', completed: false },
      { text: 'Prepare presentation', completed: true }
    ]));
  }

  todos = JSON.parse(localStorage.getItem(key)) || [];
  document.getElementById('userWelcome').textContent = `Welcome, ${currentUser}!`;
  renderTodos();
  showPage('page-anasayfa');
}

function renderTodos() {
  const list = document.getElementById('list');
  list.innerHTML = '';
  todos.forEach((todo, i) => {
    const li = document.createElement('li');
    if (todo.completed) li.classList.add('completed');

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = todo.text;

    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group';

    const completeBtn = document.createElement('button');
    completeBtn.textContent = todo.completed ? 'Undo' : 'Complete';
    completeBtn.addEventListener('click', () => {
      todos[i].completed = !todos[i].completed;
      saveAndRender();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', () => {
      todos.splice(i, 1);
      saveAndRender();
    });

    btnGroup.append(completeBtn, deleteBtn);
    li.append(span, btnGroup);
    list.appendChild(li);
  });
}

function saveAndRender() {
  localStorage.setItem(`todos_${currentUser}`, JSON.stringify(todos));
  renderTodos();
}

function taskEkle(e) {
  e.preventDefault();
  const input = document.getElementById('input-text');
  const text = input.value.trim();
  if (text) {
    todos.push({ text, completed: false });
    input.value = '';
    saveAndRender();
  }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('loggedInUser');
  showPage('page-login');
  showLogin();
});

/* ===========================
   INIT
=========================== */
const loggedIn = sessionStorage.getItem('loggedInUser');
if (loggedIn) {
  loadAnasayfa();
} else {
  showPage('page-login');
}
