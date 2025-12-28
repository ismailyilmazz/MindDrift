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
MODEL_NAME = "gemini-2.5-pro" 

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

        code_prompt = f"""
        Sen uzman bir Three.js geliştiricisisin.
        HEDEF: "{prediction}" nesnesini temsil eden 3D bir sahne oluştur.
        
        KRİTİK JAVASCRIPT KURALLARI (BU SIRAYI BOZMA):
        1. HTML <head> kısmına IMPORT MAP ekle.
        2. <script type="module"> bloğunu aç.
        3. EN ÜSTE IMPORTLARI YAZ (Bunlar try-catch içinde OLAMAZ!):
           import * as THREE from 'three';
           import {{ OrbitControls }} from 'three/addons/controls/OrbitControls.js';
        4. Importlardan SONRA 'try {{ ... }} catch(e) {{ ... }}' bloğunu başlat.
        5. Tüm sahne kurulumunu (Scene, Camera, Renderer, Object) bu try bloğunun içine yaz.
        
        TEKNİK DETAYLAR:
        - Import Map:
           <script type="importmap">
           {{ "imports": {{ "three": "https://unpkg.com/three@0.160.0/build/three.module.js", "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/" }} }}
           </script>
        - Sahne Arkaplanı: scene.background = new THREE.Color(0x333333);
        - Işıklar: AmbientLight ve DirectionalLight MUTLAKA ekle.
        - Nesne: "{prediction}" nesnesini basit geometrilerle (Group, Box, Sphere, Cylinder) benzeterek çiz. External model yükleme.
        - Animasyon: Nesne kendi etrafında yavaşça dönsün.
        - Hata Yönetimi: catch bloğunda hatayı ekrana bas: document.body.innerHTML = `<h1 style="color:red">${{e.message}}</h1>`;

        BUTONLAR (SOL ÜST):
        1. [DOĞRU BİLDİN!] -> ID: 'btn-confirm' -> window.opener.postMessage({{type: 'CONFIRMED', prediction: '{prediction}', html: document.documentElement.outerHTML}}, '*'); window.close();
        2. [YANLIŞ - 5 SORU DAHA] -> ID: 'btn-retry' -> window.opener.postMessage({{type: 'RETRY_5_QUESTIONS'}}, '*'); window.close();
        3. [ÇIKIŞ] -> ID: 'btn-quit' -> window.close();

        ÇIKTI FORMATI:
        Sadece saf HTML kodu ver. Markdown (```html) kullanma.
        """
        
        code_res = model.generate_content(code_prompt)
        clean_code = code_res.text.replace("```html", "").replace("```", "").strip()
        
        return {"prediction": prediction, "html_code": clean_code}

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