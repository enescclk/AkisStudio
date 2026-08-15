# Akış Studio 1.3

VS Code ve Electron ile çalışan çevrimdışı masaüstü diyagram editörü.

## Kurulum

Bilgisayarda Node.js LTS kurulu olmalıdır.

VS Code içinde bu klasörü açıp `Terminal > New Terminal` seçin ve sırayla çalıştırın:

```powershell
npm install
npm start
```

Sonraki açılışlarda yalnızca şunu çalıştırmak yeterlidir:

```powershell
npm start
```

## Dosyalar

- `main.js`: Electron masaüstü penceresi
- `index.html`: uygulamanın arayüzü
- `styles.css`: görünüm
- `renderer.js`: diyagram işlevleri
- `package.json`: proje ve bağımlılık ayarları

Uygulama içindeki projeler tarayıcı depolamasına otomatik kaydedilir. Ayrıca `.akis`, PNG ve SVG dışa aktarımı vardır.

## Yeni özellikler

- Mevcut veya sonradan eklenen kutulara çift tıklayarak kutunun üzerinde metin düzenleme
- `Enter` ile metni kaydetme, `Shift+Enter` ile yeni satır, `Esc` ile iptal
- `Ctrl` basılıyken önce kaynak, sonra hedef kutuya tıklayarak otomatik ok oluşturma
- Otomatik okun kutuların konumuna göre seçilen kenarların tam ortasına bağlanması
- Daha koyu ve okunaklı ince, orta ve ana ızgara çizgileri
- Panel genişlerken şekillerin sabit boyutta kalması ve boşalan satırlara yeni şekillerin gelmesi
- Sol şekil panelinde görünür kaydırma çubuğu ve mouse tekerleğiyle kaydırma
- Dar pencerelerde üst araçların taşmasını engelleyen responsive yerleşim
- Sol şekil panelini `Ctrl+Shift+B` ile açıp kapatma
- Panel kenarını sürükleyerek 200–420 px arasında genişletme; çift tıkla varsayılan genişliğe dönme
- Panel genişliği ve açık/kapalı durumunu sonraki açılış için hatırlama
- Zoom seviyesine göre aralığı değişen üç seviyeli adaptif ızgara
- Uzak görünümde ince çizgileri sadeleştirip ana ızgarayı görünür tutma
- Hafif, açık/koyu temayla uyumlu cam panel efekti
- Windows menü çubuğunda Dosya, Düzen, Görünüm ve Yardım menüleri
- Gerçek Aç, Kaydet ve Farklı Kaydet pencereleri
- Açık, koyu ve sistem teması
- Yazı tipi, punto, kalın, italik, altı çizili ve metin hizalama
- Düz, kesikli, noktalı ve çizgi-nokta bağlantılar
- Düz, eğri ve köşeli bağlantı yolları
- Başlangıç ve bitiş için farklı ok uçları
- Genişletilmiş standart, akış şeması ve genel şekil kütüphanesi
- Seçili şekli kişisel şekil listesine kaydetme
