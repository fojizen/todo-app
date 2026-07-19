/* ═══════════════════════════════════════
   Todo App - Frontend
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Constants ── */
  var API = window.location.origin + '/api';

  /* ── Inject verify modal into body (mobile fix) ── */
  var vmWrap = document.createElement('div');
  vmWrap.id = 'verifyModal';
  vmWrap.className = 'modal-overlay';
  vmWrap.innerHTML = '<div class="modal-box verify-modal-box"><div class="verify-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7c5cff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg></div><h2 data-lang-key="verify.title">E-postani Dogrula</h2><p data-lang-key="verify.desc">Hesabini aktif etmek icin e-posta kutunu kontrol et. Dogrulama linkine tikla.</p><p class="verify-email-display" id="verifyEmailDisplay"></p><div class="verify-actions"><button class="btn btn-ghost modal-close" data-lang-key="verify.close">Tamam</button><button class="btn btn-secondary" id="resendBtn" data-lang-key="verify.resend">Tekrar Gonder</button></div></div>';
  document.body.appendChild(vmWrap);

  /* ── State ── */
  var authToken = localStorage.getItem('authToken');
  var currentUser = null;
  var currentRole = null;
  var todos = [];
  var categories = [];
  var filter = { status: 'all', priority: 'all', category: 'all', search: '', quickFilter: 'all' };
  var sort = { field: 'order', dir: 'asc' };
  var editingId = null;
  var transitioning = false;
  var userProfile = { xp: 0, level: 1, streak: 0, lastcompletiondate: null, dailygoal: 5, weeklygoal: 25 };
  var pendingSubtasks = [];
  var editingSubtasks = [];
  var pomoState = { running: false, paused: false, seconds: 25 * 60, duration: 25, interval: null, taskId: null };

  /* ── i18n ── */
  var currentLang = localStorage.getItem('lang') || 'tr';

  var i18n = {
    tr: {
      'nav.features':'Ozellikler','nav.how':'Nasil Calisir','nav.tech':'Teknoloji',
      'nav.login':'Giris Yap','nav.register':'Kayit Ol','nav.home':'Anasayfa','nav.gotasks':'Gorevlerim',
      'nav.about':'Hakkinda','nav.privacy':'Gizlilik',
      'hero.badge':'Gorevlerini Duzene Koyma Zamani',
      'hero.title':'Yapman gereken her sey,<br><span class="lp-gradient-text">tek bir yerde.</span>',
      'hero.sub':'Gorevlerini olustur, onceliklendir, kategorilere ayir ve tamamla.<br>Guvenli, hizli ve muhtesem gorunen bir todo deneyimi.',
      'hero.cta':'Hemen Basla','hero.more':'Daha Fazla','hero.install':'Uygulamayi Kur',
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
      'about.tag':'Gelistirici','about.title':'fojizen<br><span class="lp-gradient-text">Hakkinda.</span>',
      'about.desc':'JavaScript, Node.js ve PostgreSQL ile modern, guvenli ve performansli web uygulamalari gelistiriyorum. Vanilla JS ile framework bagimliligi olmadan, saf performans ve temiz kod odakli projeler uretiyorum.',
      'privacy.tag':'Yasal','privacy.title':'Gizlilik<br><span class="lp-gradient-text">Politikasi.</span>',
      'privacy.update':'Son guncelleme: 17 Temmuz 2026',
      'privacy.more':'Daha Fazla Oku','privacy.less':'Daha Az Goster',
      'privacy.1':'<strong>1. Toplanan Veriler</strong><p>Kayit isleminde kullanici adi, e-posta adresi ve sifreniz (bcrypt ile sifrelenmis olarak) toplanir. Gorevleriniz uygulama icerisinde saklanir.</p>',
      'privacy.2':'<strong>2. Veri Kullanimi</strong><p>Toplanan veriler yalnizca uygulamanin dogru calismasi, hesap guvenligi ve size daha iyi bir deneyim sunmak icin kullanilir. Ucuncu taraflarla paylasilmaz.</p>',
      'privacy.3':'<strong>3. Veri Guvenligi</strong><p>Sifreler bcrypt ile hashlenir, JWT token ile oturumlar guvence altina alinir. Verileriniz SSL/TLS ile sifreli olarak iletilir. HTTPS uzerinden baglanti kurulur.</p>',
      'privacy.4':'<strong>4. Cookie Kullanimi</strong><p>Oturum yonetimi icin httpOnly cookie kullanilir. Reklam veya analitik cookie kullanilmaz.</p>',
      'privacy.5':'<strong>5. Veri Saklama</strong><p>Hesabinizi sildiginizde tum verileriniz kalici olarak silinir. Pasif hesaplar herhangi bir sure sonunda otomatik silinmez.</p>',
      'privacy.6':'<strong>6. Iletisim</strong><p>Gizlilik politikasiyla ilgili sorulariniz icin <a href="https://github.com/fojizen" target="_blank" rel="noopener">GitHub</a> uzerinden ulasin.</p>',
      'privacy.content':'<p>Son guncelleme: 17 Temmuz 2026</p><p><strong>1. Toplanan Veriler</strong></p><p>Kayit isleminde kullanici adi, e-posta adresi ve sifreniz (bcrypt ile sifrelenmis olarak) toplanir. Gorevleriniz uygulama icerisinde saklanir.</p><p><strong>2. Veri Kullanimi</strong></p><p>Toplanan veriler yalnizca uygulamanin dogru calismasi, hesap guvenligi ve size daha iyi bir deneyim sunmak icin kullanilir. Ucuncu taraflarla paylasilmaz.</p><p><strong>3. Veri Guvenligi</strong></p><p>Sifreler bcrypt ile hashlenir, JWT token ile oturumlar guvence altina alinir. Verileriniz SSL/TLS ile sifreli olarak iletilir. HTTPS uzerinden baglanti kurulur.</p><p><strong>4. Cookie Kullanimi</strong></p><p>Oturum yonetimi icin httpOnly cookie kullanilir. Reklam veya analitik cookie kullanilmaz.</p><p><strong>5. Veri Saklama</strong></p><p>Hesabinizi sildiginizde tum verileriniz kalici olarak silinir. Pasif hesaplar herhangi bir sure sonunda otomatik silinmez.</p><p><strong>6. Iletisim</strong></p><p>Gizlilik politikasiyla ilgili sorulariniz icin <a href="https://github.com/fojizen" target="_blank" rel="noopener">GitHub</a> uzerinden ulasin.</p>',
      'verify.title':'E-postani Dogrula','verify.desc':'Hesabini aktif etmek icin e-posta kutunu kontrol et. Dogrulama linkine tikla.',
      'verify.close':'Tamam','verify.resend':'Tekrar Gonder',
      'toast.verificationSent':'Dogrulama epostasi gonderildi',
      'auth.back':'Anasayfa','auth.subtitle':'Gorevlerini yonet, organize ol',
      'auth.tab.login':'Giris Yap','auth.tab.register':'Kayit Ol','auth.or':'veya',
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
      'toast.loginOk':'Giris basarili!','toast.registerOk':'Kayit basarili!','toast.verifySent':'Dogrulama e-postasi gonderildi!','toast.logout':'Cikis yapildi',
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
      'admin.usersLoadErr':'Kullanicialar yuklenemedi',
      'sb.level':'Seviye','sb.streak':'gun seri','sb.quickFilters':'Hizli Filtreler',
      'sb.allTasks':'Tum Gorevler','sb.today':'Bugun','sb.thisWeek':'Bu Hafta','sb.overdue':'Gecikmis','sb.starred':'Yildizli','sb.completed':'Tamamlanan',
      'sb.categories':'Kategoriler','sb.addCategory':'Kategori Ekle','sb.catName':'Kategori adi',
      'sb.focus':'Odaklanma','sb.pomo.ready':'Hazir','sb.pomo.running':'Devam ediyor','sb.pomo.break':'Mola',
      'sb.pomo.start':'Baslat','sb.pomo.pause':'Duraklat','sb.pomo.reset':'Sifirla','sb.pomo.done':'Mola zamanı!',
      'sb.weeklyStats':'Haftalik Istatistik','sb.weeklyMsg':'Bu hafta {n} gorev tamamladin {emoji}',
      'sb.dailyGoal':'Gunluk Hedef',
      'recurring.none':'Yok','recurring.daily':'Her Gun','recurring.weekly':'Her Hafta','recurring.monthly':'Her Ay',
      'main.task.recurring':'Tekrar','main.task.subtask.ph':'Alt gorev ekle...',
      'edit.recurring':'Tekrar','edit.subtasks':'Alt Gorevler','edit.starred':'Yildizli',
      'subtask.done':'Tamamlandi','cat.default.work':'Is','cat.default.personal':'Kisisel',
      'cat.default.shopping':'Alisveris','cat.default.health':'Saglik','cat.default.education':'Egitim',
      'toast.catAdded':'Kategori eklendi','toast.catDeleted':'Kategori silindi',
      'toast.levelUp':'Seviye {n} oldun!','toast.streak':'Seri devam ediyor!',
      'toast.pomoDone':'Odaklanma bitti! 5 dakika mola.','toast.xpGain':'+{n} XP',
      'toast.goalReached':'Gunluk hedefe ulastin!','confirm.deleteCat':'Bu kategoriyi silmek istediginize emin misiniz?'
    },
    en: {
      'nav.features':'Features','nav.how':'How It Works','nav.tech':'Tech',
      'nav.login':'Login','nav.register':'Register','nav.home':'Home','nav.gotasks':'My Tasks',
      'nav.about':'About','nav.privacy':'Privacy',
      'hero.badge':'Time to Organize Your Tasks',
      'hero.title':'Everything you need,<br><span class="lp-gradient-text">in one place.</span>',
      'hero.sub':'Create, prioritize, categorize and complete tasks.<br>A secure, fast and beautiful todo experience.',
      'hero.cta':'Get Started','hero.more':'Learn More','hero.install':'Install App',
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
      'about.tag':'Developer','about.title':'About<br><span class="lp-gradient-text">fojizen.</span>',
      'about.desc':'I build modern, secure and performant web applications with JavaScript, Node.js and PostgreSQL. Focused on clean code and raw performance with vanilla JS, no framework dependencies.',
      'privacy.tag':'Legal','privacy.title':'Privacy<br><span class="lp-gradient-text">Policy.</span>',
      'privacy.update':'Last updated: July 17, 2026',
      'privacy.more':'Read More','privacy.less':'Show Less',
      'privacy.1':'<strong>1. Data Collected</strong><p>During registration, your username, email address, and password (encrypted with bcrypt) are collected. Your tasks are stored within the application.</p>',
      'privacy.2':'<strong>2. Data Usage</strong><p>Collected data is used solely for the proper functioning of the application, account security, and providing you with a better experience. It is not shared with third parties.</p>',
      'privacy.3':'<strong>3. Data Security</strong><p>Passwords are hashed with bcrypt, sessions are secured with JWT tokens. Your data is transmitted encrypted via SSL/TLS. Connections are established over HTTPS.</p>',
      'privacy.4':'<strong>4. Cookie Usage</strong><p>httpOnly cookies are used for session management. No advertising or analytics cookies are used.</p>',
      'privacy.5':'<strong>5. Data Retention</strong><p>When you delete your account, all your data is permanently deleted. Inactive accounts are not automatically deleted after any period.</p>',
      'privacy.6':'<strong>6. Contact</strong><p>For questions about the privacy policy, reach out via <a href="https://github.com/fojizen" target="_blank" rel="noopener">GitHub</a>.</p>',
      'privacy.content':'<p>Last updated: July 17, 2026</p><p><strong>1. Data Collected</strong></p><p>During registration, your username, email address, and password (encrypted with bcrypt) are collected. Your tasks are stored within the application.</p><p><strong>2. Data Usage</strong></p><p>Collected data is used solely for the proper functioning of the application, account security, and providing you with a better experience. It is not shared with third parties.</p><p><strong>3. Data Security</strong></p><p>Passwords are hashed with bcrypt, sessions are secured with JWT tokens. Your data is transmitted encrypted via SSL/TLS. Connections are established over HTTPS.</p><p><strong>4. Cookie Usage</strong></p><p>httpOnly cookies are used for session management. No advertising or analytics cookies are used.</p><p><strong>5. Data Retention</strong></p><p>When you delete your account, all your data is permanently deleted. Inactive accounts are not automatically deleted after any period.</p><p><strong>6. Contact</strong></p><p>For questions about the privacy policy, reach out via <a href="https://github.com/fojizen" target="_blank" rel="noopener">GitHub</a>.</p>',
      'verify.title':'Verify Your Email','verify.desc':'Check your inbox and click the verification link to activate your account.',
      'verify.close':'OK','verify.resend':'Resend',
      'toast.verificationSent':'Verification email sent',
      'auth.back':'Home','auth.subtitle':'Manage your tasks, stay organized',
      'auth.tab.login':'Login','auth.tab.register':'Register','auth.or':'or',
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
      'toast.loginOk':'Login successful!','toast.registerOk':'Registration successful!','toast.verifySent':'Verification email sent!','toast.logout':'Logged out',
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
      'admin.usersLoadErr':'Could not load users',
      'sb.level':'Level','sb.streak':'day streak','sb.quickFilters':'Quick Filters',
      'sb.allTasks':'All Tasks','sb.today':'Today','sb.thisWeek':'This Week','sb.overdue':'Overdue','sb.starred':'Starred','sb.completed':'Completed',
      'sb.categories':'Categories','sb.addCategory':'Add Category','sb.catName':'Category name',
      'sb.focus':'Focus Timer','sb.pomo.ready':'Ready','sb.pomo.running':'Running','sb.pomo.break':'Break',
      'sb.pomo.start':'Start','sb.pomo.pause':'Pause','sb.pomo.reset':'Reset','sb.pomo.done':'Break time!',
      'sb.weeklyStats':'Weekly Stats','sb.weeklyMsg':'You completed {n} tasks this week {emoji}',
      'sb.dailyGoal':'Daily Goal',
      'recurring.none':'None','recurring.daily':'Daily','recurring.weekly':'Weekly','recurring.monthly':'Monthly',
      'main.task.recurring':'Repeat','main.task.subtask.ph':'Add subtask...',
      'edit.recurring':'Repeat','edit.subtasks':'Subtasks','edit.starred':'Starred',
      'subtask.done':'Done','cat.default.work':'Work','cat.default.personal':'Personal',
      'cat.default.shopping':'Shopping','cat.default.health':'Health','cat.default.education':'Education',
      'toast.catAdded':'Category added','toast.catDeleted':'Category deleted',
      'toast.levelUp':'You reached Level {n}!','toast.streak':'Streak continues!',
      'toast.pomoDone':'Focus session done! Take a 5-min break.','toast.xpGain':'+{n} XP',
      'toast.goalReached':'Daily goal reached!','confirm.deleteCat':'Delete this category?'
    }
  };

  var i18nOptions = {
    'filter.status':[{value:'all',tr:'Tumu',en:'All'},{value:'active',tr:'Aktif',en:'Active'},{value:'completed',tr:'Tamamlanan',en:'Completed'}],
    'filter.priority':[{value:'all',tr:'Tum Oncelikler',en:'All Priorities'},{value:'high',tr:'Yuksek',en:'High'},{value:'medium',tr:'Orta',en:'Medium'},{value:'low',tr:'Dusuk',en:'Low'}],
    'task.priority':[{value:'low',tr:'Dusuk',en:'Low'},{value:'medium',tr:'Orta',en:'Medium'},{value:'high',tr:'Yuksek',en:'High'}],
    'task.category':[],
    'edit.priority':[{value:'low',tr:'Dusuk',en:'Low'},{value:'medium',tr:'Orta',en:'Medium'},{value:'high',tr:'Yuksek',en:'High'}],
    'edit.category':[],
    'sort.select':[{value:'order-asc',tr:'Siralama',en:'Sort'},{value:'createdAt-desc',tr:'En Yeni',en:'Newest'},{value:'createdAt-asc',tr:'En Eski',en:'Oldest'},{value:'priority-desc',tr:'Oncelik',en:'Priority'},{value:'dueDate-asc',tr:'Bitis Tarihi',en:'Due Date'}],
    'adminEdit.role':[{value:'user',tr:'User',en:'User'},{value:'admin',tr:'Admin',en:'Admin'}],
    'adminEdit.status':[{value:'0',tr:'Aktif',en:'Active'},{value:'1',tr:'Banli',en:'Banned'}],
    'task.recurring':[{value:'',tr:'Yok',en:'None'},{value:'daily',tr:'Her Gun',en:'Daily'},{value:'weekly',tr:'Her Hafta',en:'Weekly'},{value:'monthly',tr:'Her Ay',en:'Monthly'}],
    'edit.recurring':[{value:'',tr:'Yok',en:'None'},{value:'daily',tr:'Her Gun',en:'Daily'},{value:'weekly',tr:'Her Hafta',en:'Weekly'},{value:'monthly',tr:'Her Ay',en:'Monthly'}]
  };

  var HTML_KEYS = {'hero.title':1,'hero.sub':1,'feat.title':1,'how.title':1,'tech.title':1,'cta.title':1,'about.title':1,'privacy.title':1,'privacy.content':1,'privacy.1':1,'privacy.2':1,'privacy.3':1,'privacy.4':1,'privacy.5':1,'privacy.6':1,'footer.contact':1,'footer.copyright':1,'verify.title':1,'verify.desc':1,'verify.close':1};

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
    renderCategorySelects();
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
    var opts = { method: method, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' }, credentials: 'include', cache: 'no-store' };
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

  function updateHeroHeight() {
    var hero = document.querySelector('.lp-hero');
    if (!hero) return;
    if (window.innerWidth >= 769) {
      hero.style.minHeight = window.innerHeight + 'px';
    } else {
      hero.style.minHeight = '';
    }
  }

  window.addEventListener('resize', function () {
    updateHeroHeight();
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    var active = document.querySelector('.page.active');
    if (active && (active.id === 'mainPage' || active.id === 'landingPage')) initParticles();
  });

  /* ── Page Navigation ── */

  function resetHamburgerNav() {
    var drawer = document.getElementById('mobileDrawer');
    var overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
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
      setTimeout(function () { if (loader.parentNode) loader.remove(); }, 250);
    }
  }

  function navigateTo(name, cb) {
    var current = document.querySelector('.page.active');
    var next = document.getElementById(name);
    if (current === next) { if (cb) cb(); return; }
    showLoader();
    var startTime = Date.now();
    requestAnimationFrame(function () {
      showPage(name, true);
      if (cb) cb();
      var elapsed = Date.now() - startTime;
      var remaining = Math.max(0, 200 - elapsed);
      setTimeout(function () { hideLoader(); }, remaining);
    });
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
        setTimeout(function () { transitioning = false; }, 30);
        if (name === 'landingPage') { resetHamburgerNav(); setTimeout(updateHeroHeight, 30); }
        if (name === 'loginPage') { setTimeout(renderGoogleButton, 50); }
        if ((name === 'mainPage' || name === 'landingPage') && !animId) initParticles();
        else if (name !== 'mainPage' && name !== 'landingPage' && animId) { cancelAnimationFrame(animId); animId = null; }
        window.scrollTo(0, 0);
      }, 180);
    } else {
      transitioning = false;
      document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active', 'page-transition-out'); });
      next.classList.add('active');
      if (name === 'landingPage') { resetHamburgerNav(); setTimeout(updateHeroHeight, 50); }
      if (name === 'loginPage') { setTimeout(renderGoogleButton, 50); }
      if ((name === 'mainPage' || name === 'landingPage') && !animId) initParticles();
      else if (name !== 'mainPage' && name !== 'landingPage' && animId) { cancelAnimationFrame(animId); animId = null; }
      window.scrollTo(0, 0);
    }
    var toastEl = document.getElementById('toastContainer');
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
    var drawerAuth = document.querySelector('.mobile-drawer-auth');
    var drawerUser = document.getElementById('mobileDrawerUser');
    if (currentUser) {
      if (authBtns) authBtns.style.display = 'none';
      if (userMenu) { userMenu.style.display = ''; if (usernameEl) usernameEl.textContent = currentUser; }
      if (drawerAuth) drawerAuth.style.display = 'none';
      if (drawerUser) drawerUser.style.display = '';
      if (ctaTitle) { ctaTitle.innerHTML = t('cta.title loggedIn'); ctaTitle.setAttribute('data-lang-key', 'cta.title loggedIn'); }
      if (ctaSub) { ctaSub.textContent = t('cta.sub loggedIn'); ctaSub.setAttribute('data-lang-key', 'cta.sub loggedIn'); }
      if (ctaBtnText) { ctaBtnText.textContent = t('cta.btn loggedIn'); ctaBtnText.setAttribute('data-lang-key', 'cta.btn loggedIn'); }
      if (heroCtaText) { heroCtaText.textContent = t('hero.cta loggedIn'); heroCtaText.setAttribute('data-lang-key', 'hero.cta loggedIn'); }
    } else {
      if (authBtns) authBtns.style.display = '';
      if (userMenu) userMenu.style.display = 'none';
      if (drawerAuth) drawerAuth.style.display = '';
      if (drawerUser) drawerUser.style.display = 'none';
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
    initSidebar();
    loadTasks().then(function () {
      showPage('mainPage', true);
      hideLoader();
      render();
      loadCategories();
      loadUserProfile();
      loadWeeklyStats();
      updateDailyGoal();
    }).catch(function (err) {
      if (err.message === 'Internet baglantisi yok') {
        showPage('mainPage', true);
        render();
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
        showPage('mainPage', true);
        render();
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

  /* Google Sign-In */
  var googleInited = false;
  var googleReady = false;
  function initGoogleSignIn() {
    if (googleReady) return;
    if (typeof google === 'undefined' || !google.accounts || !GOOGLE_CLIENT_ID) return;
    googleReady = true;
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: function (response) {
        if (!response.credential) return;
        setBtnLoading(document.getElementById('loginBtn'), true);
        api('POST', '/auth/google', { credential: response.credential }).then(function (data) {
          authToken = data.token; currentUser = data.username; currentRole = data.role || 'user';
          localStorage.setItem('authToken', data.token);
          updateLandingNav();
          showToast(t('toast.loginOk'), 'success');
          loadMain();
        }).catch(function (err) {
          showToast(err.message || 'Google giris basarisiz', 'error');
        }).finally(function () {
          setBtnLoading(document.getElementById('loginBtn'), false);
        });
      }
    });
  }
  function renderGoogleButton() {
    if (!googleReady) { initGoogleSignIn(); }
    if (!googleReady) return;
    var btnEl = document.getElementById('googleSignInBtn');
    if (!btnEl) return;
    btnEl.innerHTML = '';
    google.accounts.id.renderButton(btnEl, {
      theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'outline' : 'filled_blue',
      size: 'large',
      width: 320,
      text: 'continue_with',
      shape: 'rectangular'
    });
  }
  function tryInitGoogle(retries) {
    if (googleReady) return;
    if (typeof google !== 'undefined' && google.accounts) { initGoogleSignIn(); renderGoogleButton(); return; }
    if (retries > 0) setTimeout(function () { tryInitGoogle(retries - 1); }, 300);
  }
  window.addEventListener('load', function () { tryInitGoogle(10); });

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
        if (vm) vm.classList.add('active');
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
      showToast(t('toast.verifySent'), 'success');
      var verifyModal = document.getElementById('verifyModal');
      var emailDisplay = document.getElementById('verifyEmailDisplay');
      if (emailDisplay) emailDisplay.textContent = email;
      if (verifyModal) verifyModal.classList.add('active');
      setBtnSuccess(btn);
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
  if (verifyModal) verifyModal.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('active'); });
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

  /* Logout */
  function handleLpLogout() {
    api('POST', '/logout').catch(function () {});
    currentUser = null; currentRole = null; authToken = null;
    localStorage.removeItem('authToken');
    todos = [];
    updateLandingNav();
    var drawer = document.getElementById('mobileDrawer');
    var overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    navigateTo('landingPage');
    setTimeout(initLanding, 450);
    showToast(t('toast.logout'), 'info');
  }

  /* Logout button */
  var logoutBtnEl = document.getElementById('logoutBtn');
  if (logoutBtnEl) logoutBtnEl.addEventListener('click', function () { handleLpLogout(); });

  /* Theme toggles */
  var themeToggle = document.getElementById('themeToggle');
  var themeToggleAdmin = document.getElementById('themeToggleAdmin');
  var lpThemeToggle = document.getElementById('lpThemeToggle');
  var authThemeToggle = document.getElementById('authThemeToggle');
  var lpMobileTheme = document.querySelector('.lp-mobile-theme');
  if (themeToggle) themeToggle.addEventListener('click', cycleTheme);
  if (themeToggleAdmin) themeToggleAdmin.addEventListener('click', cycleTheme);
  if (lpThemeToggle) lpThemeToggle.addEventListener('click', cycleTheme);
  if (authThemeToggle) authThemeToggle.addEventListener('click', cycleTheme);
  if (lpMobileTheme) lpMobileTheme.addEventListener('click', cycleTheme);

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
      if (ctaBtn) { if (currentUser) { loadMain(); } else { switchTab('register'); navigateTo('loginPage'); } return; }
      var loginBtn = e.target.closest('.lp-login-btn');
      if (loginBtn) { switchTab('login'); navigateTo('loginPage'); return; }
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
        var drawer = document.getElementById('mobileDrawer');
        var overlay = document.getElementById('mobileDrawerOverlay');
        if (drawer) {
          var isOpen = drawer.classList.contains('open');
          drawer.classList.toggle('open');
          if (overlay) overlay.classList.toggle('open');
        }
        return;
      }
      if (!e.target.closest('.lp-hamburger, .mobile-drawer, .mobile-drawer *')) {
        var drawer = document.getElementById('mobileDrawer');
        var overlay = document.getElementById('mobileDrawerOverlay');
        if (drawer && drawer.classList.contains('open')) {
          drawer.classList.remove('open');
          if (overlay) overlay.classList.remove('open');
        }
      }
    });

    var drawerOverlay = document.getElementById('mobileDrawerOverlay');
    if (drawerOverlay) drawerOverlay.addEventListener('click', function () {
      var drawer = document.getElementById('mobileDrawer');
      var overlay = document.getElementById('mobileDrawerOverlay');
      if (drawer) drawer.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
    });

    var drawer = document.getElementById('mobileDrawer');
    if (drawer) drawer.addEventListener('click', function (e) {
      if (e.target.classList.contains('mobile-drawer-link')) {
        var drawerEl = document.getElementById('mobileDrawer');
        var overlayEl = document.getElementById('mobileDrawerOverlay');
        if (drawerEl) drawerEl.classList.remove('open');
        if (overlayEl) overlayEl.classList.remove('open');
      }
    });

    var drawerSwipeEl = document.getElementById('mobileDrawer');
    if (drawerSwipeEl) {
      var swipeStartX = 0, swipeStartY = 0, swipeActive = false;
      drawerSwipeEl.addEventListener('touchstart', function (e) {
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
        swipeActive = true;
      }, { passive: true });
      drawerSwipeEl.addEventListener('touchmove', function (e) {
        if (!swipeActive) return;
        var dx = e.touches[0].clientX - swipeStartX;
        var dy = Math.abs(e.touches[0].clientY - swipeStartY);
        if (dy > 40) { swipeActive = false; return; }
        if (dx > 0) {
          drawerSwipeEl.style.transition = 'none';
          drawerSwipeEl.style.transform = 'translateX(' + Math.min(dx, 280) + 'px)';
          var ov = document.getElementById('mobileDrawerOverlay');
          if (ov) ov.style.opacity = Math.max(0, 1 - dx / 280);
        }
      }, { passive: true });
      drawerSwipeEl.addEventListener('touchend', function (e) {
        if (!swipeActive) return;
        swipeActive = false;
        var dx = (e.changedTouches[0].clientX) - swipeStartX;
        drawerSwipeEl.style.transition = '';
        drawerSwipeEl.style.transform = '';
        var ov = document.getElementById('mobileDrawerOverlay');
        if (ov) ov.style.opacity = '';
        if (dx > 100) {
          drawerSwipeEl.classList.remove('open');
          if (ov) ov.classList.remove('open');
        }
      }, { passive: true });
    }

    var mDrawerTasks = document.getElementById('mobileDrawerTasks');
    if (mDrawerTasks) mDrawerTasks.addEventListener('click', function () { navigateTo('mainPage'); });

    var privacyToggle = document.getElementById('privacyToggle');
    var privacyFull = document.getElementById('privacyFull');
    if (privacyToggle && privacyFull) {
      privacyToggle.addEventListener('click', function () {
        var isOpen = privacyFull.classList.contains('open');
        privacyFull.classList.toggle('open');
        privacyToggle.classList.toggle('open');
        privacyToggle.querySelector('svg').previousSibling.textContent = isOpen ? t('privacy.more') : t('privacy.less');
      });
    }

    var mDrawerLogout = document.getElementById('mobileDrawerLogout');
    if (mDrawerLogout) mDrawerLogout.addEventListener('click', function () { handleLpLogout(); });

    var mDrawerLogin = document.getElementById('mobileDrawerLogin');
    var mDrawerRegister = document.getElementById('mobileDrawerRegister');
    var mDrawerToggle = document.querySelector('.mobile-drawer-toggle');
    if (mDrawerLogin) mDrawerLogin.addEventListener('click', function () {
      mDrawerLogin.classList.add('active');
      if (mDrawerRegister) mDrawerRegister.classList.remove('active');
      if (mDrawerToggle) mDrawerToggle.setAttribute('data-active', 'login');
      var drawer = document.getElementById('mobileDrawer');
      var overlay = document.getElementById('mobileDrawerOverlay');
      if (drawer) drawer.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      navigateTo('loginPage', function () {
        var lt = document.getElementById('loginTab');
        if (lt) lt.click();
      });
    });
    if (mDrawerRegister) mDrawerRegister.addEventListener('click', function () {
      mDrawerRegister.classList.add('active');
      if (mDrawerLogin) mDrawerLogin.classList.remove('active');
      if (mDrawerToggle) mDrawerToggle.setAttribute('data-active', 'register');
      var drawer = document.getElementById('mobileDrawer');
      var overlay = document.getElementById('mobileDrawerOverlay');
      if (drawer) drawer.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      navigateTo('loginPage', function () {
        var rt = document.getElementById('registerTab');
        if (rt) rt.click();
      });
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
    if (filter.quickFilter === 'today') {
      var today = new Date(); today.setHours(0,0,0,0);
      list = list.filter(function(x) {
        if (!x.dueDate) return false;
        var d = new Date(x.dueDate); d.setHours(0,0,0,0);
        return d.getTime() === today.getTime();
      });
    } else if (filter.quickFilter === 'week') {
      var now = new Date(); now.setHours(0,0,0,0);
      var ws = new Date(now); ws.setDate(ws.getDate() - ws.getDay() + 1);
      var we = new Date(ws); we.setDate(we.getDate() + 6);
      list = list.filter(function(x) {
        if (!x.dueDate) return false;
        var d = new Date(x.dueDate); d.setHours(0,0,0,0);
        return d >= ws && d <= we;
      });
    } else if (filter.quickFilter === 'overdue') {
      list = list.filter(function(x) { return !x.done && isOverdue(x.dueDate); });
    } else if (filter.quickFilter === 'starred') {
      list = list.filter(function(x) { return x.starred; });
    } else if (filter.quickFilter === 'completed') {
      list = list.filter(function(x) { return x.done; });
    }
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
      var subtasks = task.subtasks || [];
      var subDone = subtasks.filter(function(s) { return s.done; }).length;
      var recurringIcons = { daily: '🔄', weekly: '📅', monthly: '📆' };
      return '<li class="task-item' + (task.done ? ' completed' : '') + (od ? ' overdue' : '') + (ds ? ' due-soon' : '') +
        '" data-id="' + task.id + '" draggable="true">' +
        '<div class="task-content"><label class="task-check"><input type="checkbox"' + (task.done ? ' checked' : '') + ' aria-label="' + esc(task.text) + '"><span class="checkmark"></span></label>' +
        '<div class="task-main"><span class="task-text">' + esc(task.text) + '</span><div class="task-meta">' +
        (task.dueDate ? '<span class="task-badge badge-date' + (od ? ' overdue' : ds ? ' due-soon' : '') + '">' + fmtDate(task.dueDate) + '</span>' : '') +
        '<span class="task-badge badge-priority" style="background:' + pc + '15;color:' + pc + ';border-color:' + pc + '30">' + pl + '</span>' +
        (task.category ? '<span class="task-badge badge-category">' + esc(task.category) + '</span>' : '') +
        (task.recurring ? '<span class="task-badge badge-recurring">' + (recurringIcons[task.recurring] || '') + ' ' + t('recurring.' + task.recurring) + '</span>' : '') +
        (task.tags || []).map(function (tg) { return '<span class="tag">' + esc(tg) + '</span>'; }).join('') +
        '</div></div></div>' +
        (subtasks.length ? '<button class="subtask-toggle" title="' + subDone + '/' + subtasks.length + ' alt gorev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg><span class="subtask-toggle-count">' + subDone + '/' + subtasks.length + '</span></button>' : '') +
        '<div class="task-actions">' +
        '<button class="act-btn star' + (task.starred ? ' starred' : '') + '" title="' + esc(t('edit.starred')) + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="' + (task.starred ? '#f59e0b' : 'none') + '" stroke="' + (task.starred ? '#f59e0b' : 'currentColor') + '" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>' +
        '<button class="act-btn edit" title="' + esc(t('task.edit') || 'Edit') + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
        '<button class="act-btn del" title="' + esc(t('task.del') || 'Delete') + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>' +
        '</div>' +
        (subtasks.length ? '<div class="task-subtasks-list">' + subtasks.map(function(st, i) {
          return '<div class="subtask-row"><label class="subtask-check"><input type="checkbox" data-subtask-idx="' + i + '"' + (st.done ? ' checked' : '') + '><span class="checkmark sub"></span></label><span class="subtask-text' + (st.done ? ' done' : '') + '">' + esc(st.text) + '</span></div>';
        }).join('') + '</div>' : '') +
        '</li>';
    }).join('');

    bindTaskEvents();
    updateStats();
    updateCategoryFilter();
    renderSidebarCounts();
    renderSidebarCategories();
    updateDailyGoal();
  }

  function bindTaskEvents() {
    var list = document.getElementById('taskList');
    if (!list) return;

    list.onclick = function (e) {
      var toggleBtn = e.target.closest('.subtask-toggle');
      if (toggleBtn) {
        var tItem = toggleBtn.closest('.task-item');
        if (tItem) tItem.classList.toggle('expanded');
        return;
      }
      var starBtn = e.target.closest('.act-btn.star');
      if (starBtn) {
        var sItem = starBtn.closest('.task-item');
        if (sItem) {
          var sIdx = todos.findIndex(function(x) { return String(x.id) === String(sItem.dataset.id); });
          if (sIdx !== -1) { todos[sIdx].starred = !todos[sIdx].starred; render(); }
          api('PUT', '/tasks/' + sItem.dataset.id + '/star').then(function(updated) {
            var idx = todos.findIndex(function(x) { return String(x.id) === String(sItem.dataset.id); });
            if (idx !== -1) todos[idx] = updated;
          }).catch(function() { showToast(t('toast.error'), 'error'); loadTasks().then(render); });
        }
        return;
      }
      var editBtn = e.target.closest('.act-btn.edit');
      if (editBtn) { var item = editBtn.closest('.task-item'); if (item) openEditor(item.dataset.id); return; }
      var delBtn = e.target.closest('.act-btn.del');
      if (delBtn) {
        var dItem = delBtn.closest('.task-item');
        if (dItem && confirm(t('confirm.deleteTask'))) {
          var delId = dItem.dataset.id;
          todos = todos.filter(function (x) { return String(x.id) !== String(delId); });
          render(); showToast(t('toast.taskDel'), 'info');
          api('DELETE', '/tasks/' + delId).catch(function () { showToast(t('toast.error'), 'error'); loadTasks().then(render); });
        }
        return;
      }
    };

    list.onchange = function (e) {
      var stCb = e.target.closest('.subtask-check input');
      if (stCb) {
        var stItem = stCb.closest('.task-item');
        if (!stItem) return;
        var stIdx = parseInt(stCb.dataset.subtaskIdx);
        var task = todos.find(function (x) { return String(x.id) === stItem.dataset.id; });
        if (!task || !task.subtasks || !task.subtasks[stIdx]) return;
        task.subtasks[stIdx].done = stCb.checked;
        if (stCb.checked) { awardXP(XP_PER_SUBTASK); }
        render();
        api('PUT', '/tasks/' + task.id, { subtasks: task.subtasks })
          .catch(function () { task.subtasks[stIdx].done = !stCb.checked; render(); showToast(t('toast.error'), 'error'); });
        return;
      }
      var cb = e.target.closest('.task-check');
      if (!cb) return;
      var li = cb.closest('.task-item');
      if (!li) return;
      var id = li.dataset.id;
      var task = todos.find(function (x) { return String(x.id) === String(id); });
      if (!task) return;
      var wasDone = !task.done;
      task.done = !task.done;
      if (task.done && !task.completedOnce) { task.completedOnce = true; awardXP(XP_PER_TASK); updateStreak(); fireConfetti(); }
      if (task.done) { updateDailyGoal(); loadWeeklyStats(); }
      render();
      api('PUT', '/tasks/' + id, { done: task.done })
        .catch(function () { task.done = !task.done; render(); showToast(t('toast.updated'), 'error'); });
    };

    /* Desktop drag */
    var draggedId = null;
    list.ondragstart = function (e) {
      var item = e.target.closest('.task-item');
      if (!item || item.classList.contains('completed')) return;
      draggedId = item.dataset.id;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedId);
    };
    list.ondragend = function (e) {
      draggedId = null;
      list.querySelectorAll('.task-item').forEach(function (el) { el.classList.remove('dragging', 'drag-over'); });
    };
    list.ondragover = function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      var item = e.target.closest('.task-item');
      list.querySelectorAll('.task-item').forEach(function (el) { el.classList.remove('drag-over'); });
      if (item && item.dataset.id !== draggedId) item.classList.add('drag-over');
    };
    list.ondrop = function (e) {
      e.preventDefault();
      e.stopPropagation();
      var targetItem = e.target.closest('.task-item');
      if (!targetItem) return;
      var dropId = targetItem.dataset.id;
      if (!draggedId || draggedId === dropId) return;
      var fromIdx = todos.findIndex(function (x) { return String(x.id) === draggedId; });
      var toIdx = todos.findIndex(function (x) { return String(x.id) === dropId; });
      if (fromIdx === -1 || toIdx === -1) return;
      var moved = todos.splice(fromIdx, 1)[0];
      todos.splice(toIdx, 0, moved);
      draggedId = null;
      render();
      api('PUT', '/tasks/reorder', { orderedIds: todos.map(function (x) { return x.id; }) })
        .catch(function () { loadTasks().then(render); });
    };


  }

  /* ── Task Form ── */
  document.getElementById('taskForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = document.getElementById('taskInput');
    var text = inp.value.trim();
    if (!text) return;
    var tags = (document.getElementById('taskTags').value || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var recurring = document.getElementById('taskRecurring').value || null;
    var tempId = 'tmp_' + Date.now();
    var tempTask = { id: tempId, text: text, done: false, starred: false, priority: document.getElementById('taskPriority').value, dueDate: document.getElementById('taskDueDate').value || null, category: document.getElementById('taskCategory').value || '', tags: tags, recurring: recurring, subtasks: pendingSubtasks.slice(), createdAt: new Date().toISOString() };
    todos.push(tempTask);
    inp.value = '';
    document.getElementById('taskTags').value = '';
    document.getElementById('taskDueDate').value = '';
    pendingSubtasks = [];
    var stList = document.getElementById('subtaskList');
    if (stList) stList.innerHTML = '';
    render();
    showToast(t('toast.taskAdd'), 'success');
    api('POST', '/tasks', {
      text: text,
      priority: tempTask.priority,
      dueDate: tempTask.dueDate,
      category: tempTask.category,
      tags: tags,
      recurring: recurring,
      subtasks: tempTask.subtasks
    }).then(function (task) {
      var idx = todos.findIndex(function(x) { return String(x.id) === tempId; });
      if (idx !== -1) todos[idx] = task;
      render();
    }).catch(function () { todos = todos.filter(function(x) { return String(x.id) !== tempId; }); render(); showToast(t('toast.noTask'), 'error'); });
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
    categories.forEach(function (c) { if (cats.indexOf(c.name) === -1) cats.push(c.name); });
    todos.forEach(function (x) { if (x.category && cats.indexOf(x.category) === -1) cats.push(x.category); });
    cats.sort();
    sel.innerHTML = '<option value="all">' + t('filter.allCat') + '</option>' +
      cats.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
    sel.value = cur || 'all';
  }

  /* ── Sidebar ── */
  var sidebarEl, sidebarMobileOverlay;
  function initSidebar() {
    sidebarEl = document.getElementById('appSidebar');
    sidebarMobileOverlay = document.getElementById('sidebarMobileOverlay');
    if (sidebarMobileOverlay) sidebarMobileOverlay.addEventListener('click', closeSidebar);
  }

  function toggleSidebar() {
    if (!sidebarEl) return;
    var isOpen = sidebarEl.classList.contains('open');
    sidebarEl.classList.toggle('open');
    if (sidebarMobileOverlay) sidebarMobileOverlay.classList.toggle('open');
    if (!isOpen && sidebarEl) sidebarEl.scrollTop = 0;
  }

  function closeSidebar() {
    if (sidebarEl) sidebarEl.classList.remove('open');
    if (sidebarMobileOverlay) sidebarMobileOverlay.classList.remove('open');
  }

  function renderSidebarCounts() {
    var today = new Date(); today.setHours(0,0,0,0);
    var weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
    var weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    var all = todos.length;
    var todayCount = todos.filter(function(x) {
      if (!x.dueDate) return false;
      var d = new Date(x.dueDate); d.setHours(0,0,0,0);
      return d.getTime() === today.getTime();
    }).length;
    var weekCount = todos.filter(function(x) {
      if (!x.dueDate) return false;
      var d = new Date(x.dueDate); d.setHours(0,0,0,0);
      return d >= weekStart && d <= weekEnd;
    }).length;
    var overdue = todos.filter(function(x) { return !x.done && isOverdue(x.dueDate); }).length;
    var starred = todos.filter(function(x) { return x.starred; }).length;
    var completed = todos.filter(function(x) { return x.done; }).length;
    var el = function(id) { return document.getElementById(id); };
    if (el('sbCountAll')) el('sbCountAll').textContent = all;
    if (el('sbCountToday')) el('sbCountToday').textContent = todayCount;
    if (el('sbCountWeek')) el('sbCountWeek').textContent = weekCount;
    if (el('sbCountOverdue')) el('sbCountOverdue').textContent = overdue;
    if (el('sbCountStarred')) el('sbCountStarred').textContent = starred;
    if (el('sbCountCompleted')) el('sbCountCompleted').textContent = completed;
  }

  function renderSidebarCategories() {
    var list = document.getElementById('sbCategoryList');
    if (!list) return;
    list.innerHTML = categories.map(function(cat) {
      var count = todos.filter(function(x) { return x.category === cat.name; }).length;
      return '<div class="sb-cat-item' + (filter.category === cat.name ? ' active' : '') + '" data-name="' + esc(cat.name) + '">' +
        '<span class="sb-cat-dot" style="background:' + esc(cat.color) + '"></span>' +
        '<span class="sb-cat-name">' + esc(cat.name) + '</span>' +
        '<span class="sb-cat-count">' + count + '</span>' +
        '<button class="sb-cat-del" data-id="' + cat.id + '" title="Sil">&times;</button>' +
      '</div>';
    }).join('');
    list.querySelectorAll('.sb-cat-item').forEach(function(el) {
      el.addEventListener('click', function(e) {
        if (e.target.closest('.sb-cat-del')) return;
        var name = el.dataset.name;
        filter.category = filter.category === name ? 'all' : name;
        var sel = document.getElementById('filterCategory');
        if (sel) sel.value = filter.category;
        renderSidebarCategories();
        render();
      });
    });
    list.querySelectorAll('.sb-cat-del').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm(t('confirm.deleteCat'))) {
          api('DELETE', '/categories/' + btn.dataset.id).then(function() {
            categories = categories.filter(function(c) { return String(c.id) !== String(btn.dataset.id); });
            renderSidebarCategories();
            renderCategorySelects();
            updateCategoryFilter();
            showToast(t('toast.catDeleted'), 'info');
          }).catch(function() { showToast(t('toast.error'), 'error'); });
        }
      });
    });
  }

  function loadCategories() {
    return api('GET', '/categories').then(function(data) { categories = data || []; renderSidebarCategories(); renderCategorySelects(); }).catch(function() { categories = []; });
  }

  function renderCategorySelects() {
    var taskSel = document.getElementById('taskCategory');
    var editSel = document.getElementById('editCategory');
    var noneTr = currentLang === 'tr' ? 'Yok' : 'None';
    var opts = '<option value="">' + noneTr + '</option>' + categories.map(function(c) {
      return '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>';
    }).join('');
    if (taskSel) taskSel.innerHTML = opts;
    if (editSel) editSel.innerHTML = opts;
  }

  /* ── Gamification ── */
  var XP_PER_TASK = 10;
  var XP_PER_SUBTASK = 20;
  var XP_LEVEL_BASE = 100;

  function calcLevel(xp) { return Math.floor(xp / XP_LEVEL_BASE) + 1; }
  function calcLevelProgress(xp) { return (xp % XP_LEVEL_BASE); }

  function loadUserProfile() {
    return api('GET', '/user/profile').then(function(data) {
      if (data) userProfile = data;
      renderGamification();
    }).catch(function() { renderGamification(); });
  }

  function saveUserProfile(updates) {
    Object.keys(updates).forEach(function(k) { userProfile[k] = updates[k]; });
    renderGamification();
    return api('PUT', '/user/profile', updates).catch(function() {});
  }

  function awardXP(amount) {
    var newXp = (userProfile.xp || 0) + amount;
    var oldLevel = userProfile.level || 1;
    var newLevel = calcLevel(newXp);
    saveUserProfile({ xp: newXp, level: newLevel });
    showToast(t('toast.xpGain').replace('{n}', amount), 'success');
    if (newLevel > oldLevel) {
      setTimeout(function() { showToast(t('toast.levelUp').replace('{n}', newLevel), 'success'); }, 500);
    }
  }

  function updateStreak() {
    var today = new Date().toISOString().slice(0, 10);
    var last = userProfile.lastcompletiondate;
    if (last === today) return;
    var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = yesterday.toISOString().slice(0, 10);
    var newStreak = (last === yesterdayStr) ? (userProfile.streak || 0) + 1 : 1;
    saveUserProfile({ streak: newStreak, lastcompletiondate: today });
    if (newStreak >= 3) showToast(t('toast.streak'), 'info');
  }

  function renderGamification() {
    var level = userProfile.level || 1;
    var xp = userProfile.xp || 0;
    var streak = userProfile.streak || 0;
    var progress = calcLevelProgress(xp);
    var pct = Math.min(100, (progress / XP_LEVEL_BASE) * 100);
    var el = function(id) { return document.getElementById(id); };
    if (el('sbLevelBadge')) el('sbLevelBadge').textContent = level;
    if (el('sbXpFill')) el('sbXpFill').style.width = pct + '%';
    if (el('sbXpText')) el('sbXpText').textContent = xp + ' XP';
    if (el('sbStreakCount')) el('sbStreakCount').textContent = streak;
  }

  function updateDailyGoal() {
    var today = new Date(); today.setHours(0,0,0,0);
    var doneToday = todos.filter(function(x) {
      if (!x.done) return false;
      var d = new Date(x.updatedAt || x.createdAt); d.setHours(0,0,0,0);
      return d.getTime() === today.getTime();
    }).length;
    var goal = userProfile.dailygoal || 5;
    var pct = Math.min(100, (doneToday / goal) * 100);
    var el = function(id) { return document.getElementById(id); };
    if (el('sbGoalCount')) el('sbGoalCount').textContent = doneToday + '/' + goal;
    if (el('sbGoalFill')) el('sbGoalFill').style.width = pct + '%';
  }

  /* ── Weekly Stats ── */
  function loadWeeklyStats() {
    api('GET', '/stats/weekly').then(function(data) {
      renderWeeklyStats(data);
    }).catch(function() {});
  }

  function renderWeeklyStats(data) {
    var chart = document.getElementById('weeklyChart');
    if (!chart) return;
    var bars = chart.querySelectorAll('.wc-bar-wrap');
    var max = Math.max.apply(null, data.weekStats.concat([1]));
    bars.forEach(function(wrap) {
      var day = parseInt(wrap.dataset.day);
      var val = data.weekStats[day] || 0;
      var pct = (val / max) * 100;
      var bar = wrap.querySelector('.wc-bar');
      if (bar) { bar.style.height = pct + '%'; bar.title = val; }
      var today = new Date().getDay();
      if (day === today) wrap.classList.add('today');
    });
    var msg = document.getElementById('weeklyMsg');
    if (msg) {
      var emojis = ['💪', '🔥', '⭐', '🚀', '🎯', '✨'];
      var emoji = data.total > 10 ? emojis[0] : data.total > 5 ? emojis[1] : data.total > 0 ? emojis[2] : '💪';
      msg.textContent = t('sb.weeklyMsg').replace('{n}', data.total).replace('{emoji}', emoji);
    }
  }

  /* ── Focus Timer (Pomodoro) ── */
  function formatPomoTime(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function setPomoDurDisabled(disabled) {
    var m = document.getElementById('pomoMinus');
    var p = document.getElementById('pomoPlus');
    var inp = document.getElementById('pomoDurInput');
    if (m) m.disabled = disabled;
    if (p) p.disabled = disabled;
    if (inp) inp.disabled = disabled;
  }

  function applyPomoDuration(val) {
    val = Math.max(1, Math.min(120, parseInt(val) || 25));
    pomoState.duration = val;
    var inp = document.getElementById('pomoDurInput');
    if (inp) inp.value = val;
    if (!pomoState.running) {
      pomoState.seconds = val * 60;
      var timeEl = document.getElementById('pomoTime');
      if (timeEl) timeEl.textContent = formatPomoTime(val * 60);
    }
  }

  function pomoStart() {
    if (pomoState.running && !pomoState.paused) {
      clearInterval(pomoState.interval);
      pomoState.paused = true;
      var btn = document.getElementById('pomoStart');
      if (btn) btn.textContent = t('sb.pomo.start');
      var lbl = document.getElementById('pomoLabel');
      if (lbl) lbl.textContent = 'Duraklatildi';
      return;
    }
    if (pomoState.paused) {
      pomoState.paused = false;
      pomoState.running = true;
      var btn2 = document.getElementById('pomoStart');
      if (btn2) btn2.textContent = t('sb.pomo.pause');
      var lbl2 = document.getElementById('pomoLabel');
      if (lbl2) lbl2.textContent = t('sb.pomo.running');
      pomoState.interval = setInterval(pomoTick, 1000);
      return;
    }
    pomoState.running = true;
    pomoState.paused = false;
    pomoState.seconds = pomoState.duration * 60;
    setPomoDurDisabled(true);
    var btn3 = document.getElementById('pomoStart');
    if (btn3) btn3.textContent = t('sb.pomo.pause');
    var lbl3 = document.getElementById('pomoLabel');
    if (lbl3) lbl3.textContent = t('sb.pomo.running');
    pomoState.interval = setInterval(pomoTick, 1000);
  }

  function pomoTick() {
    if (pomoState.paused) return;
    pomoState.seconds--;
    var el = document.getElementById('pomoTime');
    if (el) el.textContent = formatPomoTime(pomoState.seconds);
    if (pomoState.seconds <= 0) {
      clearInterval(pomoState.interval);
      pomoState.running = false;
      pomoState.paused = false;
      pomoState.seconds = pomoState.duration * 60;
      setPomoDurDisabled(false);
      var el2 = document.getElementById('pomoTime');
      if (el2) el2.textContent = formatPomoTime(pomoState.duration * 60);
      var btn = document.getElementById('pomoStart');
      if (btn) btn.textContent = t('sb.pomo.start');
      var lbl = document.getElementById('pomoLabel');
      if (lbl) lbl.textContent = t('sb.pomo.ready');
      showToast(t('toast.pomoDone'), 'success');
    }
  }

  function pomoReset() {
    clearInterval(pomoState.interval);
    pomoState.running = false;
    pomoState.paused = false;
    pomoState.seconds = pomoState.duration * 60;
    setPomoDurDisabled(false);
    var el = document.getElementById('pomoTime');
    if (el) el.textContent = formatPomoTime(pomoState.duration * 60);
    var btn = document.getElementById('pomoStart');
    if (btn) btn.textContent = t('sb.pomo.start');
    var lbl = document.getElementById('pomoLabel');
    if (lbl) lbl.textContent = t('sb.pomo.ready');
  }

  /* ── Confetti ── */
  function fireConfetti() {
    var canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    var particles = [];
    var colors = ['#7c5cff', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    for (var i = 0; i < 60; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -14 - 4,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        life: 1
      });
    }
    var startTime = performance.now();
    function animate(now) {
      var elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = false;
      particles.forEach(function(p) {
        p.x += p.vx;
        p.vy += 0.3;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.life -= 0.012;
        if (p.life <= 0) return;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive && elapsed < 2) requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(animate);
  }

  /* ── Subtask Helpers ── */
  function renderSubtaskList(container, subtasks, isEdit) {
    container.innerHTML = subtasks.map(function(st, i) {
      return '<div class="subtask-item' + (st.done ? ' done' : '') + '" data-idx="' + i + '">' +
        '<label class="task-check subtask-check"><input type="checkbox"' + (st.done ? ' checked' : '') + '><span class="checkmark"></span></label>' +
        '<span class="subtask-text">' + esc(st.text) + '</span>' +
        '<button class="subtask-del" data-idx="' + i + '">&times;</button>' +
      '</div>';
    }).join('');
    container.querySelectorAll('.subtask-check input').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var idx = parseInt(cb.closest('.subtask-item').dataset.idx);
        subtasks[idx].done = cb.checked;
        cb.closest('.subtask-item').classList.toggle('done', cb.checked);
      });
    });
    container.querySelectorAll('.subtask-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.dataset.idx);
        subtasks.splice(idx, 1);
        renderSubtaskList(container, subtasks, isEdit);
      });
    });
  }

  function addSubtask(input, container, subtasks) {
    var val = input.value.trim();
    if (!val) return;
    subtasks.push({ text: val, done: false });
    input.value = '';
    renderSubtaskList(container, subtasks, false);
  }

  /* ── Edit Modal ── */
  function openEditor(id) {
    var task = todos.find(function (x) { return String(x.id) === String(id); });
    if (!task) return;
    editingId = id;
    editingSubtasks = (task.subtasks || []).map(function(s) { return { text: s.text, done: s.done }; });
    document.getElementById('editText').value = task.text;
    document.getElementById('editPriority').value = task.priority || 'medium';
    document.getElementById('editDueDate').value = task.dueDate || '';
    document.getElementById('editCategory').value = task.category || '';
    document.getElementById('editTags').value = (task.tags || []).join(', ');
    document.getElementById('editDone').checked = task.done;
    document.getElementById('editStarred').checked = !!task.starred;
    document.getElementById('editRecurring').value = task.recurring || '';
    var editStList = document.getElementById('editSubtaskList');
    if (editStList) renderSubtaskList(editStList, editingSubtasks, true);
    document.getElementById('editModal').showModal();
    document.getElementById('editText').focus();
  }

  var editFormEl = document.getElementById('editForm');
  if (editFormEl) editFormEl.addEventListener('submit', function (e) {
    e.preventDefault();
    var task = todos.find(function (x) { return String(x.id) === String(editingId); });
    if (!task) return;
    var tags = document.getElementById('editTags').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var newDone = document.getElementById('editDone').checked;
    if (newDone && !task.done && !task.completedOnce) { task.completedOnce = true; awardXP(XP_PER_TASK); updateStreak(); fireConfetti(); }
    var updatedFields = {
      text: document.getElementById('editText').value.trim(),
      done: newDone,
      starred: document.getElementById('editStarred').checked,
      priority: document.getElementById('editPriority').value,
      dueDate: document.getElementById('editDueDate').value || null,
      category: document.getElementById('editCategory').value || '',
      tags: tags,
      recurring: document.getElementById('editRecurring').value || null,
      subtasks: editingSubtasks
    };
    var idx = todos.findIndex(function (x) { return String(x.id) === String(editingId); });
    if (idx !== -1) Object.assign(todos[idx], updatedFields);
    document.getElementById('editModal').close();
    render(); showToast(t('toast.taskEdit'), 'success');
    api('PUT', '/tasks/' + editingId, updatedFields).then(function (updated) {
      var i = todos.findIndex(function (x) { return String(x.id) === String(editingId); });
      if (i !== -1) todos[i] = updated;
    }).catch(function (err) { showToast(err.message || t('toast.error'), 'error'); loadTasks().then(render); });
  });

  var editDeleteBtnEl = document.getElementById('editDeleteBtn');
    if (editDeleteBtnEl) editDeleteBtnEl.addEventListener('click', function () {
    if (!confirm(t('confirm.deleteTask'))) return;
    todos = todos.filter(function (x) { return String(x.id) !== String(editingId); });
    document.getElementById('editModal').close(); render(); showToast(t('toast.taskDel'), 'info');
    api('DELETE', '/tasks/' + editingId).catch(function () { showToast(t('toast.error'), 'error'); loadTasks().then(render); });
  });

  /* ── Modals close ── */
  document.querySelectorAll('.modal-close').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var m = btn.closest('dialog') || btn.closest('.modal-overlay');
      if (m) {
        if (m.classList.contains('modal-overlay')) m.classList.remove('active');
        else m.close();
      }
    });
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
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      var mp2 = document.getElementById('mainPage');
      if (mp2 && mp2.classList.contains('active')) { e.preventDefault(); toggleSidebar(); }
    }
    if (e.key === 'Escape') { closeSidebar(); }
  });

  /* ── Sidebar Events ── */
  var sidebarToggleBtn = document.getElementById('sidebarToggle');
  if (sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', toggleSidebar);

  document.querySelectorAll('.sb-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.sb-filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      filter.quickFilter = btn.dataset.filter;
      render();
    });
  });

  /* ── Add Category ── */
  var sbAddCategoryBtn = document.getElementById('sbAddCategory');
  if (sbAddCategoryBtn) sbAddCategoryBtn.addEventListener('click', function() {
    var name = prompt(t('sb.catName'));
    if (!name || !name.trim()) return;
    var colors = ['#7c5cff', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
    var color = colors[categories.length % colors.length];
    api('POST', '/categories', { name: name.trim(), color: color }).then(function(cat) {
      categories.push(cat);
      renderSidebarCategories();
      renderCategorySelects();
      updateCategoryFilter();
      showToast(t('toast.catAdded'), 'success');
    }).catch(function(err) { showToast(err.message || t('toast.error'), 'error'); });
  });

  /* ── Pomodoro Events ── */
  var pomoStartBtn = document.getElementById('pomoStart');
  var pomoResetBtn = document.getElementById('pomoReset');
  if (pomoStartBtn) pomoStartBtn.addEventListener('click', pomoStart);
  if (pomoResetBtn) pomoResetBtn.addEventListener('click', pomoReset);

  function updatePomoDurDisplay() {
    applyPomoDuration(pomoState.duration);
  }
  var pomoMinusBtn = document.getElementById('pomoMinus');
  var pomoPlusBtn = document.getElementById('pomoPlus');
  var pomoDurInput = document.getElementById('pomoDurInput');
  if (pomoMinusBtn) pomoMinusBtn.addEventListener('click', function() {
    if (pomoState.running) return;
    applyPomoDuration(pomoState.duration - 1);
  });
  if (pomoPlusBtn) pomoPlusBtn.addEventListener('click', function() {
    if (pomoState.running) return;
    applyPomoDuration(pomoState.duration + 1);
  });
  if (pomoDurInput) pomoDurInput.addEventListener('change', function() {
    if (pomoState.running) return;
    applyPomoDuration(this.value);
  });
  if (pomoDurInput) pomoDurInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); if (!pomoState.running) applyPomoDuration(this.value); this.blur(); }
  });

  /* ── Subtask Events (Task Form) ── */
  var subtaskInputEl = document.getElementById('subtaskInput');
  var addSubtaskBtnEl = document.getElementById('addSubtaskBtn');
  var subtaskListEl = document.getElementById('subtaskList');
  if (addSubtaskBtnEl) addSubtaskBtnEl.addEventListener('click', function() {
    if (subtaskInputEl) addSubtask(subtaskInputEl, subtaskListEl, pendingSubtasks);
  });
  if (subtaskInputEl) subtaskInputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); addSubtask(subtaskInputEl, subtaskListEl, pendingSubtasks); }
  });

  /* ── Subtask Events (Edit Modal) ── */
  var editSubtaskInputEl = document.getElementById('editSubtaskInput');
  var editAddSubtaskBtnEl = document.getElementById('editAddSubtaskBtn');
  var editSubtaskListEl = document.getElementById('editSubtaskList');
  if (editAddSubtaskBtnEl) editAddSubtaskBtnEl.addEventListener('click', function() {
    if (editSubtaskInputEl && editSubtaskListEl) addSubtask(editSubtaskInputEl, editSubtaskListEl, editingSubtasks);
  });
  if (editSubtaskInputEl) editSubtaskInputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); addSubtask(editSubtaskInputEl, editSubtaskListEl, editingSubtasks); }
  });

  /* ── Admin ── */
  var adminBtnEl = document.getElementById('adminBtn');
  if (adminBtnEl) adminBtnEl.addEventListener('click', function () { showPage('adminPage', true); loadAdminUsers(); });
  var adminBackBtn = document.getElementById('adminBackBtn');
  if (adminBackBtn) adminBackBtn.addEventListener('click', function () { showPage('mainPage', true); });

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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(function () {});
}

var deferredPrompt = null;
var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
if (isStandalone) {
  var installBtn = document.getElementById('lpInstallBtn');
  if (installBtn) installBtn.classList.add('pwa-installed');
} else {
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var installBtn = document.getElementById('lpInstallBtn');
    if (installBtn) installBtn.classList.remove('pwa-installed');
  });
}

var installBtn = document.getElementById('lpInstallBtn');
if (installBtn) installBtn.addEventListener('click', function () {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
});

window.addEventListener('appinstalled', function () {
  deferredPrompt = null;
  var installBtn = document.getElementById('lpInstallBtn');
  if (installBtn) installBtn.classList.add('pwa-installed');
});
