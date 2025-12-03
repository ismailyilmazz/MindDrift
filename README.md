# 🏎️ MindDrift: Generative 3D Guessing Game

**MindDrift**, klasik arcade sürüş mekaniklerini modern **Üretken Yapay Zeka (Generative AI)** ile birleştiren, web tabanlı etkileşimli bir simülasyon projesidir.

> **Konsept:** Kullanıcı, fiziksel bir nesneyi zihninde tutar ve 3D bir dünyada araba sürerek yapay zekanın sorularını cevaplar. Oyunun sonunda AI, tahmin ettiği nesneyi **canlı olarak kodlar** ve 3D bir sahne olarak render eder.

---

## 🏗️ Mimari ve Teknoloji Yığını (Tech Stack)

Proje, **Client-Server (İstemci-Sunucu)** mimarisi üzerine kuruludur ve aşağıdaki teknolojileri kullanır:

```mermaid
graph TD
    User[👤 Kullanıcı] -->|Sürüş & Cevaplar| Frontend
    
    subgraph Frontend [🎨 Frontend (İstemci)]
        UI[HTML/CSS UI]
        ThreeJS[Three.js (Render Motoru)]
        Cannon[Cannon.js (Fizik Motoru)]
        API_Client[API Client (JS)]
    end
    
    Frontend -->|JSON Veri| Backend
    
    subgraph Backend [🐍 Backend (Sunucu)]
        FastAPI[FastAPI (Python)]
        Log[Logic Manager]
        Cache[(SQLite Veritabanı)]
    end
    
    Backend -->|Prompt| Gemini[✨ Google Gemini AI]
    Gemini -->|Tahmin & Kod| Backend
    Backend -->|HTML Dosyası| Frontend


