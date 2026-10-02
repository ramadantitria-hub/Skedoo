# Panduan & Aturan Pengembangan Skedoo

## 🔄 Aturan Sinkronisasi GitHub
Setiap kali akan melakukan perubahan atau penambahan fitur:
1. **Wajib Cek Pembaruan di GitHub Terlebih Dahulu**:
   Sebelum mengedit atau membuat berkas baru, selalu jalankan pemeriksaan ke repositori remote:
   ```bash
   git fetch origin
   git status
   ```
2. **Tarik Perubahan Terbaru (Jika Ada)**:
   Jika remote memiliki *commit* baru yang belum ada di lokal, lakukan sinkronisasi:
   ```bash
   git pull origin main
   ```
3. **Commit & Push**:
   Setelah perubahan selesai diimplementasikan dan diverifikasi, lakukan *commit* dengan pesan yang deskriptif dan unggah kembali ke GitHub:
   ```bash
   git push origin main
   ```
