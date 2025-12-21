import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import traceback

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("⚠️  GEMINI_API_KEY .env dosyasında bulunmuyor!")
else:
    print(f"✅ API Key yüklendi: {API_KEY[:10]}...")

genai.configure(api_key=API_KEY)
MODEL_NAME = "gemini-2.5-pro"  # Doğru model

def generate_prediction_and_code(answers: list):
    """
    1. Cevapları analiz eder ve Tahmin Yapar.
    2. Tahmin edilen nesneyi Three.js koduyla yazar.
    """
    try:
        print("🔄 AI Tahmin Modeli başlatılıyor...")
        model = genai.GenerativeModel(MODEL_NAME)
        
        # ADIM 1: Tahmin
        guess_prompt = f"""
Kullanıcının sorulara verdiği cevaplar: {answers}

GÖREV: Sadece nesnenin adını tahmin et. BAŞKA HİÇBİR ŞEY YAZMA.
Örnek cevaplar: "Araba", "Kalem", "Köpek", "Bilgisayar"

CEVAP (sadece nesne adı):"""
        
        print("🤖 Tahmin yapılıyor...")
        guess_res = model.generate_content(guess_prompt)
        prediction = guess_res.text.strip()
        print(f"✅ AI Tahmini: {prediction}")

        # ADIM 2: HTML Kod Üret
        code_prompt = f"""Sana "{prediction}" nesnesini temsil eden bir Three.js 3D sahne HTML kodu yazacaksın.

KURALLAR:
1. Sadece HTML döndür, Markdown kullanma
2. Import map'i kullan:
```
<script type="importmap">
{{"imports": {{"three": "https://unpkg.com/three@r128/build/three.module.js"}}}}
</script>
```
3. Basit geometriler kullan (Box, Sphere, Cylinder)
4. Nesneyi rotate et (animasyon)
5. İyi aydınlatma ekle
6. Siyah arka plan
7. Hata mesajlarını ekrana bas

HTML KODUNUSadece HTML ver:"""

        print("📝 HTML Kodu üretiliyor...")
        code_res = model.generate_content(code_prompt)
        html_code = code_res.text.strip()
        
        # Markdown markers'ı kaldır
        if html_code.startswith("```html"):
            html_code = html_code[7:]
        if html_code.startswith("```"):
            html_code = html_code[3:]
        if html_code.endswith("```"):
            html_code = html_code[:-3]
        html_code = html_code.strip()
        
        print(f"✅ HTML Kodu Oluşturuldu ({len(html_code)} karakter)")
        return {"prediction": prediction, "html_code": html_code}

    except Exception as e:
        print(f"❌ AI Hatası: {e}")
        traceback.print_exc()
        return {
            "prediction": "Hata", 
            "html_code": f"""<html><body style="background:#000;color:red;font-family:Arial">
<h1>❌ Hata Oluştu</h1>
<p>{str(e)}</p>
</body></html>"""
        }

def generate_followup_questions(answers: list):
    try:
        print("🔄 5 Yeni Soru üretiliyor...")
        model = genai.GenerativeModel(MODEL_NAME)
        
        prompt = f"""Kullanıcının cevapları: {answers}

5 YENİ ve AYIRT EDİCİ soru üret. Cevapları JSON formatında döndür.

FORMAT (sadece JSON):
{{"questions": [{{"id": 1, "text": "Soru 1?"}}, {{"id": 2, "text": "Soru 2?"}}]}}

JSON:"""
        
        response = model.generate_content(prompt)
        
        # Markdown cleanup
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        result = json.loads(text)
        print(f"✅ {len(result.get('questions', []))} Yeni Soru Üretildi")
        return result
        
    except Exception as e:
        print(f"❌ Soru Üretme Hatası: {e}")
        traceback.print_exc()
        return {"questions": [{"id": 999, "text": "Bağlantı hatası - lütfen tekrar deneyin"}]}