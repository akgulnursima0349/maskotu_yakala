# Ses Dosyaları

Bu klasöre soru ve cevap ses dosyalarını (.mp3) ekleyin.

## Kullanım

### Tek sesli soru
questions.json içinde ilgili soruya şunu yazın:
    "audio": "sounds/questions/DOSYA_ADI.mp3"

### Cevap sesi
İlgili cevaba şunu yazın:
    "audio": "sounds/questions/DOSYA_ADI.mp3"

### Konuşma balonlu soru (birden fazla parça)
    "audio_parts": [
        "sounds/questions/DOSYA1.mp3",
        "sounds/questions/DOSYA2.mp3",
        "sounds/questions/DOSYA3.mp3"
    ]

## Önerilen isimlendirme
    q1.mp3          → 1. sorunun sesi
    q1_a1.mp3       → 1. sorunun 1. cevabının sesi
    q1_a2.mp3       → 1. sorunun 2. cevabının sesi
    q3_parca1.mp3   → 3. sorunun 1. konuşma balonunun sesi
    q3_parca2.mp3   → 3. sorunun 2. konuşma balonunun sesi

## Ses yoksa
audio veya audio_parts alanını null bırakın. Ses butonu görünmez.
