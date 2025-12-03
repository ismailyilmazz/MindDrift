/**
 * Backend ile olan tüm iletişimi bu dosya yönetir.
 * Frontend ekibi fetch/url detaylarıyla uğraşmaz, buradaki fonksiyonları kullanır.
 */

// Geliştirme ortamı (Localhost). Deploy edersek burası değişecek.
const BASE_URL = "http://localhost:8000"; 

/**
 * 1. OYUNU BAŞLAT(Başlat butonuna tıklandığında)
 * Sabit 15 soruyu backend'den çeker.
 * @returns {Promise<Array>} Sorular listesi örn: [{id: 1, text: "Canlı mı?"}, ...]
 */
export async function startGame() {
    console.log("📡 Backend'e bağlanılıyor...");
    try {
        const response = await fetch(`${BASE_URL}/start-game`);
        if (!response.ok) throw new Error(`HTTP Hatası: ${response.status}`);
        const data = await response.json();
        console.log("✅ Oyun başladı, sorular alındı.");
        return data.questions;
    } catch (error) {
        console.error("❌ Oyun başlatılamadı:", error);
        alert("Backend sunucusuna ulaşılamıyor! Lütfen 'backend' klasöründe terminali açıp 'uvicorn main:app --reload' yazdığınızdan emin olun.");
        return [];
    }
}

/**
 * 2. TAHMİN İSTE (OYUN SONU)
 * Toplanan cevapları gönderir, AI'ın tahminini ve Three.js kodunu alır.
 * @param {Array} answers - Kullanıcı cevapları dizisi
 * @returns {Promise<Object>} { prediction: "Araba", url: "..." }
 */
export async function getPrediction(answers) {
    console.log("🧠 AI Tahmin yürütüyor...");
    try {
        const response = await fetch(`${BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: answers })
        });

        if (!response.ok) throw new Error("Tahmin alınamadı");
        const data = await response.json();
        console.log(`✅ Tahmin Geldi: ${data.prediction} (Kaynak: ${data.source})`);
        return data;
    } catch (error) {
        console.error("❌ Tahmin hatası:", error);
        alert("Tahmin alınırken bir hata oluştu.");
        return null;
    }
}

/**
 * 3. DEVAM ET (BİLEMEDİN SENARYOSU)
 * Kullanıcı "Yanlış, 5 Soru Daha Sor" dediğinde çalışır.
 * @param {Array} currentAnswers - Şu anki cevaplar
 * @returns {Promise<Array>} Yeni 5 soru
 */
export async function continueGame(currentAnswers) {
    console.log("🔄 Yeni sorular isteniyor...");
    try {
        const response = await fetch(`${BASE_URL}/continue-game`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: currentAnswers })
        });

        if (!response.ok) throw new Error("Devam edilemedi");
        const data = await response.json();
        console.log("✅ 5 Yeni soru yüklendi.");
        return data.questions;
    } catch (error) {
        console.error("❌ Devam hatası:", error);
        return [];
    }
}

/**
 * 4. CEVAP FORMATLAYICI (ÇOK ÖNEMLİ!)
 * Araba kapıya çarptığında MUTLAKA bu fonksiyonu kullanın.
 * * @param {string} questionText - O anki sorunun metni (örn: "Canlı mı?")
 * @param {string} answerText - Seçilen kapı (örn: "Evet")
 * @returns {string} Formatlanmış veri (örn: "Canlı mı?: Evet")
 */
export function formatAnswer(questionText, answerText) {
    return `${questionText}: ${answerText}`;
}