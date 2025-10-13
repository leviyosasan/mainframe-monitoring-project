# BMC MainView Project

Modern, ölçeklenebilir ve profesyonel seviyede full-stack web uygulaması.

## 🏗️ Proje Yapısı

```
BMC MAINVIEW PROJECT/
├── backend/              # Node.js/Express.js API
│   ├── src/
│   │   ├── config/      # Yapılandırma dosyaları
│   │   ├── controllers/ # Request handler'lar
│   │   ├── middleware/  # Custom middleware'ler
│   │   ├── models/      # Database modelleri (Mongoose)
│   │   ├── routes/      # API route tanımlamaları
│   │   ├── services/    # İş mantığı katmanı
│   │   ├── utils/       # Yardımcı fonksiyonlar
│   │   ├── validators/  # Input validation
│   │   ├── app.js       # Express app konfigürasyonu
│   │   └── server.js    # Server başlatma
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
└── frontend/            # React Frontend
    ├── src/
    │   ├── components/  # Reusable bileşenler
    │   ├── hooks/       # Custom React hooks
    │   ├── pages/       # Sayfa bileşenleri
    │   ├── services/    # API servisleri
    │   ├── store/       # State management (Zustand)
    │   ├── utils/       # Yardımcı fonksiyonlar
    │   ├── App.jsx      # Ana uygulama
    │   ├── main.jsx     # Entry point
    │   └── index.css    # Global stiller
    ├── .env.example
    ├── .gitignore
    ├── package.json
    ├── vite.config.js
    └── README.md
```

## 🚀 Teknolojiler

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Rate Limiting** - API protection

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router v6** - Routing
- **Zustand** - State management
- **React Query** - Data fetching
- **React Hook Form** - Form management
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## 📦 Kurulum

### Gereksinimler

- Node.js v16 veya üzeri
- MongoDB v5 veya üzeri
- npm veya yarn

### Backend Kurulumu

```bash
# Backend klasörüne git
cd backend

# Dependencies yükle
npm install

# Environment değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenle

# MongoDB'nin çalıştığından emin ol

# Development modunda başlat
npm run dev

# Production modunda başlat
npm start
```

Backend `http://localhost:5000` adresinde çalışacaktır.

### Frontend Kurulumu

```bash
# Frontend klasörüne git
cd frontend

# Dependencies yükle
npm install

# Environment değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenle

# Development server başlat
npm run dev

# Production build
npm run build

# Production preview
npm run preview
```

Frontend `http://localhost:3000` adresinde çalışacaktır.

## 🔐 Authentication Flow

1. Kullanıcı kayıt olur veya giriş yapar
2. Backend JWT access token ve refresh token üretir
3. Token'lar frontend'de Zustand store ve localStorage'da saklanır
4. Her API isteğinde access token Authorization header'ına eklenir
5. Token süresi dolduğunda otomatik olarak refresh token ile yenilenir
6. Refresh token geçersiz ise kullanıcı login sayfasına yönlendirilir

## 🛡️ Güvenlik Özellikleri

- JWT based authentication
- Password hashing with bcrypt
- HTTP security headers (Helmet)
- CORS protection
- Rate limiting
- Input validation & sanitization
- Protected routes
- Role-based access control (RBAC)
- XSS protection
- SQL/NoSQL injection prevention

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/refresh` - Token yenileme
- `POST /api/auth/logout` - Çıkış yap
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Users (Admin)
- `GET /api/users` - Tüm kullanıcılar
- `GET /api/users/:id` - Kullanıcı detayı
- `POST /api/users` - Yeni kullanıcı
- `PUT /api/users/:id` - Kullanıcı güncelle
- `DELETE /api/users/:id` - Kullanıcı sil
- `PUT /api/users/:id/password` - Şifre değiştir

Detaylı API dokümantasyonu için `backend/README.md` dosyasına bakınız.

## 🎨 Frontend Sayfaları

### Public Routes
- `/login` - Giriş sayfası
- `/register` - Kayıt sayfası

### Protected Routes
- `/dashboard` - Ana dashboard
- `/users` - Kullanıcı yönetimi (Admin)
- `/profile` - Kullanıcı profili
- `/settings` - Ayarlar

## 🔌 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bmc_mainview
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Testing

```bash
# Backend testleri
cd backend
npm test

# Frontend testleri
cd frontend
npm test
```

## 📖 Dokümantasyon

- [Backend README](./backend/README.md) - Backend detaylı dokümantasyon
- [Frontend README](./frontend/README.md) - Frontend detaylı dokümantasyon
- [Contributing](./CONTRIBUTING.md) - Katkıda bulunma rehberi
- [GitHub Setup](./GITHUB_SETUP.md) - GitHub kurulum rehberi

## 🎯 Özellikler

### ✅ Tamamlanan
- [x] Backend API yapısı
- [x] Authentication & Authorization
- [x] User management
- [x] Frontend React yapısı
- [x] Responsive design
- [x] Protected routes
- [x] State management
- [x] Form validation
- [x] Error handling
- [x] Toast notifications

### 🚧 Geliştirme Aşamasında
- [ ] Dashboard analytics
- [ ] Settings page
- [ ] Email verification
- [ ] Password reset
- [ ] File upload
- [ ] Advanced search & filtering
- [ ] Pagination improvements
- [ ] Unit & integration tests
- [ ] API documentation (Swagger)
- [ ] Docker containerization

## 🏃 Hızlı Başlangıç

### Tüm projeyi aynı anda başlatmak için:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen [CONTRIBUTING.md](./CONTRIBUTING.md) dosyasını okuyun.

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing`)
5. Pull Request açın

## 👥 Takım

- Backend Developer
- Frontend Developer
- Full Stack Developer

## 📝 Notlar

- Proje development aşamasındadır
- Production ortamına geçmeden önce environment değişkenlerini güncellemeyi unutmayın
- JWT_SECRET değerini güvenli bir değerle değiştirin
- MongoDB connection string'ini production veritabanınıza güncelleyin

## 📄 License

MIT License

## 📞 İletişim

Sorularınız için issue açabilir veya pull request gönderebilirsiniz.

---

**Happy Coding! 🚀**
