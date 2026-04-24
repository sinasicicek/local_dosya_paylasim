Bu uygulama bir Node.js sunucusu gerektirdiği için, sunucunuzda çalıştırılabilecek şekilde hazırladım. İşte oluşturduğum dosyalar:

Proje Yapısı
/workspace/file-manager/
├── server.js          # Backend sunucu
├── package.json       # Bağımlılıklar
├── public/
│   ├── index.html     # Ana sayfa
│   ├── style.css      # Still
│   └── script.js      # JavaScript
└── uploads/           # Yüklenen dosyalar buraya kaydedilir
Kurulum ve Çalıştırma
Sunucunuzda çalıştırmak için:

bash
cd /workspace/file-manager
npm install
npm start
Sunucu başladığında http://localhost:3000 adresinden erişebilirsiniz.

Özellikler
Dosya listeleme: Tüm dosyaları tarihe göre sıralı gösterir
Dosya yükleme: Sürükle-bırak veya tıkla-yükle desteği
Dosya indirme: Tek tıkla indirme
Dosya silme: Güvenli silme onayı ile
Ortam Değişkenleri
bash
# Port numarası (varsayılan: 3000)
PORT=3000

# Dosyaların kaydedileceği dizin (varsayılan: ./uploads)
UPLOAD_DIR=/path/to/your/uploads
Örnek Kullanım
bash
# Üretim sunucusunda çalıştırma
PORT=8080 UPLOAD_DIR=/var/www/uploads npm start
Önemli Not: Bu uygulama gerçek dosya işlemleri için backend gerektirdiğinden, doğrudan tarayıcıda çalışmaz. Yukarıdaki komutlarla kendi sunucunuzda çalıştırabilirsiniz.

file-manager/package.json
