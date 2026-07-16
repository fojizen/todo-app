/* ═══════════════════════════════════════
   Todo App - Frontend
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Constants ── */
  var API = window.location.origin + '/api';

  /* ── State ── */
  var authToken = localStorage.getItem('authToken');
  var currentUser = null;
  var currentRole = null;
  var todos = [];
  var filter = { status: 'all', priority: 'all', category: 'all', search: '' };
  var sort = { field: 'order', dir: 'asc' };
  var editingId = null;
  var transitioning = false;

  /* ── i18n ── */
  var currentLang = localStorage.getItem('lang') || 'tr';

  var i18n = {
    tr: {
      'nav.features':'Ozellikler','nav.how':'Nasil Calisir','nav.tech':'Teknoloji',
      'nav.login':'Giris Yap','nav.register':'Kayit Ol','nav.home':'Anasayfa','nav.gotasks':'Gorevlerim',
      'hero.badge':'Gorevlerini Duzene Koyma Zamani',
      'hero.title':'Yapman gereken her sey,<br><span class="lp-gradient-text">tek bir yerde.</span>',
      'hero.sub':'Gorevlerini olustur, onceliklendir, kategorilere ayir ve tamamla.<br>Guvenli, hizli ve muhtesem gorunen bir todo deneyimi.',
      'hero.cta':'Hemen Basla','hero.more':'Daha Fazla',
      'hero.cta loggedIn':'Gorevlerime Git',
      'hero.stat.free':'Ucretsiz','hero.stat.access':'Erisim','hero.stat.encrypt':'Sifreleme',
      'mock.t1':'Proje dokumani hazirla','mock.t2':"API endpoint'lerini test et",'mock.t3':'Database migration yaz',
      'mock.t4':'Login sayfasini tasarla','mock.t5':'Birim testlerini yaz','mock.done':'3 tamamlandi','mock.upd':'2 guncel',
      'feat.tag':'Ozellikler','feat.title':'Gorev yonetimini<br><span class="lp-gradient-text">bir ust seviyeye tasi.</span>',
      'feat.sub':'Gucunu ve basitligini bir arada sunan araclar.',
      'feat.1.title':'Hizli Gorev Ekleme','feat.1.desc':'Bir tikla gorev olustur. Oncelik, tarih, kategori ve etiket ekleyerek detaylandir.',
      'feat.2.title':'Akilci Filtreleme','feat.2.desc':'Duruma gore, oncelige gore, kategoriye gore veya serbest metin ile ara.',
      'feat.3.title':'Surukle & Birak','feat.3.desc':'Gorevleri istedigin siraya tasi. Siparisi kendin belirle.',
      'feat.4.title':'Guvenlik','feat.4.desc':'bcrypt sifreleme, JWT token, brute force korumasi ve rate limiting.',
      'feat.5.title':'Tema Degisimi','feat.5.desc':'Koyu, acik ve sistem temasi. Goz yormayan, estetik renk paletleri.',
      'how.tag':'Nasil Calisir','how.title':'Uc adimda<br><span class="lp-gradient-text">basla.</span>',
      'how.1.title':'Hesap Olustur','how.1.desc':'Kullanici adin, e-posta ve sifren ile hizlica kayit ol.',
      'how.2.title':'Gorevlerini Ekle','how.2.desc':'Oncelik, tarih, kategori ve etiket secenekleriyle gorevlerini detaylandir.',
      'how.3.title':'Tamamla ve Takip Et','how.3.desc':'Gorevlerini isaretle, istatistiklerini gor, surekli kendini gelistir.',
      'tech.tag':'Teknoloji','tech.title':'Modern,<br><span class="lp-gradient-text">hafif, guclu.</span>',
      'tech.sub':'Agir framework\'ler yok. Sadece iyi yazilmis, anlasilabilir kod.',
      'tech.1':'Framework yok, saf performans','tech.2':'Hafif, hizli backend','tech.3':'Guvenli ve hizli veritabani','tech.4':'Guvenli kimlik dogrulama',
      'cta.title':'Gorevlerine basla,<br><span class="lp-gradient-text">bugun.</span>',
      'cta.sub':'Ucretsiz kayit ol, hemen gorevlerini yonetmeye basla.','cta.btn':'Hemen Kayit Ol',
      'cta.title loggedIn':'Gorevlerini yonet,<br><span class="lp-gradient-text">hemen basla.</span>',
      'cta.sub loggedIn':'Gorevlerini incele, yeni Gorevler ekle ve tamamlananlari takip et.',
      'cta.btn loggedIn':'Gorevlerime Git',
      'footer.built':'Vanilla JS ile yapildi',
      'footer.contact':'Iletisim',
      'footer.copyright':'&copy; 2026 fojizen. Tum haklari saklidir.',
      'verify.title':'E-postani Dogrula','verify.desc':'Hesabini aktif etmek icin e-posta kutunu kontrol et. Dogrulama linkine tikla.',
      'verify.close':'Tamam','verify.resend':'Tekrar Gonder',
      'toast.verificationSent':'Dogrulama epostasi gonderildi',
      'auth.back':'Anasayfa','auth.subtitle':'Gorevlerini yonet, organize ol',
      'auth.tab.login':'Giris Yap','auth.tab.register':'Kayit Ol',
      'auth.login.user':'Kullanici Adi','auth.login.user.ph':'Kullanici adiniz',
      'auth.login.pw':'Sifre','auth.login.pw.ph':'Sifreniz','auth.login.pw.aria':'Sifreyi goster/gizle',
      'auth.login.btn':'Giris Yap',
      'err.emailTaken':'Bu e-posta adresi zaten kayitli',
      'auth.reg.user':'Kullanici Adi','auth.reg.user.ph':'Kullanici adi (3-20 karakter)',
      'auth.reg.email':'E-posta','auth.reg.pw':'Sifre','auth.reg.pw.ph':'En az 6 karakter',
      'auth.reg.terms':'Kullanim sartlarini kabul ediyorum','auth.reg.btn':'Kayit Ol',
      'main.title':'Gorevlerim','main.logout':'Cikis','main.admin':'Admin',
      'main.task.ph':'Yeni gorev ekle... (Ctrl+K)','main.task.add':'Ekle',
      'main.task.prio':'Oncelik','main.task.date':'Bitis Tarihi','main.task.cat':'Kategori',
      'main.task.tags':'Etiketler','main.task.tags.ph':'etiket1, etiket2',
      'main.task.advanced':'Gelismis secenekler','main.task.advanced.hide':'Gizle',
      'filter.search.ph':'Ara...','filter.allCat':'Tum Kategoriler',
      'empty.title':'Henuz gorev yok','empty.desc':'Yukaridan yeni bir gorev ekleyerek basla',
      'stats.total':'Toplam','stats.active':'Aktif','stats.done':'Tamam','stats.late':'Gecikmis','stats.clear':'Tamamlananlari Sil',
      'admin.title':'Kullanici Yonetimi','admin.back':'Geri',
      'admin.stat.users':'Toplam Kullanici','admin.stat.tasks':'Toplam Gorev',
      'admin.th.user':'Kullanici','admin.th.email':'E-posta','admin.th.role':'Rol',
      'admin.th.status':'Durum','admin.th.lastLogin':'Son Giris','admin.th.tasks':'Gorev','admin.th.actions':'Islemler',
      'adminEdit.title':'Kullanici Duzenle','adminEdit.id':'ID','adminEdit.created':'Kayit Tarihi',
      'adminEdit.lastLogin':'Son Giris','adminEdit.taskCount':'Gorev Sayisi',
      'adminEdit.user':'Kullanici Adi','adminEdit.email':'E-posta',
      'adminEdit.pw':'Yeni Sifre (bos birakilirsa degismez)','adminEdit.pw.ph':'En az 6 karakter',
      'adminEdit.role':'Rol','adminEdit.status':'Durum','adminEdit.cancel':'Iptal','adminEdit.save':'Kaydet',
      'edit.title':'Gorev Duzenle','edit.text':'Gorev','edit.prio':'Oncelik','edit.date':'Bitis',
      'edit.cat':'Kategori','edit.tags':'Etiketler','edit.done':'Tamamlandi','edit.delete':'Sil','edit.cancel':'Iptal','edit.save':'Kaydet','modal.close':'Kapat',
      'prio.high':'Yuksek','prio.medium':'Orta','prio.low':'Dusuk',
      'welcome.prefix':'Hos geldin,',
      'toast.loginOk':'Giris basarili!','toast.registerOk':'Kayit basarili!','toast.logout':'Cikis yapildi',
      'toast.taskAdd':'Gorev eklendi','toast.taskEdit':'Gorev guncellendi','toast.taskDel':'Gorev silindi',
      'toast.updated':'Guncellendi','toast.userDel':'Kullanici silindi','toast.userEdit':'Kullanici guncellendi',
      'toast.banRemoved':'Ban kaldirildi','toast.banned':'Kullanici banlandi',
      'toast.noCompleted':'Tamamlanan gorev yok','toast.clearDone':' tamamlanan gorev silindi',
      'toast.noTask':'Gorev eklenemedi','toast.error':'Bir hata olustu',
      'toast.theme':'Tema','theme.toggle':'Tema degistir','theme.system':'Sistem','theme.dark':'Koyu','theme.light':'Acik',
      'confirm.deleteTask':'Bu gorevi silmek istediginize emin misiniz?',
      'confirm.clearDone':' tamamlanan gorev silinecek. Emin misiniz?',
      'confirm.banUser':' banlansin mi?','confirm.unbanUser':' ban kaldirilsin mi?',
      'confirm.deleteUser':' silinsin mi? Tum gorevleri de silinecek.',
      'err.usernamePassword':'Kullanici adi ve sifre gerekli','err.loginFailed':'Giris basarisiz',
      'err.fillAll':'Tum alanlari doldurun','err.usernameMin':'Kullanici adi en az 3 karakter',
      'err.passwordMin':'Sifre en az 6 karakter','err.invalidEmail':'Gecersiz e-posta',
      'err.acceptTerms':'Sartlari kabul edin','err.usernameTaken':' zaten alinmis. Baska bir secin.',
      'err.available':' musait','err.taken':' zaten alinmis','err.checking':'Kontrol ediliyor...',
      'admin.badge.admin':'Admin','admin.badge.user':'User','admin.status.active':'Aktif','admin.status.banned':'Banli',
      'admin.btn.edit':'Duzenle','admin.btn.unban':'Ban kaldir','admin.btn.ban':'Banla','admin.btn.del':'Sil',
      'admin.usersLoadErr':'Kullanicialar yuklenemedi'
    },
    en: {
      'nav.features':'Features','nav.how':'How It Works','nav.tech':'Tech',
      'nav.login':'Login','nav.register':'Register','nav.home':'Home','nav.gotasks':'My Tasks',
      'hero.badge':'Time to Organize Your Tasks',
      'hero.title':'Everything you need,<br><span class="lp-gradient-text">in one place.</span>',
      'hero.sub':'Create, prioritize, categorize and complete tasks.<br>A secure, fast and beautiful todo experience.',
      'hero.cta':'Get Started','hero.more':'Learn More',
      'hero.cta loggedIn':'My Tasks',
      'hero.stat.free':'Free','hero.stat.access':'Access','hero.stat.encrypt':'Encryption',
      'mock.t1':'Prepare project document','mock.t2':'Test API endpoints','mock.t3':'Write database migration',
      'mock.t4':'Design login page','mock.t5':'Write unit tests','mock.done':'3 completed','mock.upd':'2 updated',
      'feat.tag':'Features','feat.title':'Take task management<br><span class="lp-gradient-text">to the next level.</span>',
      'feat.sub':'Tools that combine power and simplicity.',
      'feat.1.title':'Quick Task Creation','feat.1.desc':'Create tasks with one click. Add priority, date, category and tags.',
      'feat.2.title':'Smart Filtering','feat.2.desc':'Filter by status, priority, category or free text search.',
      'feat.3.title':'Drag & Drop','feat.3.desc':'Move tasks to your desired order. You decide.',
      'feat.4.title':'Security','feat.4.desc':'bcrypt encryption, JWT tokens, brute force protection and rate limiting.',
      'feat.5.title':'Theme Switcher','feat.5.desc':'Dark, light and system theme. Easy on the eyes, aesthetic palettes.',
      'how.tag':'How It Works','how.title':'Get started<br><span class="lp-gradient-text">in three steps.</span>',
      'how.1.title':'Create Account','how.1.desc':'Sign up quickly with your username, email and password.',
      'how.2.title':'Add Your Tasks','how.2.desc':'Detail your tasks with priority, date, category and tag options.',
      'how.3.title':'Complete & Track','how.3.desc':'Mark tasks, view stats, keep improving.',
      'tech.tag':'Technology','tech.title':'Modern,<br><span class="lp-gradient-text">lightweight, powerful.</span>',
      'tech.sub':'No heavy frameworks. Just well-written, understandable code.',
      'tech.1':'No framework, pure performance','tech.2':'Lightweight, fast backend','tech.3':'Fast and secure database','tech.4':'Secure authentication',
      'cta.title':'Start your tasks,<br><span class="lp-gradient-text">today.</span>',
      'cta.sub':'Sign up for free, start managing your tasks now.','cta.btn':'Sign Up Now',
      'cta.title loggedIn':'Manage your tasks,<br><span class="lp-gradient-text">get started.</span>',
      'cta.sub loggedIn':'Review your tasks, add new ones and track what you have completed.',
      'cta.btn loggedIn':'Go to My Tasks',
      'footer.built':'Built with Vanilla JS',
      'footer.contact':'Contact',
      'footer.copyright':'&copy; 2026 fojizen. All rights reserved.',
      'verify.title':'Verify Your Email','verify.desc':'Check your inbox and click the verification link to activate your account.',
      'verify.close':'OK','verify.resend':'Resend',
      'toast.verificationSent':'Verification email sent',
      'auth.back':'Home','auth.subtitle':'Manage your tasks, stay organized',
      'auth.tab.login':'Login','auth.tab.register':'Register',
      'auth.login.user':'Username','auth.login.user.ph':'Your username',
      'auth.login.pw':'Password','auth.login.pw.ph':'Your password','auth.login.pw.aria':'Show/hide password',
      'auth.login.btn':'Login',
      'err.emailTaken':'This email is already registered',
      'auth.reg.user':'Username','auth.reg.user.ph':'Username (3-20 characters)',
      'auth.reg.email':'Email','auth.reg.pw':'Password','auth.reg.pw.ph':'At least 6 characters',
      'auth.reg.terms':'I accept the terms of service','auth.reg.btn':'Register',
      'main.title':'My Tasks','main.logout':'Logout','main.admin':'Admin',
      'main.task.ph':'Add new task... (Ctrl+K)','main.task.add':'Add',
      'main.task.prio':'Priority','main.task.date':'Due Date','main.task.cat':'Category',
      'main.task.tags':'Tags','main.task.tags.ph':'tag1, tag2',
      'main.task.advanced':'Advanced options','main.task.advanced.hide':'Hide',
      'filter.search.ph':'Search...','filter.allCat':'All Categories',
      'empty.title':'No tasks yet','empty.desc':'Start by adding a new task above',
      'stats.total':'Total','stats.active':'Active','stats.done':'Done','stats.late':'Overdue','stats.clear':'Clear Completed',
      'admin.title':'User Management','admin.back':'Back',
      'admin.stat.users':'Total Users','admin.stat.tasks':'Total Tasks',
      'admin.th.user':'User','admin.th.email':'Email','admin.th.role':'Role',
      'admin.th.status':'Status','admin.th.lastLogin':'Last Login','admin.th.tasks':'Tasks','admin.th.actions':'Actions',
      'adminEdit.title':'Edit User','adminEdit.id':'ID','adminEdit.created':'Created',
      'adminEdit.lastLogin':'Last Login','adminEdit.taskCount':'Task Count',
      'adminEdit.user':'Username','adminEdit.email':'Email',
      'adminEdit.pw':'New Password (leave blank to keep)','adminEdit.pw.ph':'At least 6 characters',
      'adminEdit.role':'Role','adminEdit.status':'Status','adminEdit.cancel':'Cancel','adminEdit.save':'Save',
      'edit.title':'Edit Task','edit.text':'Task','edit.prio':'Priority','edit.date':'Due',
      'edit.cat':'Category','edit.tags':'Tags','edit.done':'Completed','edit.delete':'Delete','edit.cancel':'Cancel','edit.save':'Save','modal.close':'Close',
      'prio.high':'High','prio.medium':'Medium','prio.low':'Low',
      'welcome.prefix':'Welcome,',
      'toast.loginOk':'Login successful!','toast.registerOk':'Registration successful!','toast.logout':'Logged out',
      'toast.taskAdd':'Task added','toast.taskEdit':'Task updated','toast.taskDel':'Task deleted',
      'toast.updated':'Updated','toast.userDel':'User deleted','toast.userEdit':'User updated',
      'toast.banRemoved':'Ban removed','toast.banned':'User banned',
      'toast.noCompleted':'No completed tasks','toast.clearDone':' completed tasks deleted',
      'toast.noTask':'Could not add task','toast.error':'An error occurred',
      'toast.theme':'Theme','theme.toggle':'Switch theme','theme.system':'System','theme.dark':'Dark','theme.light':'Light',
      'confirm.deleteTask':'Are you sure you want to delete this task?',
      'confirm.clearDone':' completed tasks will be deleted. Are you sure?',
      'confirm.banUser':' will be banned. Continue?','confirm.unbanUser':' ban will be removed. Continue?',
      'confirm.deleteUser':' will be deleted. All tasks will also be deleted.',
      'err.usernamePassword':'Username and password are required','err.loginFailed':'Login failed',
      'err.fillAll':'Please fill all fields','err.usernameMin':'Username must be at least 3 characters',
      'err.passwordMin':'Password must be at least 6 characters','err.invalidEmail':'Invalid email',
      'err.acceptTerms':'Please accept the terms','err.usernameTaken':' is already taken. Choose another.',
      'err.available':' is available','err.taken':' is already taken','err.checking':'Checking...',
      'admin.badge.admin':'Admin','admin.badge.user':'User','admin.status.active':'Active','admin.status.banned':'Banned',
      'admin.btn.edit':'Edit','admin.btn.unban':'Unban','admin.btn.ban':'Ban','admin.btn.del':'Delete',
      'admin.usersLoadErr':'Could not load users'
    }
  };

  var i18nOptions = {
    'filter.status':[{value:'all',tr:'Tumu',en:'All'},{value:'active',tr:'Aktif',en:'Active'},{value:'completed',tr:'Tamamlanan',en:'Completed'}],
    'filter.priority':[{value:'all',tr:'Tum Oncelikler',en:'All Priorities'},{value:'high',tr:'Yuksek',en:'High'},{value:'medium',tr:'Orta',en:'Medium'},{value:'low',tr:'Dusuk',en:'Low'}],
    'task.priority':[{value:'low',tr:'Dusuk',en:'Low'},{value:'medium',tr:'Orta',en:'Medium'},{value:'high',tr:'Yuksek',en:'High'}],
    'task.category':[{value:'',tr:'Yok',en:'None'},{value:'Is',tr:'Is',en:'Work'},{value:'Kisisel',tr:'Kisisel',en:'Personal'},{value:'Alisveris',tr:'Alisveris',en:'Shopping'},{value:'Saglik',tr:'Saglik',en:'Health'},{value:'Egitim',tr:'Egitim',en:'Education'}],
    'edit.priority':[{value:'low',tr:'Dusuk',en:'Low'},{value:'medium',tr:'Orta',en:'Medium'},{value:'high',tr:'Yuksek',en:'High'}],
    'edit.category':[{value:'',tr:'Yok',en:'None'},{value:'Is',tr:'Is',en:'Work'},{value:'Kisisel',tr:'Kisisel',en:'Personal'},{value:'Alisveris',tr:'Alisveris',en:'Shopping'},{value:'Saglik',tr:'Saglik',en:'Health'},{value:'Egitim',tr:'Egitim',en:'Education'}],
    'sort.select':[{value:'order-asc',tr:'Siralama',en:'Sort'},{value:'createdAt-desc',tr:'En Yeni',en:'Newest'},{value:'createdAt-asc',tr:'En Eski',en:'Oldest'},{value:'priority-desc',tr:'Oncelik',en:'Priority'},{value:'dueDate-asc',tr:'Bitis Tarihi',en:'Due Date'}],
    'adminEdit.role':[{value:'user',tr:'User',en:'User'},{value:'admin',tr:'Admin',en:'Admin'}],
    'adminEdit.status':[{value:'0',tr:'Aktif',en:'Active'},{value:'1',tr:'Banli',en:'Banned'}]
  };

  var HTML_KEYS = {'hero.title':1,'hero.sub':1,'feat.title':1,'how.title':1,'tech.title':1,'cta.title':1,'footer.contact':1,'footer.copyright':1,'verify.title':1,'verify.desc':1,'verify.close':1};

  function t(key) {
    return (i18n[currentLang] && i18n[currentLang][key]) || (i18n.tr && i18n.tr[key]) || key;
  }

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-lang-key]').forEach(function (el) {
      var key = el.getAttribute('data-lang-key');
      var val = t(key);
      if (HTML_KEYS[key]) el.innerHTML = val;
      else el.textContent = val;
    });
    document.querySelectorAll('[data-lang-placeholder]').forEach(function (el) {
      el.placeholder = t(el.getAttribute('data-lang-placeholder'));
    });
    document.querySelectorAll('[data-lang-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-lang-aria')));
    });
    document.querySelectorAll('[data-lang-options]').forEach(function (sel) {
      var key = sel.getAttribute('data-lang-options');
      var opts = i18nOptions[key];
      if (!opts) return;
      var curVal = sel.value;
      sel.innerHTML = '';
      opts.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o[lang];
        sel.appendChild(opt);
      });
      if (opts.some(function (o) { return o.value === curVal; })) sel.value = curVal;
    });

    document.title = lang === 'tr' ? 'Todo App - Gorev Yonetimi | fojizen' : 'Todo App - Task Management | fojizen';
    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      btn.textContent = lang === 'tr' ? 'EN' : 'TR';
    });

    if (todos.length) {
      render();
    }
    var uw = document.getElementById('userWelcome');
    if (uw && currentUser) uw.textContent = t('welcome.prefix') + ' ' + currentUser + '!';
  }

  function toggleLanguage() { setLanguage(currentLang === 'tr' ? 'en' : 'tr'); }

  /* ── Helpers ── */
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function isOverdue(d) {
    if (!d) return false;
    var today = new Date(); today.setHours(0,0,0,0);
    var dt = new Date(d); dt.setHours(0,0,0,0);
    return dt < today;
  }

  function isDueSoon(d) {
    if (!d) return false;
    var today = new Date(); today.setHours(0,0,0,0);
    var dt = new Date(d); dt.setHours(0,0,0,0);
    var diff = dt.getTime() - today.getTime();
    return diff >= 0 && diff <= 3 * 86400000;
  }

  function fmtDate(ds) {
    if (!ds) return '';
    var d = new Date(ds);
    return String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear();
  }

  /* ── API ── */
  var _pendingTasks = {};
  function api(method, path, body) {
    var key = method + ':' + path;
    if (body && (method === 'POST')) {
      if (_pendingTasks[key]) return Promise.reject(new Error('Islem devam ediyor'));
      _pendingTasks[key] = true;
      setTimeout(function () { delete _pendingTasks[key]; }, 1000);
    }
    var opts = { method: method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
    if (authToken) opts.headers['Authorization'] = 'Bearer ' + authToken;
    if (body) opts.body = JSON.stringify(body);
    return fetch(API + path, opts).then(function (res) {
      var ct = res.headers.get('content-type') || '';
      if (ct.indexOf('application/json') === -1) {
        if (!res.ok) throw new Error('Sunucu hatasi (' + res.status + ')');
        return {};
      }
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Istek basarisiz');
        return data;
      });
    }).catch(function (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new Error('Internet baglantisi yok');
      }
      throw err;
    });
  }

  /* ── Theme ── */
  var themeMode = localStorage.getItem('themeMode') || 'dark';

  function applyTheme() {
    var resolved = themeMode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : themeMode;
    document.documentElement.setAttribute('data-theme', resolved);
  }

  function cycleTheme() {
    var modes = ['dark', 'light', 'system'];
    themeMode = modes[(modes.indexOf(themeMode) + 1) % 3];
    localStorage.setItem('themeMode', themeMode);
    applyTheme();
    showToast(t('toast.theme') + ': ' + t('theme.' + themeMode), 'info');
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  applyTheme();

  /* ── Toast ── */
  function showToast(msg, type) {
    var c = document.getElementById('toastContainer');
    if (!c) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.textContent = msg;
    c.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    var dur = window.matchMedia('(hover:none)').matches ? 4000 : 3000;
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 300);
    }, dur);
  }

  /* ── Particles ── */
  var canvas = document.getElementById('particleCanvas');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var particles = [];
  var animId = null;

  function initParticles() {
    if (!canvas || !ctx) return;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    var isMob = 'ontouchstart' in window || window.matchMedia('(hover:none)').matches;
    var count = Math.min(isMob ? 25 : 70, Math.floor(window.innerWidth / 14));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
        r: Math.random() * 1.5 + 0.5, sp: Math.random() * 0.35 + 0.05,
        op: Math.random() * 0.4 + 0.1, hue: Math.random() * 60 + 250
      });
    }
    if (!animId) animate();
  }

  function animate() {
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { animId = null; return; }
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach(function (p) {
      p.y -= p.sp;
      if (p.y < -p.r) { p.y = window.innerHeight + p.r; p.x = Math.random() * window.innerWidth; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + p.hue + ',60%,65%,' + p.op + ')';
      ctx.fill();
    });
    animId = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', function () {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    var active = document.querySelector('.page.active');
    if (active && (active.id === 'mainPage' || active.id === 'landingPage')) initParticles();
  });

  /* ── Page Navigation ── */

  function resetHamburgerNav() {
    var links = document.querySelector('.lp-nav-links');
    var actions = document.querySelector('.lp-nav-actions');
    if (links) { links.removeAttribute('style'); }
    if (actions) { actions.removeAttribute('style'); }
  }

  function showLoader() {
    var existing = document.getElementById('loader');
    if (existing) return;
    var el = document.createElement('div');
    el.id = 'loader';
    el.className = 'loader-screen';
    el.innerHTML = '<div class="loader-content"><div class="loader-ring"><div class="loader-ring-glow"></div><div class="loader-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div></div><div class="loader-dots"><span></span><span></span><span></span></div></div>';
    document.body.appendChild(el);
  }

  function hideLoader() {
    var loader = document.getElementById('loader');
    if (loader && !loader.classList.contains('fade-out')) {
      loader.classList.add('fade-out');
      setTimeout(function () { if (loader.parentNode) loader.remove(); }, 600);
    }
  }

  function navigateTo(name) {
    var current = document.querySelector('.page.active');
    var next = document.getElementById(name);
    if (current === next) return;
    showLoader();
    setTimeout(function () { showPage(name); }, 400);
  }

  function showPage(name, noAnim) {
    transitioning = false;
    var next = document.getElementById(name);
    if (!next) return;
    document.documentElement.classList.remove('loading');
    var loader = document.getElementById('loader');
    if (loader && !loader.classList.contains('fade-out')) {
      loader.classList.add('fade-out');
      setTimeout(function () { loader.remove(); }, 600);
    }
    var current = document.querySelector('.page.active');

    if (current && current !== next && !noAnim) {
      transitioning = true;
      current.classList.add('page-transition-out');
      setTimeout(function () {
        document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active', 'page-transition-out'); });
        next.classList.add('active');
        setTimeout(function () { transitioning = false; }, 50);
        if (name === 'landingPage') resetHamburgerNav();
        if ((name === 'mainPage' || name === 'landingPage') && !animId) initParticles();
        else if (name !== 'mainPage' && name !== 'landingPage' && animId) { cancelAnimationFrame(animId); animId = null; }
        window.scrollTo(0, 0);
      }, 350);
    } else {
      transitioning = false;
      document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active', 'page-transition-out'); });
      next.classList.add('active');
      if (name === 'landingPage') resetHamburgerNav();
      if ((name === 'mainPage' || name === 'landingPage') && !animId) initParticles();
      else if (name !== 'mainPage' && name !== 'landingPage' && animId) { cancelAnimationFrame(animId); animId = null; }
      window.scrollTo(0, 0);
    }
    try { localStorage.setItem('lastPage', name); } catch (e) {}
  }

  /* ── Auth State ── */
  function updateLandingNav() {
    var authBtns = document.getElementById('lpAuthBtns');
    var userMenu = document.getElementById('lpUserMenu');
    var usernameEl = document.getElementById('lpUsername');
    var ctaTitle = document.getElementById('ctaTitle');
    var ctaSub = document.getElementById('ctaSub');
    var ctaBtnText = document.getElementById('ctaBtnText');
    var heroCtaText = document.getElementById('heroCtaText');
    if (currentUser) {
      if (authBtns) authBtns.style.display = 'none';
      if (userMenu) { userMenu.style.display = ''; if (usernameEl) usernameEl.textContent = currentUser; }
      if (ctaTitle) ctaTitle.innerHTML = t('cta.title loggedIn');
      if (ctaSub) ctaSub.textContent = t('cta.sub loggedIn');
      if (ctaBtnText) { ctaBtnText.textContent = t('cta.btn loggedIn'); ctaBtnText.removeAttribute('data-lang-key'); }
      if (heroCtaText) { heroCtaText.textContent = t('hero.cta loggedIn'); heroCtaText.removeAttribute('data-lang-key'); }
    } else {
      if (authBtns) authBtns.style.display = '';
      if (userMenu) userMenu.style.display = 'none';
      if (ctaTitle) { ctaTitle.innerHTML = t('cta.title'); ctaTitle.setAttribute('data-lang-key', 'cta.title'); }
      if (ctaSub) { ctaSub.textContent = t('cta.sub'); ctaSub.setAttribute('data-lang-key', 'cta.sub'); }
      if (ctaBtnText) { ctaBtnText.textContent = t('cta.btn'); ctaBtnText.setAttribute('data-lang-key', 'cta.btn'); }
      if (heroCtaText) { heroCtaText.textContent = t('hero.cta'); heroCtaText.setAttribute('data-lang-key', 'hero.cta'); }
    }
  }

  function loadMain() {
    if (!currentUser) { showPage('loginPage', true); return; }
    var welcomeEl = document.getElementById('userWelcome');
    if (welcomeEl) welcomeEl.textContent = t('welcome.prefix') + ' ' + currentUser + '!';
    showAdminBtn();
    showLoader();
    loadTasks().then(function () {
      showPage('mainPage', true);
      render();
    }).catch(function (err) {
      hideLoader();
      if (err.message === 'Internet baglantisi yok') {
        showToast('Internet baglantisi yok', 'error');
        return;
      }
      if (err.message === 'Token gerekli' || err.message === 'Gecersiz token' || err.message === 'Kullanici bulunamadi') {
        authToken = null;
        localStorage.removeItem('authToken');
        currentUser = null;
        currentRole = null;
        showPage('loginPage', true);
      } else {
        showToast(err.message || 'Bir hata olustu', 'error');
      }
    });
  }

  function loadTasks() {
    return api('GET', '/tasks').then(function (data) { todos = data; });
  }

  function showAdminBtn() {
    var btn = document.getElementById('adminBtn');
    if (btn) btn.style.display = currentRole === 'admin' ? '' : 'none';
  }

  /* ── Tab Switch ── */
  function switchTab(tab) {
    var lt = document.getElementById('loginTab');
    var rt = document.getElementById('registerTab');
    var lf = document.getElementById('loginForm');
    var rf = document.getElementById('registerForm');
    if (tab === 'login') {
      lt.classList.add('active'); rt.classList.remove('active');
    } else {
      rt.classList.add('active'); lt.classList.remove('active');
    }
    var target = tab === 'login' ? lf : rf;
    var other = tab === 'login' ? rf : lf;
    other.classList.remove('active');
    other.style.display = 'none';
    target.classList.remove('active');
    void target.offsetWidth;
    target.style.display = '';
    target.classList.add('active');
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
    var st = document.getElementById('regUsernameStatus');
    if (st) { st.textContent = ''; st.className = 'form-hint'; }
  }

  function setBtnLoading(btn, loading) {
    if (loading) {
      btn.disabled = true;
      btn.dataset.txt = btn.textContent;
      btn.innerHTML = '<span class="btn-spinner"></span>';
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.txt || btn.textContent;
    }
  }

  function setBtnSuccess(btn, cb) {
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-check">&#10003;</span>';
    btn.classList.add('btn-success');
    setTimeout(function () {
      btn.classList.remove('btn-success');
      btn.disabled = false;
      btn.textContent = btn.dataset.txt || btn.textContent;
      if (cb) cb();
    }, 700);
  }

  /* ══════════════════════════════════════
     EVENT LISTENERS
     ══════════════════════════════════════ */

  /* Language toggle */
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('lang-toggle')) toggleLanguage();
  });

  /* Landing nav user dropdown */
  var lpUserBtn = document.getElementById('lpUserBtn');
  var lpUserMenu = document.getElementById('lpUserMenu');
  if (lpUserBtn && lpUserMenu) {
    lpUserBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      lpUserMenu.classList.toggle('open');
    });
    document.addEventListener('click', function () { lpUserMenu.classList.remove('open'); });
  }

  var lpGoApp = document.getElementById('lpGoApp');
  if (lpGoApp) lpGoApp.addEventListener('click', function () { if (currentUser) loadMain(); });

  var lpLogout = document.getElementById('lpLogout');
  if (lpLogout) lpLogout.addEventListener('click', function () {
    currentUser = null; currentRole = null; authToken = null;
    localStorage.removeItem('authToken');
    todos = [];
    updateLandingNav();
    navigateTo('landingPage');
    setTimeout(function () { initLanding(); }, 450);
    showToast(t('toast.logout'), 'info');
  });

  /* Auth back button */
  var authBackBtn = document.getElementById('authBackBtn');
  if (authBackBtn) authBackBtn.addEventListener('click', function (e) {
    e.preventDefault();
    navigateTo('landingPage');
    setTimeout(initLanding, 450);
  });

  /* Login/Register tabs */
  var loginTab = document.getElementById('loginTab');
  var registerTab = document.getElementById('registerTab');
  if (loginTab) loginTab.addEventListener('click', function () { switchTab('login'); });
  if (registerTab) registerTab.addEventListener('click', function () { switchTab('register'); });

  /* Password toggle */
  document.querySelectorAll('.toggle-pw').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var inp = btn.previousElementSibling;
      if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
    });
  });

  /* Username availability check */
  var usernameTimer = null;
  var regUsernameEl = document.getElementById('regUsername');
  if (regUsernameEl) regUsernameEl.addEventListener('input', function () {
    var val = this.value.trim().toLowerCase();
    var statusEl = document.getElementById('regUsernameStatus');
    clearTimeout(usernameTimer);
    if (val.length < 3) { statusEl.textContent = ''; statusEl.className = 'form-hint'; return; }
    statusEl.textContent = t('err.checking');
    statusEl.className = 'form-hint checking';
    usernameTimer = setTimeout(function () {
      api('GET', '/check-username/' + encodeURIComponent(val)).then(function (res) {
        statusEl.textContent = '"' + val + '"' + t(res.available ? 'err.available' : 'err.taken');
        statusEl.className = 'form-hint ' + (res.available ? 'success' : 'error');
      }).catch(function () { statusEl.textContent = ''; statusEl.className = 'form-hint'; });
    }, 500);
  });

  /* Login form */
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var username = document.getElementById('loginUsername').value.trim().toLowerCase();
    var password = document.getElementById('loginPassword').value;
    var errEl = document.getElementById('loginError');
    var btn = document.getElementById('loginBtn');
    errEl.textContent = '';
    if (!username || !password) { errEl.textContent = t('err.usernamePassword'); return; }
    setBtnLoading(btn, true);
    api('POST', '/login', { username: username, password: password }).then(function (data) {
      authToken = data.token; currentUser = data.username; currentRole = data.role || 'user';
      localStorage.setItem('authToken', data.token);
      updateLandingNav();
      showToast(t('toast.loginOk'), 'success');
      setBtnSuccess(btn, function () { loadMain(); });
    }).catch(function (err) {
      if (err.message && err.message.indexOf('dogrulanmamis') !== -1) {
        lastRegisteredUsername = username;
        var emailDisplay = document.getElementById('verifyEmailDisplay');
        if (emailDisplay) emailDisplay.textContent = username;
        var vm = document.getElementById('verifyModal');
        if (vm) vm.showModal();
      } else {
        errEl.textContent = err.message || t('err.loginFailed');
      }
      setBtnLoading(btn, false);
    });
  });

  /* Register form */
  document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var username = document.getElementById('regUsername').value.trim().toLowerCase();
    var email = document.getElementById('regEmail').value.trim();
    var password = document.getElementById('regPassword').value;
    var terms = document.getElementById('termsCheck').checked;
    var errEl = document.getElementById('registerError');
    var btn = document.getElementById('registerBtn');
    errEl.textContent = '';
    if (!username || !email || !password) { errEl.textContent = t('err.fillAll'); return; }
    if (username.length < 3) { errEl.textContent = t('err.usernameMin'); return; }
    if (password.length < 6) { errEl.textContent = t('err.passwordMin'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = t('err.invalidEmail'); return; }
    if (!terms) { errEl.textContent = t('err.acceptTerms'); return; }
    setBtnLoading(btn, true);
      api('GET', '/check-username/' + encodeURIComponent(username)).then(function (check) {
      if (!check.available) {
        var st = document.getElementById('regUsernameStatus');
        st.textContent = '"' + username + '"' + t('err.usernameTaken');
        st.className = 'form-hint error';
        setBtnLoading(btn, false);
        return Promise.reject(new Error('taken'));
      }
      return api('POST', '/register', { username: username, email: email, password: password, lang: currentLang });
    }).then(function (data) {
      if (!data || !data.ok) return;
      lastRegisteredUsername = data.username || username;
      setBtnSuccess(btn, function () {
        var verifyModal = document.getElementById('verifyModal');
        var emailDisplay = document.getElementById('verifyEmailDisplay');
        if (emailDisplay) emailDisplay.textContent = email;
        if (verifyModal) verifyModal.showModal();
      });
    }).catch(function (err) {
      if (err.message !== 'taken') {
        var msg = err.message || t('toast.error');
        if (msg === 'Bu e-posta adresi zaten kayitli') msg = t('err.emailTaken');
        errEl.textContent = msg;
      }
      setBtnLoading(btn, false);
    });
  });

  /* Verify modal */
  var verifyModal = document.getElementById('verifyModal');
  var resendBtn = document.getElementById('resendBtn');
  var lastRegisteredUsername = '';
  if (verifyModal) verifyModal.addEventListener('click', function (e) { if (e.target === this) this.close(); });
  if (resendBtn) resendBtn.addEventListener('click', function () {
    if (!lastRegisteredUsername) return;
    resendBtn.disabled = true;
    resendBtn.textContent = '...';
    api('POST', '/resend-verification', { username: lastRegisteredUsername, lang: currentLang }).then(function () {
      showToast(t('toast.verificationSent'), 'success');
    }).catch(function (err) {
      showToast(err.message || t('toast.error'), 'error');
    }).finally(function () {
      resendBtn.disabled = false;
      resendBtn.textContent = t('verify.resend');
    });
  });

  /* Home button */
  var homeBtnEl = document.getElementById('homeBtn');
  if (homeBtnEl) homeBtnEl.addEventListener('click', function () {
    updateLandingNav();
    navigateTo('landingPage');
    setTimeout(initLanding, 450);
  });

  /* Logout button */
  var logoutBtnEl = document.getElementById('logoutBtn');
  if (logoutBtnEl) logoutBtnEl.addEventListener('click', function () {
    api('POST', '/logout').catch(function () {});
    currentUser = null; currentRole = null; authToken = null;
    localStorage.removeItem('authToken');
    todos = [];
    updateLandingNav();
    navigateTo('landingPage');
    setTimeout(initLanding, 450);
    showToast(t('toast.logout'), 'info');
  });

  /* Theme toggles */
  var themeToggle = document.getElementById('themeToggle');
  var themeToggleAdmin = document.getElementById('themeToggleAdmin');
  var lpThemeToggle = document.getElementById('lpThemeToggle');
  if (themeToggle) themeToggle.addEventListener('click', cycleTheme);
  if (themeToggleAdmin) themeToggleAdmin.addEventListener('click', cycleTheme);
  if (lpThemeToggle) lpThemeToggle.addEventListener('click', cycleTheme);

  /* ── Landing Page ── */
  var landingInitialized = false;

  function initLanding() {
    if (landingInitialized) {
      var els = document.querySelectorAll('.scroll-reveal:not(.visible)');
      if ('IntersectionObserver' in window && els.length) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        els.forEach(function (el) { obs.observe(el); });
      } else { els.forEach(function (el) { el.classList.add('visible'); }); }
      return;
    }
    landingInitialized = true;

    document.addEventListener('click', function (e) {
      var ctaBtn = e.target.closest('.lp-cta-main, .lp-cta-final, .lp-register-btn');
      if (ctaBtn) { if (currentUser) { loadMain(); } else { navigateTo('loginPage'); setTimeout(function(){ switchTab('register'); }, 450); } return; }
      var loginBtn = e.target.closest('.lp-login-btn');
      if (loginBtn) { navigateTo('loginPage'); setTimeout(function(){ switchTab('login'); }, 450); return; }
      var anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        var href = anchor.getAttribute('href');
        if (href && href.length > 1) {
          var target = document.querySelector(href);
          if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }
        return;
      }
      var hamburger = e.target.closest('.lp-hamburger');
      if (hamburger) {
        var links = document.querySelector('.lp-nav-links');
        var actions = document.querySelector('.lp-nav-actions');
        if (links) {
          var vis = links.style.display === 'flex';
          links.style.display = vis ? 'none' : 'flex';
          if (actions) actions.style.display = vis ? 'none' : 'flex';
          if (!vis) {
            Object.assign(links.style, {
              flexDirection: 'column', position: 'absolute', top: '60px', left: '0', right: '0',
              background: 'var(--card)', padding: '16px 24px', backdropFilter: 'blur(24px)',
              borderBottom: '1px solid var(--border)', zIndex: '1000', gap: '16px'
            });
          }
        }
        return;
      }
      if (!e.target.closest('.lp-hamburger, .lp-nav-links, .lp-nav-actions')) {
        var nl = document.querySelector('.lp-nav-links');
        var na = document.querySelector('.lp-nav-actions');
        if (nl && nl.style.display === 'flex') { nl.style.display = 'none'; if (na) na.style.display = 'none'; }
      }
    });

    /* Scroll reveal */
    var revealEls = document.querySelectorAll('.scroll-reveal');
    if ('IntersectionObserver' in window) {
      var revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target); } });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { revObs.observe(el); });
    } else { revealEls.forEach(function (el) { el.classList.add('visible'); }); }

    /* Navbar scroll */
    var nav = document.querySelector('.lp-nav');
    if (nav) {
      window.addEventListener('scroll', function () {
        if (window.scrollY > 40) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
      }, { passive: true });
    }

    /* Counter animation */
    var counters = document.querySelectorAll('[data-count]');
    if ('IntersectionObserver' in window) {
      var cObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var target = parseInt(e.target.dataset.count);
            var dur = 1500; var start = performance.now();
            function update(now) {
              var p = Math.min((now - start) / dur, 1);
              e.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
              if (p < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
            cObs.unobserve(e.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cObs.observe(el); });
    }
  }

  /* ── Task Render ── */
  var PRI_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  var PRI_LABELS = { high: 'Yuksek', medium: 'Orta', low: 'Dusuk' };

  function getFiltered() {
    var list = todos.slice();
    if (filter.status === 'active') list = list.filter(function (x) { return !x.done; });
    else if (filter.status === 'completed') list = list.filter(function (x) { return x.done; });
    if (filter.priority !== 'all') list = list.filter(function (x) { return x.priority === filter.priority; });
    if (filter.category !== 'all') list = list.filter(function (x) { return x.category === filter.category; });
    if (filter.search) {
      var q = filter.search.toLowerCase();
      list = list.filter(function (x) {
        return x.text.toLowerCase().indexOf(q) !== -1 || (x.tags || []).some(function (tg) { return tg.toLowerCase().indexOf(q) !== -1; });
      });
    }
    var dir = sort.dir === 'asc' ? 1 : -1;
    var prio = { high: 3, medium: 2, low: 1 };
    list.sort(function (a, b) {
      if (sort.field === 'priority') return (prio[b.priority] - prio[a.priority]) * dir;
      if (sort.field === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return dir;
        if (!b.dueDate) return -dir;
        return (new Date(a.dueDate) - new Date(b.dueDate)) * dir;
      }
      if (sort.field === 'createdAt') return (new Date(a.createdAt) - new Date(b.createdAt)) * dir;
      return ((a.itemOrder || 0) - (b.itemOrder || 0)) * dir;
    });
    return list;
  }

  function render() {
    var list = document.getElementById('taskList');
    var empty = document.getElementById('emptyState');
    if (!list || !empty) return;
    var items = getFiltered();

    PRI_LABELS = { high: t('prio.high'), medium: t('prio.medium'), low: t('prio.low') };

    if (!items.length) { list.innerHTML = ''; empty.style.display = ''; updateStats(); return; }
    empty.style.display = 'none';

    list.innerHTML = items.map(function (task) {
      var od = isOverdue(task.dueDate) && !task.done;
      var ds = isDueSoon(task.dueDate) && !task.done && !od;
      var pc = PRI_COLORS[task.priority] || '#888';
      var pl = PRI_LABELS[task.priority] || task.priority;
      return '<li class="task-item' + (task.done ? ' completed' : '') + (od ? ' overdue' : '') + (ds ? ' due-soon' : '') +
        '" data-id="' + task.id + '" draggable="true">' +
        '<div class="task-content"><label class="task-check"><input type="checkbox"' + (task.done ? ' checked' : '') + ' aria-label="' + esc(task.text) + '"><span class="checkmark"></span></label>' +
        '<div class="task-main"><span class="task-text">' + esc(task.text) + '</span><div class="task-meta">' +
        (task.dueDate ? '<span class="task-badge badge-date' + (od ? ' overdue' : ds ? ' due-soon' : '') + '">' + fmtDate(task.dueDate) + '</span>' : '') +
        '<span class="task-badge badge-priority" style="background:' + pc + '15;color:' + pc + ';border-color:' + pc + '30">' + pl + '</span>' +
        (task.category ? '<span class="task-badge badge-category">' + esc(task.category) + '</span>' : '') +
        (task.tags || []).map(function (tg) { return '<span class="tag">' + esc(tg) + '</span>'; }).join('') +
        '</div></div></div>' +
        '<div class="task-actions">' +
        '<button class="act-btn edit" title="' + esc(t('task.edit') || 'Edit') + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
        '<button class="act-btn del" title="' + esc(t('task.del') || 'Delete') + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>' +
        '</div></li>';
    }).join('');

    bindTaskEvents();
    updateStats();
    updateCategoryFilter();
  }

  function bindTaskEvents() {
    var list = document.getElementById('taskList');
    if (!list) return;

    list.onclick = function (e) {
      var editBtn = e.target.closest('.act-btn.edit');
      if (editBtn) { var item = editBtn.closest('.task-item'); if (item) openEditor(item.dataset.id); return; }
      var delBtn = e.target.closest('.act-btn.del');
      if (delBtn) {
        var dItem = delBtn.closest('.task-item');
        if (dItem && confirm(t('confirm.deleteTask'))) {
          api('DELETE', '/tasks/' + dItem.dataset.id).then(function () {
            todos = todos.filter(function (x) { return String(x.id) !== String(dItem.dataset.id); });
            render(); showToast(t('toast.taskDel'), 'info');
          }).catch(function () { showToast(t('toast.error'), 'error'); });
        }
        return;
      }
    };

    list.onchange = function (e) {
      var cb = e.target.closest('.task-check');
      if (!cb) return;
      var li = cb.closest('.task-item');
      if (!li) return;
      var id = li.dataset.id;
      var task = todos.find(function (x) { return String(x.id) === String(id); });
      if (!task) return;
      task.done = !task.done;
      api('PUT', '/tasks/' + id, { done: task.done }).then(function () { render(); })
        .catch(function () { task.done = !task.done; render(); showToast(t('toast.updated'), 'error'); });
    };

    /* Desktop drag */
    list.ondragstart = function (e) {
      var item = e.target.closest('.task-item');
      if (!item) return;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.dataset.id);
    };
    list.ondragend = function (e) {
      var item = e.target.closest('.task-item');
      if (item) item.classList.remove('dragging');
      list.querySelectorAll('.task-item').forEach(function (el) { el.classList.remove('drag-over'); });
    };
    list.ondragover = function (e) {
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      var item = e.target.closest('.task-item');
      list.querySelectorAll('.task-item').forEach(function (el) { el.classList.remove('drag-over'); });
      if (item) item.classList.add('drag-over');
    };
    list.ondrop = function (e) {
      e.preventDefault();
      var targetItem = e.target.closest('.task-item');
      if (!targetItem) return;
      var draggedId = e.dataTransfer.getData('text/plain');
      var targetId = targetItem.dataset.id;
      if (!draggedId || draggedId === targetId) return;
      var fromIdx = todos.findIndex(function (x) { return String(x.id) === String(draggedId); });
      var toIdx = todos.findIndex(function (x) { return String(x.id) === String(targetId); });
      if (fromIdx === -1 || toIdx === -1) return;
      var moved = todos.splice(fromIdx, 1)[0];
      todos.splice(toIdx, 0, moved);
      api('PUT', '/tasks/reorder', { orderedIds: todos.map(function (x) { return x.id; }) })
        .then(function () { render(); })
        .catch(function () { showToast(t('toast.error'), 'error'); loadTasks().then(render); });
    };

    /* Mobile touch drag */
    var touchDragItem = null, touchClone = null, touchStartX = 0, touchStartY = 0, touchMoved = false;

    list.ontouchstart = function (e) {
      var item = e.target.closest('.task-item');
      if (!item || e.target.closest('.act-btn') || e.target.closest('.task-check')) return;
      var touch = e.touches[0];
      touchStartX = touch.clientX; touchStartY = touch.clientY; touchMoved = false;
      touchDragItem = item;
      touchDragItem._timer = setTimeout(function () {
        touchMoved = true;
        touchDragItem.classList.add('dragging');
        touchClone = touchDragItem.cloneNode(true);
        touchClone.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;opacity:.8;width:' + touchDragItem.offsetWidth + 'px;transform:scale(1.02);box-shadow:0 8px 32px rgba(0,0,0,.4);';
        touchClone.style.left = (touch.clientX - touchDragItem.offsetWidth / 2) + 'px';
        touchClone.style.top = (touch.clientY - 20) + 'px';
        document.body.appendChild(touchClone);
      }, 300);
    };
    list.ontouchmove = function (e) {
      if (!touchDragItem) return;
      var touch = e.touches[0];
      var dx = Math.abs(touch.clientX - touchStartX), dy = Math.abs(touch.clientY - touchStartY);
      if (dx > 10 || dy > 10) { touchMoved = true; if (touchDragItem._timer) clearTimeout(touchDragItem._timer); }
      if (touchClone) {
        e.preventDefault();
        touchClone.style.left = (touch.clientX - touchDragItem.offsetWidth / 2) + 'px';
        touchClone.style.top = (touch.clientY - 20) + 'px';
        var under = document.elementFromPoint(touch.clientX, touch.clientY);
        var underItem = under ? under.closest('.task-item') : null;
        list.querySelectorAll('.task-item').forEach(function (el) { el.classList.remove('drag-over'); });
        if (underItem && underItem !== touchDragItem) underItem.classList.add('drag-over');
      }
    };
    list.ontouchend = function (e) {
      if (!touchDragItem) return;
      if (touchDragItem._timer) clearTimeout(touchDragItem._timer);
      if (touchClone) {
        var touch = e.changedTouches[0];
        var under = document.elementFromPoint(touch.clientX, touch.clientY);
        var underItem = under ? under.closest('.task-item') : null;
        if (underItem && underItem !== touchDragItem) {
          var fromIdx = todos.findIndex(function (x) { return String(x.id) === touchDragItem.dataset.id; });
          var toIdx = todos.findIndex(function (x) { return String(x.id) === underItem.dataset.id; });
          if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
            var moved = todos.splice(fromIdx, 1)[0];
            todos.splice(toIdx, 0, moved);
            api('PUT', '/tasks/reorder', { orderedIds: todos.map(function (x) { return x.id; }) })
              .then(function () { render(); })
              .catch(function () { showToast(t('toast.error'), 'error'); loadTasks().then(render); });
          }
        }
        touchClone.remove(); touchClone = null;
      }
      touchDragItem.classList.remove('dragging');
      list.querySelectorAll('.task-item').forEach(function (el) { el.classList.remove('drag-over'); });
      touchDragItem = null; touchMoved = false;
    };
  }

  /* ── Task Form ── */
  document.getElementById('taskForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = document.getElementById('taskInput');
    var text = inp.value.trim();
    if (!text) return;
    var tags = (document.getElementById('taskTags').value || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    api('POST', '/tasks', {
      text: text,
      priority: document.getElementById('taskPriority').value,
      dueDate: document.getElementById('taskDueDate').value || null,
      category: document.getElementById('taskCategory').value || '',
      tags: tags
    }).then(function (task) {
      todos.push(task); inp.value = '';
      document.getElementById('taskTags').value = '';
      document.getElementById('taskDueDate').value = '';
      render(); showToast(t('toast.taskAdd'), 'success');
    }).catch(function (err) { showToast(err.message || t('toast.noTask'), 'error'); });
  });

  var toggleExtrasEl = document.getElementById('toggleExtras');
  if (toggleExtrasEl) toggleExtrasEl.addEventListener('click', function () {
    var ex = document.getElementById('taskExtras');
    ex.classList.toggle('open');
    this.textContent = ex.classList.contains('open') ? t('main.task.advanced.hide') : t('main.task.advanced');
  });

  /* ── Filters ── */
  var searchTimer = null;
  var filterStatusEl = document.getElementById('filterStatus');
  var filterPriorityEl = document.getElementById('filterPriority');
  var filterCategoryEl = document.getElementById('filterCategory');
  var searchInputEl = document.getElementById('searchInput');
  var sortSelectEl = document.getElementById('sortSelect');
  if (filterStatusEl) filterStatusEl.addEventListener('change', function () { filter.status = this.value; render(); });
  if (filterPriorityEl) filterPriorityEl.addEventListener('change', function () { filter.priority = this.value; render(); });
  if (filterCategoryEl) filterCategoryEl.addEventListener('change', function () { filter.category = this.value; render(); });
  if (searchInputEl) searchInputEl.addEventListener('input', function () {
    var val = this.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { filter.search = val; render(); }, 250);
  });
  if (sortSelectEl) sortSelectEl.addEventListener('change', function () {
    var parts = this.value.split('-');
    sort.field = parts[0]; sort.dir = parts[1]; render();
  });

  var clearDoneBtn = document.getElementById('clearDoneBtn');
  if (clearDoneBtn) clearDoneBtn.addEventListener('click', function () {
    var done = todos.filter(function (x) { return x.done; });
    if (!done.length) { showToast(t('toast.noCompleted'), 'info'); return; }
    if (!confirm(done.length + t('confirm.clearDone'))) return;
    Promise.all(done.map(function (x) { return api('DELETE', '/tasks/' + x.id); })).then(function () {
      todos = todos.filter(function (x) { return !x.done; });
      render(); showToast(done.length + t('toast.clearDone'), 'info');
    }).catch(function () { showToast(t('toast.error'), 'error'); });
  });

  function updateStats() {
    var total = todos.length;
    var active = todos.filter(function (x) { return !x.done; }).length;
    var done = total - active;
    var late = todos.filter(function (x) { return !x.done && isOverdue(x.dueDate); }).length;
    var e = function (id) { return document.getElementById(id); };
    if (e('statTotal')) e('statTotal').textContent = total;
    if (e('statActive')) e('statActive').textContent = active;
    if (e('statDone')) e('statDone').textContent = done;
    if (e('statLate')) e('statLate').textContent = late;
  }

  function updateCategoryFilter() {
    var sel = document.getElementById('filterCategory');
    if (!sel) return;
    var cur = sel.value;
    var cats = [];
    todos.forEach(function (x) { if (x.category && cats.indexOf(x.category) === -1) cats.push(x.category); });
    cats.sort();
    sel.innerHTML = '<option value="all">' + t('filter.allCat') + '</option>' +
      cats.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
    sel.value = cur || 'all';
  }

  /* ── Edit Modal ── */
  function openEditor(id) {
    var task = todos.find(function (x) { return String(x.id) === String(id); });
    if (!task) return;
    editingId = id;
    document.getElementById('editText').value = task.text;
    document.getElementById('editPriority').value = task.priority || 'medium';
    document.getElementById('editDueDate').value = task.dueDate || '';
    document.getElementById('editCategory').value = task.category || '';
    document.getElementById('editTags').value = (task.tags || []).join(', ');
    document.getElementById('editDone').checked = task.done;
    document.getElementById('editModal').showModal();
    document.getElementById('editText').focus();
  }

  var editFormEl = document.getElementById('editForm');
  if (editFormEl) editFormEl.addEventListener('submit', function (e) {
    e.preventDefault();
    var task = todos.find(function (x) { return String(x.id) === String(editingId); });
    if (!task) return;
    var tags = document.getElementById('editTags').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    api('PUT', '/tasks/' + editingId, {
      text: document.getElementById('editText').value.trim(),
      done: document.getElementById('editDone').checked,
      priority: document.getElementById('editPriority').value,
      dueDate: document.getElementById('editDueDate').value || null,
      category: document.getElementById('editCategory').value || '',
      tags: tags
    }).then(function (updated) {
      var idx = todos.findIndex(function (x) { return String(x.id) === String(editingId); });
      if (idx !== -1) todos[idx] = updated;
      document.getElementById('editModal').close();
      render(); showToast(t('toast.taskEdit'), 'success');
    }).catch(function (err) { showToast(err.message || t('toast.error'), 'error'); });
  });

  var editDeleteBtnEl = document.getElementById('editDeleteBtn');
  if (editDeleteBtnEl) editDeleteBtnEl.addEventListener('click', function () {
    if (!confirm(t('confirm.deleteTask'))) return;
    api('DELETE', '/tasks/' + editingId).then(function () {
      todos = todos.filter(function (x) { return String(x.id) !== String(editingId); });
      document.getElementById('editModal').close(); render(); showToast(t('toast.taskDel'), 'info');
    }).catch(function () { showToast(t('toast.error'), 'error'); });
  });

  /* ── Modals close ── */
  document.querySelectorAll('.modal-close').forEach(function (btn) {
    btn.addEventListener('click', function () { var m = btn.closest('dialog'); if (m) m.close(); });
  });
  var editModal = document.getElementById('editModal');
  if (editModal) editModal.addEventListener('click', function (e) { if (e.target === this) this.close(); });
  var adminEditModal = document.getElementById('adminEditModal');
  if (adminEditModal) adminEditModal.addEventListener('click', function (e) { if (e.target === this) this.close(); });

  /* ── Keyboard ── */
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      var mp = document.getElementById('mainPage');
      var ti = document.getElementById('taskInput');
      if (mp && mp.classList.contains('active') && ti) { e.preventDefault(); ti.focus(); }
    }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      if (currentRole === 'admin' && authToken) { e.preventDefault(); showPage('adminPage', true); loadAdminUsers(); }
    }
  });

  /* ── Admin ── */
  var adminBtnEl = document.getElementById('adminBtn');
  if (adminBtnEl) adminBtnEl.addEventListener('click', function () { navigateTo('adminPage'); loadAdminUsers(); });
  var adminBackBtn = document.getElementById('adminBackBtn');
  if (adminBackBtn) adminBackBtn.addEventListener('click', function () { navigateTo('mainPage'); });

  function loadAdminUsers() {
    api('GET', '/admin/users').then(function (users) {
      var list = document.getElementById('adminUserList');
      var totalTasks = 0;
      list.innerHTML = users.map(function (u) {
        totalTasks += u.taskCount;
        var roleBadge = u.role === 'admin'
          ? '<span class="admin-badge">' + t('admin.badge.admin') + '</span>'
          : '<span class="admin-badge user-badge">' + t('admin.badge.user') + '</span>';
        var statusBadge = u.banned
          ? '<span class="admin-status-badge banned">' + t('admin.status.banned') + '</span>'
          : '<span class="admin-status-badge active">' + t('admin.status.active') + '</span>';
        return '<tr class="' + (u.banned ? 'admin-row-banned' : '') + '">' +
          '<td><span class="admin-id">#' + u.id + '</span></td>' +
          '<td><span class="admin-username">' + esc(u.username) + '</span>' + roleBadge + '</td>' +
          '<td>' + esc(u.email) + '</td>' +
          '<td>' + (u.role === 'admin' ? t('admin.badge.admin') : t('admin.badge.user')) + '</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td>' + (u.lastLogin ? fmtDate(u.lastLogin) : '-') + '</td>' +
          '<td><span class="admin-task-count">' + u.taskCount + '</span></td>' +
          '<td class="admin-actions">' +
            '<button class="btn btn-sm btn-secondary admin-edit-user" data-id="' + u.id + '" data-username="' + esc(u.username) + '" data-email="' + esc(u.email) + '" title="' + t('admin.btn.edit') + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
            '<button class="btn btn-sm btn-warning admin-toggle-ban" data-id="' + u.id + '" data-username="' + esc(u.username) + '" data-banned="' + u.banned + '" title="' + (u.banned ? t('admin.btn.unban') : t('admin.btn.ban')) + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></button>' +
            (u.username !== 'admin' ? '<button class="btn btn-sm btn-danger admin-delete-user" data-id="' + u.id + '" data-username="' + esc(u.username) + '" title="' + t('admin.btn.del') + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>' : '') +
          '</td></tr>';
      }).join('');

      document.getElementById('adminTotalUsers').textContent = users.length;
      document.getElementById('adminTotalTasks').textContent = totalTasks;

      list.querySelectorAll('.admin-edit-user').forEach(function (btn) {
        btn.addEventListener('click', function () { openAdminEdit(btn.dataset.id, btn.dataset.username, btn.dataset.email); });
      });
      list.querySelectorAll('.admin-toggle-ban').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var isBanned = btn.dataset.banned === 'true' || btn.dataset.banned === '1';
          var action = isBanned ? t('confirm.unbanUser') : t('confirm.banUser');
          if (confirm('"' + btn.dataset.username + '" ' + action)) {
            api('PUT', '/admin/users/' + btn.dataset.id, { banned: !isBanned }).then(function () {
              showToast(isBanned ? t('toast.banRemoved') : t('toast.banned'), isBanned ? 'success' : 'warning');
              loadAdminUsers();
            }).catch(function (err) { showToast(err.message || t('toast.error'), 'error'); });
          }
        });
      });
      list.querySelectorAll('.admin-delete-user').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (confirm('"' + btn.dataset.username + '"' + t('confirm.deleteUser'))) {
            api('DELETE', '/admin/users/' + btn.dataset.id).then(function () {
              showToast(t('toast.userDel'), 'info'); loadAdminUsers();
            }).catch(function (err) { showToast(err.message || t('toast.error'), 'error'); });
          }
        });
      });
    }).catch(function (err) { showToast(err.message || t('admin.usersLoadErr'), 'error'); });
  }

  function openAdminEdit(id, username, email) {
    document.getElementById('adminEditId').value = id;
    document.getElementById('adminEditIdDisplay').textContent = '#' + id;
    document.getElementById('adminEditUsername').value = username;
    document.getElementById('adminEditEmail').value = email;
    document.getElementById('adminEditPassword').value = '';
    api('GET', '/admin/users/' + id).then(function (data) {
      document.getElementById('adminEditDate').textContent = fmtDate(data.createdAt);
      document.getElementById('adminEditLastLogin').textContent = data.lastLogin ? fmtDate(data.lastLogin) : '-';
      document.getElementById('adminEditTaskCount').textContent = data.taskCount;
      document.getElementById('adminEditRole').value = data.role || 'user';
      document.getElementById('adminEditBanned').value = data.banned ? '1' : '0';
    }).catch(function () {
      ['adminEditDate', 'adminEditLastLogin'].forEach(function (id) { document.getElementById(id).textContent = '-'; });
      document.getElementById('adminEditTaskCount').textContent = '-';
    });
    document.getElementById('adminEditModal').showModal();
  }

  var adminEditFormEl = document.getElementById('adminEditForm');
  if (adminEditFormEl) adminEditFormEl.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = document.getElementById('adminEditId').value;
    var body = {
      username: document.getElementById('adminEditUsername').value.trim(),
      email: document.getElementById('adminEditEmail').value.trim(),
      role: document.getElementById('adminEditRole').value,
      banned: document.getElementById('adminEditBanned').value === '1'
    };
    var pw = document.getElementById('adminEditPassword').value;
    if (pw) body.password = pw;
    api('PUT', '/admin/users/' + id, body).then(function () {
      document.getElementById('adminEditModal').close();
      showToast(t('toast.userEdit'), 'success'); loadAdminUsers();
    }).catch(function (err) { showToast(err.message || t('toast.error'), 'error'); });
  });

  /* ══════════════════════════════════════
     INIT
     ══════════════════════════════════════ */

  /* Safety: reset transitioning if stuck */
  setInterval(function () { transitioning = false; }, 2000);

  try { setLanguage(currentLang); } catch (e) { console.error('setLanguage error:', e); }
  updateLandingNav();
  initLanding();

  var savedPage = 'landingPage';
  try { savedPage = localStorage.getItem('lastPage') || 'landingPage'; } catch (e) {}
  if (savedPage !== 'landingPage' && savedPage !== 'loginPage' && savedPage !== 'mainPage' && savedPage !== 'adminPage') savedPage = 'landingPage';

  var protectedPages = { mainPage: 1, adminPage: 1 };

  if (savedPage === 'adminPage' && authToken) {
    api('GET', '/me').then(function (data) {
      currentUser = data.username;
      currentRole = data.role || 'user';
      updateLandingNav();
      if (currentRole === 'admin') {
        showPage('adminPage', true);
        loadAdminUsers();
      } else {
        loadMain();
      }
    }).catch(function () {
      authToken = null; currentUser = null; currentRole = null;
      localStorage.removeItem('authToken');
      showPage('landingPage', true);
    });
  } else if (savedPage === 'mainPage' && authToken) {
    api('GET', '/me').then(function (data) {
      currentUser = data.username;
      currentRole = data.role || 'user';
      updateLandingNav();
      loadMain();
    }).catch(function () {
      authToken = null; currentUser = null; currentRole = null;
      localStorage.removeItem('authToken');
      showPage('landingPage', true);
    });
  } else if (savedPage === 'loginPage') {
    showPage('loginPage', true);
  } else {
    if (authToken) {
      api('GET', '/me').then(function (data) {
        currentUser = data.username;
        currentRole = data.role || 'user';
        updateLandingNav();
        showPage('landingPage', true);
      }).catch(function () {
        authToken = null; currentUser = null; currentRole = null;
        localStorage.removeItem('authToken');
        showPage('landingPage', true);
      });
    } else {
      showPage('landingPage', true);
    }
  }

  window.addEventListener('unhandledrejection', function (e) {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
  });

})();
