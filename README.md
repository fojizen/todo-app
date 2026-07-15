<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/SQLite-sql.js-003B57?logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen" alt="Status">
</p>

<h1 align="center">Todo App</h1>

<p align="center">
  Modern, guvenli ve estetik bir gorev yonetimi uygulamasi.<br>
  Vanilla JS frontend + Express.js backend + SQLite veritabani.
</p>

<p align="center">
  <a href="#ozellikler">Ozellikler</a> &bull;
  <a href="#ekran-goruntuleri">Ekran Goruntuleri</a> &bull;
  <a href="#kurulum">Kurulum</a> &bull;
  <a href="#api-referansi">API</a>
</p>

---

## Ekran Goruntuleri

> Asagidaki goruntuleri kendi screenshot'larinizla degistirin.
> `screenshots/` klasorune PNG/JPG olarak yukleyin.

### Landing Page
<p align="center">
  <img src="screenshots/homepage.png" width="800" alt="Landing Page" />
</p>

### Ozellikler
<p align="center">
  <img src="screenshots/features.png" width="800" alt="Features" />
</p>

### Login / Register
<p align="center">
  <img src="screenshots/login.png" width="800" alt="Login Page" />
</p>

### Gorev Yonetimi
<p align="center">
  <img src="screenshots/MyTasks.png" width="800" alt="Task Management" />
</p>

---

## Ozellikler

### Gorev Yonetimi
- Gorev ekleme, duzenleme, silme
- Gorev durumu degistirme (checkbox)
- Oncelik belirleme: Dusuk, Orta, Yuksek
- Bitis tarihi ekleme (gecikmis gorevler kirmizi ile isaretlenir)
- Kategoriler: Is, Kisisel, Alisveris, Saglik, Egitim
- Etiket sistemi (virgulle ayrilmis)
- Surukle & birak ile siralama
- Filtreleme: durum, oncelik, kategori, arama
- Siralama: tarih, oncelik, olusturma, siralamaya gore
- Tamamlanan gorevleri toplu silme

### Kullanici Sistemi
- Kayit olma (kullanici adi musaitlik kontrolu, e-posta dogrulama)
- Giris yapma
- Oturum yonetimi (JWT, 7 gun sure)
- Guvenli sifre depolama (bcrypt, 12 rounds)
- Sayfa yenileme durumunda son sayfayi hatirlama

### Admin Paneli
- Kullanici listesi (ID, kullanici adi, e-posta, rol, durum, son giris, gorev sayisi)
- Kullanici duzenleme (kullanici adi, e-posta, sifre, rol, ban durumu)
- Kullanici banlama / ban kaldirma
- Kullanici silme (tum gorevleriyle birlikte)
- Kendini silme engeli
- Rol yonetimi: admin / user

### Tasarim & Tema
- Koyu / Acik / Sistem temasi
- Partikul animasyonlu arka plan (Canvas API)
- Login sayfasinda animasyonlu orb, grid ve kod snippet'leri
- Glassmorphism efektleri
- Responsive tasarim (mobil, tablet, desktop, TV)
- Zoom uyumlu layout
- TR / EN dil destegi
- Sayfa gecis animasyonlari
- Gelistirilmis secenekler paneli (modern select, date picker, tag input)

### Guvenlik
- Rate limiting (login: 15/dk, register: 10/15dk)
- Brute force korumasi (5 basarisiz giris → 15 dk kilit)
- Guvenlik headerlari: X-Content-Type-Options, X-Frame-Options: DENY, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- CORS sinirlamasi (sadece izin verilen origin'ler)
- JWT token ile yetkilendirme (7 gun sure)
- Girdi dogrulama (tip, uzunluk, regex)
- XSS korumasi (HTML encoding, attribute escaping)
- SQL injection korumasi (prepared statements)

---

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES5+) |
| Backend | Express.js 5.x |
| Veritabani | SQLite (sql.js WASM) |
| Kimlik Dogrulama | JWT (jsonwebtoken) |
| Sifreleme | bcryptjs |
| Styling | Custom CSS (CSS Variables, Glassmorphism, Animasyonlar) |
| Animasyonlar | Canvas API (partikuller), CSS Animasyonlar |

---

## Kurulum

