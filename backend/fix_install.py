import os
import subprocess
import sys

print("🧹 Temizlik başladı: Bozuk SSL ayarları siliniyor...")

# 1. Zehirli ortam değişkenlerini Python hafızasından zorla sil
# Windows'ta ne yazarsa yazsın, bu script çalışırken bunlar yok sayılacak.
keys_to_remove = ['SSL_CERT_FILE', 'REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE']
for key in keys_to_remove:
    if key in os.environ:
        del os.environ[key]
        print(f"   🗑️  {key} değişkeni silindi.")

print("🚀 Yükleme başlatılıyor (Sertifika kontrolleri devre dışı)...")

# 2. Pip'i tertemiz bir ortamda çalıştır
try:
    subprocess.check_call([
        sys.executable, "-m", "pip", "install", 
        "-r", "requirements.txt",
        "--trusted-host", "pypi.org",
        "--trusted-host", "pypi.python.org",
        "--trusted-host", "files.pythonhosted.org"
    ])
    print("\n✅✅✅ BAŞARILI! Tüm paketler yüklendi.")
except subprocess.CalledProcessError:
    print("\n❌ Yükleme sırasında bir hata oluştu.")