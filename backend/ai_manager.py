import os
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=API_KEY)
MODEL_NAME = "gemini-2.5-flash" 

async def generate_prediction_and_code(answers: list):
    """
    1. Cevapları analiz eder ve Tahmin Yapar.
    2. Tahmin edilen nesneyi Three.js koduyla yazar (Import Map kullanarak).
    """
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        
        guess_prompt = f"""
        GÖREV: Bir tahmin oyununun yapay zekasısın.
        Kullanıcının sorulara verdiği cevaplar: {answers}
        
        KURALLAR:
        1. Sadece FİZİKSEL, SOMUT nesneler veya KARAKTERLER tahmin et (Soyut kavramlar yasak).
        2. Çıktı olarak sadece nesnenin ismini ver. Başka hiçbir şey yazma.
        
        TAHMİN (Tek kelime veya kısa öbek):
        """
        guess_res = await model.generate_content_async(guess_prompt)
        prediction = guess_res.text.strip()
        print(f"🤖 AI Tahmini: {prediction}")

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
        - Sadece 1 buton olacak: [ÇIKIŞ] -> ID: 'btn-quit' -> window.close();
        - Başka buton EKLEME!

        ÇIKTI FORMATI:
        Sadece saf HTML kodu ver. Markdown (```html) kullanma.
        """
        
        code_res = await model.generate_content_async(code_prompt)
        clean_code = code_res.text.replace("```html", "").replace("```", "").strip()
        
        return {"prediction": prediction, "html_code": clean_code}

    except Exception as e:
        print(f"AI Hatası: {e}")
        return {"prediction": "Hata", "html_code": f"<h1>Sistem Hatası: {e}</h1>"}

async def generate_followup_questions(answers: list):
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        
        prompt = f"""
        Sen bir tahmin oyunusun. 
        Kullanıcının verdiği cevaplar: {answers}
        
        Önceki tahminimiz YANLIŞ çıktı.
        Nesneyi bulmak için çemberi daraltacak 5 YENİ ve AYIRT EDİCİ soru üret.
        
        FORMAT (JSON):
        {{
            "questions": [
                {{"id": 101, "text": "Soru 1?"}},
                ...
            ]
        }}
        """
        
        response = await model.generate_content_async(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )
        
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
        
    except Exception as e:
        print(f"Soru Üretme Hatası: {e}")
        return {"questions": [{"id": 999, "text": "Yeni sorular üretilirken hata oluştu."}]}