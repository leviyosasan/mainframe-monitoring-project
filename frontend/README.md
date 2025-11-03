# BMC MainView - Frontend

Modern ve responsive React frontend uygulaması.

## 🏗️ Mimari

```
frontend/
├── src/
│   ├── components/       # Reusable bileşenler
│   │   ├── Auth/        # Authentication bileşenleri
│   │   ├── Common/      # Ortak bileşenler (Button, Input, vb.)
│   │   └── Layout/      # Layout bileşenleri
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Sayfa bileşenleri
│   ├── services/        # API servisleri
│   ├── store/           # State management (Zustand)
│   ├── utils/           # Yardımcı fonksiyonlar
│   ├── App.jsx          # Ana uygulama
│   ├── main.jsx         # Entry point
│   └── index.css        # Global stiller
├── public/
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🚀 Özellikler

- ✅ Modern React 18
- ✅ Vite - Hızlı build tool
- ✅ React Router v6 - Routing
- ✅ Zustand - State management
- ✅ React Query - Data fetching
- ✅ React Hook Form - Form yönetimi
- ✅ Tailwind CSS - Styling
- ✅ Axios - HTTP client
- ✅ Toast notifications
- ✅ Protected routes
- ✅ JWT authentication
- ✅ Responsive design
- ✅ Path aliases

## 📦 Kurulum

### Gereksinimler

- Node.js v16 veya üzeri
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

3. Development server'ı başlatın:
```bash
npm run dev
```

4. Production build:
```bash
npm run build
```

5. Production preview:
```bash
npm run preview
```

## 🎨 Sayfalar

### Public Pages
- `/login` - Giriş sayfası
- `/register` - Kayıt sayfası

### Protected Pages
- `/dashboard` - Ana dashboard
- `/users` - Kullanıcı yönetimi (Admin)
- `/profile` - Kullanıcı profili
- `/settings` - Ayarlar

## 🔐 Authentication

Uygulama JWT tabanlı authentication kullanır:

1. Kullanıcı giriş yapar
2. Access token ve refresh token alınır
3. Token'lar Zustand store'da ve localStorage'da saklanır
4. Her API isteğinde access token otomatik eklenir
5. Token süresi dolduğunda otomatik yenilenir

## 🎯 State Management

### Zustand Store

```javascript
// Auth Store
useAuthStore() // Authentication state
  - user
  - accessToken
  - refreshToken
  - isAuthenticated
  - setAuth()
  - logout()
```

## 🔌 API Services

```javascript
// Auth Service
authService.login(email, password)
authService.register(data)
authService.logout()
authService.getMe()

// User Service
userService.getAllUsers(page, limit)
userService.getUserById(userId)
userService.createUser(data)
userService.updateUser(userId, data)
userService.deleteUser(userId)
```

## 🪝 Custom Hooks

```javascript
// Authentication
useAuth()
  - login()
  - register()
  - logout()
  - currentUser
  - isLoading

// Users
useUsers(page, limit)
  - users
  - pagination
  - createUser()
  - updateUser()
  - deleteUser()
  - isLoading
```

## 🎨 Styling

Uygulama Tailwind CSS kullanır. Custom utility class'lar:

```css
.btn - Temel button
.btn-primary - Primary button
.btn-secondary - Secondary button
.btn-danger - Danger button
.input - Input field
.label - Form label
.card - Card container
.error-text - Error message
```

## 📱 Responsive Design

- Mobile-first yaklaşım
- Breakpoints:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px

## 🧪 Path Aliases

```javascript
@/ -> src/
@components/ -> src/components/
@pages/ -> src/pages/
@services/ -> src/services/
@hooks/ -> src/hooks/
@store/ -> src/store/
@utils/ -> src/utils/
@assets/ -> src/assets/
```

## 📝 Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

## 🌐 Proxy Configuration

Development'ta API istekleri `/api` prefix'i ile backend'e proxy edilir:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing`)
5. Pull Request açın

## 📄 License

MIT

