import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import db_manager
import ai_manager
from questions_data import HARDCODED_QUESTIONS

db_manager.init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


os.makedirs("generated_pages", exist_ok=True)
app.mount("/generated_pages", StaticFiles(directory="generated_pages"), name="generated")


class GameData(BaseModel):
    answers: list[str] 

class ConfirmData(BaseModel):
    answers: list[str]
    prediction: str
    html_content: str

@app.get("/start-game")
def start_game():
    """Oyun başlangıcında sabit 15 soruyu döner"""
    return {"questions": HARDCODED_QUESTIONS}

@app.post("/predict")
def predict_object(data: GameData):
    """
    15 cevap geldiğinde tahmin yapar.
    Önce Cache'e bakar, yoksa AI'a sorar.
    """
    print(f"\n📊 Tahmin Endpoint Çağrıldı ({len(data.answers)} cevap)")
    
    # 1. Cache Kontrolü
    cache_res = db_manager.get_verified_prediction(data.answers)
    if cache_res["found"]:
        print("⚡ Cache'den getirildi!")
        return {
            "source": "cache",
            "prediction": cache_res["prediction"],
            "html_code": cache_res['html_content'],
            "url": f"http://localhost:8000/generated_pages/{cache_res['prediction']}.html"
        }

    print("🤖 AI Düşünüyor...")
    ai_res = ai_manager.generate_prediction_and_code(data.answers)
    
    # Diske yaz
    filename = f"generated_pages/{ai_res['prediction']}.html"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(ai_res['html_code'])
    print(f"💾 {filename} kaydedildi")
        
    return {
        "source": "ai",
        "prediction": ai_res["prediction"],
        "html_code": ai_res['html_code'],
        "url": f"http://localhost:8000/generated_pages/{ai_res['prediction']}.html"
    }

@app.post("/continue-game")
def continue_game(data: GameData):
    """
    Kullanıcı 'Yanlış, 5 Soru Daha Sor' dediğinde çalışır.
    Mevcut cevapları alır, 5 yeni soru üretir.
    """
    print(f"\n🔄 Continue Game: {len(data.answers)} cevap ile 5 yeni soru isteniyor...")
    new_questions = ai_manager.generate_followup_questions(data.answers)
    print(f"✅ {len(new_questions.get('questions', []))} Soru gönderiliyor...")
    return new_questions 

@app.post("/confirm-success")
def confirm_success(data: ConfirmData):
    """
    Kullanıcı 'Doğru Bildin' butonuna basınca çalışır.
    Kaydı veritabanına kalıcı olarak işler.
    """
    db_manager.save_verified_prediction(
        data.answers,
        data.prediction,
        data.html_content
    )
    print(f"✅ Başarı kaydedildi: {data.prediction}")
    return {"status": "saved"}