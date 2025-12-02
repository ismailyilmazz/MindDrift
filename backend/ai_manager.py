import os
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=API_KEY)
MODEL_NAME = "gemini-2.5-pro" 

async def generate_prediction_and_code(answers: list):
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        
        #TAHMİN
        guess_prompt = f"""
        GÖREV: Bir tahmin oyununun yapay zekasısın.
        Kullanıcının sorulara verdiği cevaplar aşağıda. Bu cevaplara göre AKLINDAKİ NESNEYİ tahmin et.
        
        KURALLAR:
        1. Sadece FİZİKSEL, SOMUT nesneler veya KARAKTERLER tahmin et (Soyut kavramlar yasak).
        2. Çıktı olarak sadece nesnenin ismini ver. Başka hiçbir şey yazma.
        
        KULLANICI CEVAPLARI:
        {answers}
        
        TAHMİN (Tek kelime veya kısa öbek):
        """
        guess_res = await model.generate_content_async(guess_prompt)
        prediction = guess_res.text.strip()
        print(f"🤖 AI Tahmini: {prediction}")

        #KODLAMA
        code_prompt = f"""
        Sen uzman bir Three.js geliştiricisisin.
        HEDEF: "{prediction}" nesnesini temsil eden 3D bir sahne oluştur.
        
        TEKNİK GEREKSİNİMLER:
        1. Tek bir HTML dosyası üret. İçinde <script type="module"> ile Three.js kodu olsun.
        2. Three.js'i CDN'den import et: https://unpkg.com/three@0.160.0/build/three.module.js
        3. OrbitControls ve Işıklandırma ekle. Arka plan rengi #111 olsun.
        4. Nesneyi BASİT GEOMETRİLER (Box, Sphere, Cylinder) birleştirerek oluştur. External model yükleme.
        
        AŞAĞIDAKİ ETKİLEŞİM BUTONLARINI EKRANA EKLE (HTML/CSS OLARAK):
        Sol üst köşeye sabitlenmiş (fixed) şu butonları koy:
        
        1. [DOĞRU BİLDİN!] -> ID: 'btn-correct'
           - Tıklanınca: window.opener.postMessage({{type: 'CONFIRMED', prediction: '{prediction}', html: document.documentElement.outerHTML}}, '*'); window.close();
           
        2. [YANLIŞ - 5 SORU DAHA SOR] -> ID: 'btn-wrong'
           - Tıklanınca: window.opener.postMessage({{type: 'RETRY_5_QUESTIONS'}}, '*'); window.close();
           
        3. [YANLIŞ - OYUNU BİTİR] -> ID: 'btn-quit'
           - Tıklanınca: window.close();

        ÇIKTI: Sadece saf HTML kodu. Markdown kullanma.
        """
        
        code_res = await model.generate_content_async(code_prompt)
        clean_code = code_res.text.replace("```html", "").replace("```", "").strip()
        
        return {"prediction": prediction, "html_code": clean_code}

    except Exception as e:
        print(f"AI Hatası: {e}")
        return {"prediction": "Hata", "html_code": "<h1>Bir hata oluştu</h1>"}

async def generate_followup_questions(answers: list):
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        
        prompt = f"""
        Sen bir tahmin oyunusun. 
        Kullanıcı şu ana kadar şu cevapları verdi: {answers}
        
        Ancak önceki tahminimiz YANLIŞ çıktı.
        Nesneyi bulmak için çemberi daraltacak, daha detaylı ve ayırt edici 5 YENİ soru üret.
        
        FORMAT:
        Sadece şu JSON formatında cevap ver:
        {{
            "questions": [
                {{"id": 101, "text": "Soru 1?"}},
                {{"id": 102, "text": "Soru 2?"}},
                ...
            ]
        }}
        """
        
        response = await model.generate_content_async(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )
        # Gelen JSON string'i Python objesine çevir
        return json.loads(response.text)
        
    except Exception as e:
        print(f"Soru Üretme Hatası: {e}")
        return {"questions": [{"id": 999, "text": "Bu nesne çok mu nadir bulunur?"}]}