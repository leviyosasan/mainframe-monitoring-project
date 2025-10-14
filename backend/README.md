# BMC MainView - Backend API

Modern ve ölçeklenebilir Node.js/Express.js REST API.

## 🏗️ Mimari

Proje, katmanlı mimari prensiplerine göre yapılandırılmıştır:

```
backend/
├── src/
│   ├── config/          # Yapılandırma dosyaları
│   ├── controllers/     # Request handler'lar
│   ├── middleware/      # Custom middleware'ler
│   ├── models/          # Database modelleri (Mongoose)
│   ├── routes/          # API route tanımlamaları
│   ├── services/        # İş mantığı katmanı
│   ├── utils/           # Yardımcı fonksiyonlar
│   ├── validators/      # Input validation
│   ├── app.js           # Express app konfigürasyonu
│   └── server.js        # Server başlatma
├── .env.example         # Environment değişkenleri örneği
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Özellikler

- ✅ RESTful API tasarımı
- ✅ JWT tabanlı authentication
- ✅ Rol bazlı yetkilendirme (RBAC)
- ✅ Request validation (express-validator)
- ✅ Error handling
- ✅ Security best practices (Helmet, CORS, Rate Limiting)
- ✅ MongoDB/Mongoose ORM
- ✅ Service layer pattern
- ✅ Async/await error handling
- ✅ Logging
- ✅ Environment based configuration

## 📦 Kurulum

### Gereksinimler

- Node.js v16 veya üzeri
- MongoDB v5 veya üzeri
- npm veya yarn

### Adımlar

1. Dependencies'leri yükleyin:
```bash
npm install
```

2. Environment değişkenlerini ayarlayın:
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

3. MongoDB'nin çalıştığından emin olun

4. Development modunda başlatın:
```bash
npm run dev
```

5. Production modunda başlatın:
```bash
npm start
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/auth/register` | Yeni kullanıcı kaydı | ❌ |
| POST | `/api/auth/login` | Kullanıcı girişi | ❌ |
| POST | `/api/auth/refresh` | Token yenileme | ❌ |
| POST | `/api/auth/logout` | Çıkış yap | ✅ |
| GET | `/api/auth/me` | Mevcut kullanıcı bilgisi | ✅ |

### Users

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/users` | Tüm kullanıcılar | ✅ Admin |
| GET | `/api/users/:id` | Kullanıcı detayı | ✅ |
| POST | `/api/users` | Yeni kullanıcı | ✅ Admin |
| PUT | `/api/users/:id` | Kullanıcı güncelle | ✅ |
| DELETE | `/api/users/:id` | Kullanıcı sil | ✅ Admin |
| PUT | `/api/users/:id/password` | Şifre değiştir | ✅ |

## 🔐 Authentication

API, JWT (JSON Web Token) tabanlı authentication kullanır.

### Login Example:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response:

```json
{
  "status": "success",
  "message": "Giriş başarılı",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Protected Requests:

```bash
GET /api/users/123
Authorization: Bearer <accessToken>
```

## 🛡️ Security

- **Helmet**: HTTP header güvenliği
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API kötüye kullanım koruması
- **JWT**: Token based authentication
- **bcrypt**: Password hashing
- **Input Validation**: express-validator

## 📝 Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bmc_mainview
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:3000
```

## 🧪 Testing

```bash
npm test
```

## 📚 API Documentation

Server çalıştığında şu endpoint'ten API bilgilerine ulaşabilirsiniz:
- Base: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/health`

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing`)
5. Pull Request açın

## 📄 License

MIT

