import * as THREE from 'three';
import { listener } from './scene.js';

const soundManager = {
    bgm: null,
    answer: null,
    thinking: null,
    win: null,
    click: null
};

let bgmRequested = false;

const audioLoader = new THREE.AudioLoader();

export function loadSounds() {
    // 1. Arka Plan Müziği
    const bgmSound = new THREE.Audio(listener);
    audioLoader.load('assets/sounds/bgm.mp3', function (buffer) {
        bgmSound.setBuffer(buffer);
        bgmSound.setLoop(true);
        bgmSound.setVolume(0.3);
        soundManager.bgm = bgmSound;

        if (bgmRequested && !bgmSound.isPlaying) {
            bgmSound.play();
        }
    });

    // 2. Cevap Verme Sesi
    const answerSound = new THREE.Audio(listener);
    audioLoader.load('assets/sounds/answer.mp3', function (buffer) {
        answerSound.setBuffer(buffer);
        answerSound.setLoop(false);
        answerSound.setVolume(0.5);
        soundManager.answer = answerSound;
    });

    // 3. YENİ: Düşünme/Bekleme Sesi (Thinking)
    const thinkingSound = new THREE.Audio(listener);
    audioLoader.load('assets/sounds/thinking.mp3', function (buffer) {
        thinkingSound.setBuffer(buffer);
        thinkingSound.setLoop(true); // Sürekli çalsın (sonuç gelene kadar)
        thinkingSound.setVolume(1.0); // Biraz baskın olsun
        soundManager.thinking = thinkingSound;
    });

    const winSound = new THREE.Audio(listener);
    audioLoader.load('assets/sounds/win.mp3', function (buffer) {
        winSound.setBuffer(buffer);
        winSound.setLoop(false);
        winSound.setVolume(0.8);
        soundManager.win = winSound;
    });

    const clickSound = new THREE.Audio(listener);
    audioLoader.load('assets/sounds/click.mp3', function(buffer) {
        clickSound.setBuffer(buffer);
        clickSound.setLoop(false);
        clickSound.setVolume(0.6); 
        soundManager.click = clickSound;
    });
}

export function startMusic() {
    bgmRequested = true; // "Müzik çalsın istiyoruz" diye not et

    // YENİ: Tarayıcının ses motoru uyuyor mu? Uyuyorsa dürtüp uyandıralım.
    if (listener.context.state === 'suspended') {
        listener.context.resume().then(() => {
            console.log("🔊 Ses motoru uyandırıldı.");
        });
    }

    // Dosya zaten hazırsa hemen çal
    if (soundManager.bgm && !soundManager.bgm.isPlaying) {
        soundManager.bgm.play();
    }
}

export function playSoundEffect(type) {
    if (type === 'answer' && soundManager.answer) {
        if (soundManager.answer.isPlaying) soundManager.answer.stop();
        soundManager.answer.play();
    }

    else if (type === 'win' && soundManager.win) {
        if (soundManager.win.isPlaying) soundManager.win.stop();
        soundManager.win.play();
    }

    else if (type === 'click' && soundManager.click) {
        if (soundManager.click.isPlaying) soundManager.click.stop();
        soundManager.click.play();
    }
}

export function startThinkingSound() {
    if (listener.context.state === 'suspended') {
        listener.context.resume();
    }

    if (soundManager.bgm && soundManager.bgm.isPlaying) {
        soundManager.bgm.setVolume(0.1); 
    }

    if (soundManager.thinking && !soundManager.thinking.isPlaying) {
        soundManager.thinking.play();
    }
}

export function stopThinkingSound() {
    if (soundManager.thinking && soundManager.thinking.isPlaying) {
        soundManager.thinking.stop();
    }

    if (soundManager.bgm) {
        soundManager.bgm.setVolume(0.3);
    }
}