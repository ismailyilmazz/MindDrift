/**
 * Backend ile olan tüm iletişimi bu dosya yönetir.
 * Frontend ekibi fetch/url detaylarıyla uğraşmaz, buradaki fonksiyonları kullanır.
 */

// Geliştirme ortamı (Localhost). Deploy edersek burası değişecek.
const BASE_URL = "http://localhost:8000"; 

/**
 * GAME START
 * @returns {Promise<Array>}
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
 * GET PREDICTION
 * @param {Array} answers
 * @returns {Promise<Object>} 
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
 * CONTINUE GAME
 * @param {Array} currentAnswers 
 * @returns {Promise<Array>}
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
 * FORMAT ANSWER
 * * @param {string} questionText
 * @param {string} answerText
 * @returns {string}
 */
export function formatAnswer(questionText, answerText) {
    return `${questionText}: ${answerText}`;
}

/**
 * CONFIRM SUCCESS
 * @param {Array} answers
 * @param {string} prediction
 * @param {string} htmlContent
 * @returns {Promise<Object>}
 */
export async function confirmSuccess(answers, prediction, htmlContent) {
    console.log("💾 Başarılı tahmin kaydediliyor...");
    try {
        const response = await fetch(`${BASE_URL}/confirm-success`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                answers: answers,
                prediction: prediction,
                html_content: htmlContent
            })
        });

        if (!response.ok) throw new Error("Kayıt yapılamadı");
        const data = await response.json();
        console.log("✅ Tahmin veritabanına kaydedildi!");
        return data;
    } catch (error) {
        console.error("❌ Kayıt hatası:", error);
        return null;
    }
}