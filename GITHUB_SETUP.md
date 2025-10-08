# GitHub Entegrasyon Rehberi

## 🎯 Adım 1: GitHub'da Repository Oluşturma

### 1. GitHub'a Giriş Yapın
- [github.com](https://github.com) adresine gidin
- Hesabınıza giriş yapın

### 2. Yeni Repository Oluşturun
- Sağ üstteki `+` simgesine tıklayın
- `New repository` seçeneğini seçin
- **Repository adı**: `BMC-MAINVIEW-PROJECT` (veya tercih ettiğiniz bir ad)
- **Açıklama**: "BMC MainView Project - 4 kişilik ekip çalışma alanı"
- **Görünürlük**:
  - `Private` (Sadece ekip üyelerinin görmesi için)
  - `Public` (Herkese açık ise)
- ⚠️ **ÖNEMLİ**: README, .gitignore veya license dosyası EKLEMEYIN (zaten yerel projede var)
- `Create repository` butonuna tıklayın

## 🔗 Adım 2: Yerel Projeyi GitHub'a Bağlama

GitHub'da repository oluşturduktan sonra, aşağıdaki komutları sırayla çalıştırın:

```bash
# Develop branch'i oluşturun (ekip çalışması için)
git checkout -b develop

# GitHub repository'nizi remote olarak ekleyin (✅ TAMAMLANDI)
git remote add origin https://github.com/leviyosasan/mainframe-monitoring-project.git

# Remote bağlantısını kontrol edin
git remote -v

# Master branch'i gönderin
git checkout master
git push -u origin master

# Develop branch'i gönderin
git checkout develop
git push -u origin develop
```

## 👥 Adım 3: Ekip Üyelerini Davet Etme

### Repository Sahibi İçin:

1. GitHub'da repository sayfasına gidin
2. `Settings` (Ayarlar) sekmesine tıklayın
3. Sol menüden `Collaborators and teams` seçeneğini seçin
4. `Add people` butonuna tıklayın
5. Ekip üyelerinin GitHub kullanıcı adlarını veya e-posta adreslerini girin
6. Her biri için uygun erişim seviyesini seçin:
   - **Admin**: Tam yetki (ayarları değiştirebilir)
   - **Maintain**: Branch koruma kurallarını yönetebilir
   - **Write**: Push/pull yapabilir (önerilen)
   - **Read**: Sadece okuyabilir
7. `Add [username] to this repository` butonuna tıklayın

### Ekip Üyeleri İçin:

1. GitHub e-postanızı kontrol edin
2. Davet linkine tıklayın ve kabul edin
3. Projeyi klonlayın:
```bash
git clone https://github.com/leviyosasan/mainframe-monitoring-project.git
cd mainframe-monitoring-project
git checkout develop
```

## 🛡️ Adım 4: Branch Koruma Kuralları (Önerilen)

Repository sahibi olarak, `main` ve `develop` branch'lerini korumaya alın:

1. Repository ayarlarına gidin
2. `Branches` sekmesini seçin
3. `Add branch protection rule` butonuna tıklayın
4. **Branch name pattern**: `main`
5. Önerilen kurallar:
   - ✅ `Require a pull request before merging`
   - ✅ `Require approvals` (En az 1)
   - ✅ `Require review from Code Owners` (opsiyonel)
   - ✅ `Require status checks to pass before merging` (testler varsa)
6. `Create` butonuna tıklayın
7. Aynı işlemi `develop` branch'i için tekrarlayın

## 📋 Adım 5: Ekip İçi Çalışma Akışı

### Her Ekip Üyesi İçin Günlük Rutin:

```bash
# 1. Güncellemeleri çekin
git checkout develop
git pull origin develop

# 2. Yeni feature branch'i oluşturun
git checkout -b feature/yapacaginiz-is

# 3. Değişikliklerinizi yapın ve commit edin
git add .
git commit -m "feat: yeni özellik açıklaması"

# 4. Branch'inizi GitHub'a gönderin
git push origin feature/yapacaginiz-is

# 5. GitHub'da Pull Request açın
# - develop branch'ine merge edilmek üzere PR oluşturun
# - En az 1 ekip üyesinden review isteyin
# - Yorumları değerlendirin ve gerekli düzeltmeleri yapın
# - Onay aldıktan sonra merge edin
```

## 🚨 Yaygın Sorunlar ve Çözümleri

### Problem: "Permission denied" hatası
**Çözüm**: SSH anahtarınızı GitHub'a ekleyin veya HTTPS kullanın

### Problem: "Conflict" hatası
**Çözüm**:
```bash
git pull origin develop
# Conflict'leri manuel olarak çözün
git add .
git commit -m "fix: conflict çözüldü"
git push origin feature/branch-adi
```

### Problem: "Nothing to commit" mesajı
**Çözüm**: Değişikliklerinizin kaydedildiğinden emin olun ve `git status` ile kontrol edin

## 📞 Yardım

Herhangi bir sorun yaşarsanız:
1. `git status` komutuyla durumu kontrol edin
2. Ekip üyelerinizle iletişime geçin
3. GitHub documentation'a bakın: [docs.github.com](https://docs.github.com)

## ✨ İpuçları

- Sık sık commit yapın (küçük adımlar halinde)
- Açıklayıcı commit mesajları yazın
- Pull Request açmadan önce kodunuzu test edin
- Her gün güncellemeleri çekmeyi unutmayın
- Büyük değişiklikler öncesi ekiple iletişime geçin

