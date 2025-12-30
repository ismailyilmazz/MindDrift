# 🏎️ MindDrift: Generative 3D Guessing Game

**MindDrift**, klasik arcade sürüş mekaniklerini modern **Üretken Yapay Zeka (Generative AI)** ile birleştiren, web tabanlı etkileşimli bir simülasyon projesidir.

> **Konsept:** Kullanıcı, fiziksel bir nesneyi zihninde tutar ve 3D bir dünyada araba sürerek yapay zekanın sorularını cevaplar. Oyunun sonunda AI, tahmin ettiği nesneyi **canlı olarak kodlar** ve 3D bir sahne olarak render eder.

# **How to run**

1. Clone the Repository
git clone https://github.com/ismailyilmazz/MindDrift.git
cd <project-folder>

2. Create Environment Variables
Create a .env file in the root directory and add your Gemini API key:
GEMINI_API_KEY=your_api_key_here

3. Backend Setup
cd backend
python -m venv venv
source venv/bin/activate (macOS/Linux)
venv\Scripts\activate (Windows)
pip install -r requirements.txt

4. Start Backend Server
uvicorn start:app --reload
http://127.0.0.1:8000

5. Start Frontend
Open a new terminal and run:
python -m http.server 5500
http://127.0.0.1:5500

