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

# CORS (Frontend Erişimi)
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
async def predict_object(data: GameData):
    """
    15 (veya 20, 25) cevap geldiğinde çalışır.
    Önce Cache'e bakar, yoksa AI'a sorar.
    """
    # 1. Cache Kontrolü
    cache_res = db_manager.get_verified_prediction(data.answers)
    if cache_res["found"]:
        print("⚡ Cache'den getirildi!")
        # Dosyayı diske yaz ki URL ile açılabilsin
        filename = f"generated_pages/{cache_res['prediction']}.html"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(cache_res['html_content'])
            
        return {
            "source": "cache",
            "prediction": cache_res["prediction"],
            "url": f"http://localhost:8000/generated_pages/{cache_res['prediction']}.html"
        }

    print("🤖 AI Düşünüyor...")
    ai_res = await ai_manager.generate_prediction_and_code(data.answers)
    
    #Cache'e değil, diske
    filename = f"generated_pages/{ai_res['prediction']}.html"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(ai_res['html_code'])
        
    return {
        "source": "ai",
        "prediction": ai_res["prediction"],
        "url": f"http://localhost:8000/generated_pages/{ai_res['prediction']}.html"
    }

@app.post("/continue-game")
async def continue_game(data: GameData):
    """
    Kullanıcı 'Yanlış, 5 Soru Daha Sor' dediğinde çalışır.
    Mevcut cevapları alır, 5 yeni soru üretir.
    """
    print("🔄 5 Yeni Soru Üretiliyor...")
    new_questions = await ai_manager.generate_followup_questions(data.answers)
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