### On kosullar
- [Node.js](https://nodejs.org/) 18+ (test edilmis: 24.x)
- npm

### Adimlar

```bash
# Repositoryi klonla
git clone https://github.com/fojizen/todo-app.git
cd todo-app

# Bagimliliklari yukle
npm install

# Serveri baslat
node server.js
```

Sunucu varsayilan olarak `http://localhost:3000` adresinde baslar.

### Varsayilan Giris

| Kullanici | Sifre | Rol |
|-----------|-------|-----|
| `admin` | `fıj9823r82fkowpefpowflwfw211dawdFDQ` | admin |

> Uretim ortaminda varsayilan sifreyi degistirmeyi unutmayin.

---

## Proje Yapisi

```
todo-app/
├── server.js          # Express backend, API rotalari, DB yardimcilari
├── app.js             # Frontend JavaScript (IIFE, API, UI, admin paneli)
├── index.html         # Ana HTML sayfasi (landing, login, main, admin, modallar)
├── styles.css         # CSS stilleri (tema, responsive, animasyonlar)
├── package.json       # Bagimliliklar ve scriptler
├── screenshots/       # Ekran goruntuleri (GitHub icin)
│   ├── homepage.png
│   ├── features.png
│   ├── login.png
│   └── MyTasks.png
└── data/
    ├── todo.sqlite    # SQLite veritabani (otomatik olusturulur)
    └── .jwt_secret    # JWT anahtari (otomatik olusturulur)
```

---

## API Referansi

Tum API istekleri `/api` on ekini gerektirir.

### Kimlik Dogrulama

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| `POST` | `/api/login` | Giris yapma |
| `POST` | `/api/register` | Kayit olma |
| `GET` | `/api/check-username/:username` | Kullanici adi musaitlik kontrolu |
| `GET` | `/api/me` | Mevcut kullanici bilgisi (token gerekli) |

### Gorevler (token gerekli)

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| `GET` | `/api/tasks` | Tum gorevleri listele |
| `POST` | `/api/tasks` | Yeni gorev olustur |
| `PUT` | `/api/tasks/:id` | Gorevi guncelle |
| `DELETE` | `/api/tasks/:id` | Gorevi sil |
| `PUT` | `/api/tasks/reorder` | Gorevleri yeniden sirala |

### Admin (admin token gerekli)

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| `GET` | `/api/admin/users` | Tum kullanicilari listele |
| `GET` | `/api/admin/users/:id` | Kullanici detayi |
| `PUT` | `/api/admin/users/:id` | Kullanici guncelle (rol, ban, sifre) |
| `DELETE` | `/api/admin/users/:id` | Kullanici sil |

---

## Cevresel Degiskenler

| Degisken | Aciklama | Varsayilan |
|----------|----------|------------|
| `PORT` | Sunucu portu | `3000` |
| `JWT_SECRET` | JWT imza anahtari | Otomatik olusturulur (dosyaya kaydedilir) |
| `ALLOWED_ORIGINS` | Izin verilen origin'ler (virgullu) | `http://localhost:3000,http://127.0.0.1:3000` |

---

## Veritabani

### users

| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | INTEGER | Anahtar, otomatik artan |
| username | TEXT | Benzersiz kullanici adi |
| email | TEXT | E-posta adresi |
| passwordHash | TEXT | bcrypt ile hashlenmis sifre |
| role | TEXT | `admin` veya `user` |
| banned | INTEGER | 0: aktif, 1: banli |
| lastLogin | TEXT | Son giris tarihi |
| createdAt | TEXT | Kayit tarihi |

### tasks

| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | INTEGER | Anahtar, otomatik artan |
| userId | INTEGER | Kullanici ID (FK) |
| text | TEXT | Gorev metni |
| done | INTEGER | 0: bekliyor, 1: tamamlandi |
| priority | TEXT | `low`, `medium`, `high` |
| dueDate | TEXT | Bitis tarihi (YYYY-MM-DD) |
| category | TEXT | Kategori adi |
| tags | TEXT | JSON array olarak etiketler |
| itemOrder | INTEGER | Siralama degeri |
| createdAt | TEXT | Olusturma tarihi |
| updatedAt | TEXT | Guncelleme tarihi |

---

## Guvenlik

- **Sifreleme:** bcrypt (12 rounds) ile sifre hashleme
- **Token:** JWT 7 gun sure, HS256 imza
- **Rate Limiting:** IP bazli istek sinirlamasi
- **Brute Force:** 5 basarisiz giris denemesinden sonra 15 dakika kilit
- **Header'lar:** Clickjacking, MIME sniffing, XSS korumasi
- **Girdi Dogrulama:** Sunucu tarafinda tip, uzunluk ve format kontrolu
- **Prepared Statements:** SQL injection onleme
- **HTML Encoding:** XSS onleme icin cikti temizleme

---

## Lisans

MIT License. Detaylar icin [LICENSE](LICENSE) dosyasina bakin.

<p align="center">
  <sub>&copy; 2026 fojizen. Tum haklari saklidir.</sub>
</p>
