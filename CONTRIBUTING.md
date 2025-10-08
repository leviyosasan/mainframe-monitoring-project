# Katkıda Bulunma Rehberi

Bu projeye katkıda bulunmak istediğiniz için teşekkürler! 🎉

## Ekip İçi Çalışma Kuralları

### 1. Repository'yi İlk Kez Klonlama
```bash
git clone [repository-url]
cd "BMC MAINVIEW PROJECT"
```

### 2. Güncel Kalın
Her zaman çalışmaya başlamadan önce değişiklikleri çekin:
```bash
git checkout develop
git pull origin develop
```

### 3. Yeni Özellik/Düzeltme İçin Branch Oluşturun
```bash
# Yeni özellik için
git checkout -b feature/ozellik-adi

# Hata düzeltme için
git checkout -b bugfix/hata-adi
```

### 4. Değişikliklerinizi Yapın
- Küçük ve anlamlı commit'ler atın
- Her commit bir mantıksal değişikliği temsil etmeli
- Commit mesajlarını açıklayıcı yazın

### 5. Değişiklikleri Commit Edin
```bash
git add .
git commit -m "feat: yeni özellik açıklaması"
```

### 6. Branch'inizi Gönderin
```bash
git push origin feature/ozellik-adi
```

### 7. Pull Request Oluşturun
- GitHub'da Pull Request açın
- Değişikliklerinizi detaylı açıklayın
- En az 1 ekip üyesinden review isteyin
- Tüm testlerin geçtiğinden emin olun

## Branch Stratejisi

- **main**: Production-ready kod. Sadece test edilmiş ve onaylanmış kod buraya merge edilir.
- **develop**: Geliştirme branch'i. Tüm yeni özellikler buraya merge edilir.
- **feature/[ad]**: Yeni özellikler için
- **bugfix/[ad]**: Hata düzeltmeleri için
- **hotfix/[ad]**: Acil production düzeltmeleri için

## Kod Review Süreci

1. Pull Request oluşturun
2. En az 1 ekip üyesinden onay alın
3. Tüm yorumlar çözüldükten sonra merge edin
4. Merge sonrası branch'i silin

## Conflict Çözümü

Eğer conflict oluşursa:
```bash
git checkout develop
git pull origin develop
git checkout feature/ozellik-adi
git merge develop
# Conflict'leri manuel olarak çözün
git add .
git commit -m "fix: conflict çözüldü"
git push origin feature/ozellik-adi
```

## İletişim

Herhangi bir sorunuz olursa ekip ile iletişime geçin!

