import os
import json
import time
import threading
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from hijridate import Gregorian, Hijri
import requests
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
NVIDIA_API_KEY = os.getenv('NVIDIA_API_KEY')
NVIDIA_API_URL = os.getenv('NVIDIA_API_URL', 'https://api.nvcf.nvidia.com/v2/nvcf/pexec/functions/...')

ISLAMIC_JSON_PATH = os.path.join(os.path.dirname(__file__), '..', 'islamic.json')

month_names = [
    'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir',
    'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
    'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
]

FALLBACK_EVENTS = {
    '1': {'1': ['1 Muharram: Tahun Baru Islam, peringatan hijrah Nabi Muhammad SAW.']},
    '2': {'1': ['1 Safar: Awal bulan Safar.']},
    '3': {'12': ['12 Rabiul Awal: Maulid Nabi Muhammad SAW.']},
    '4': {'1': ['1 Rabiul Akhir: Bulan keempat.']},
    '5': {'1': ['1 Jumadil Awal: Bulan kelima.']},
    '6': {'1': ['1 Jumadil Akhir: Bulan keenam.']},
    '7': {'27': ['27 Rajab: Isra Mi\'raj.']},
    '8': {'15': ['15 Sya\'ban: Nisfu Sya\'ban.']},
    '9': {'17': ['17 Ramadhan: Nuzulul Qur\'an.']},
    '10': {'1': ['1 Syawal: Idul Fitri.']},
    '11': {'1': ['1 Dzulqa\'dah: Bulan haram.']},
    '12': {'9': ['9 Dzulhijjah: Hari Arafah.'], '10': ['10 Dzulhijjah: Idul Adha.']}
}

def ensure_json():
    if not os.path.exists(ISLAMIC_JSON_PATH):
        with open(ISLAMIC_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump({}, f)

def load_cached_data():
    ensure_json()
    try:
        with open(ISLAMIC_JSON_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

def save_cached_data(data):
    with open(ISLAMIC_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def hijri_today():
    now = datetime.now()
    year, month, day = now.year, now.month, now.day

    try:
        greg = Gregorian(year, month, day)
        hijri = greg.to_hijri()
        return hijri.month, hijri.day
    except:
        pass

    try:
        h = Hijri.fromgregorian(year=year, month=month, day=day)
        return h.month, h.day
    except:
        pass

    print(f'[Ticker] Hijri conversion fallback to (1,1) for {year}-{month}-{day}')
    return 1, 1

def call_gemini(prompt):
    if not GEMINI_API_KEY:
        return None
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'
    headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
    }
    payload = {
        'contents': [{
            'parts': [{'text': prompt}]
        }]
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        if response.status_code != 200:
            print(f'[Ticker] Gemini error {response.status_code}: {response.text[:200]}')
            return None
        result = response.json()
        if 'candidates' not in result:
            print(f'[Ticker] Gemini invalid response: {result}')
            return None
        text = result['candidates'][0]['content']['parts'][0]['text']
        return text
    except Exception as e:
        print(f'[Ticker] Gemini exception: {e}')
        return None

def call_nvidia(prompt):
    if not NVIDIA_API_KEY or not NVIDIA_API_URL:
        return None
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {NVIDIA_API_KEY}'
    }
    payload = {'messages': [{'role': 'user', 'content': prompt}]}
    try:
        response = requests.post(NVIDIA_API_URL, json=payload, headers=headers, timeout=120)
        if response.status_code != 200:
            print(f'[Ticker] NVIDIA error {response.status_code}')
            return None
        result = response.json()
        return result['choices'][0]['message']['content']
    except Exception as e:
        print(f'[Ticker] NVIDIA exception: {e}')
        return None

def generate_month_events(month_idx):
    month_name = month_names[month_idx - 1]
    month_str = str(month_idx)
    print(f'[Ticker] Generating events for {month_name}...')

    prompt = f"""Kamu adalah seorang editor berita senior dan sejarawan untuk sebuah portal web modern ber-niche Islami. Tugas utamamu adalah merangkum peristiwa sejarah Islam atau kejadian penting di masa lalu untuk SETIAP HARI pada bulan {month_name} menjadi format 'teks berjalan' (ticker bar) yang pendek dan padat.
ATURAN KETAT:
1. PANJANG TEKS: Maksimal 120-150 karakter per peristiwa. Harus ringkas dan langsung pada intinya.
2. KONTEKS HIJRIYAH: Masukkan informasi Tanggal dan Bulan Hijriyah sebagai pembuka kalimat secara profesional.
3. GAYA BAHASA: Jurnalistik, profesional, netral, dan informatif.
4. FORMAT: Dilarang menggunakan emoji, hashtag, atau format markdown.
5. OUTPUT: HARUS murni berupa format JSON dengan key berupa angka tanggal (1-30) dan value berupa array of strings. Dilarang memberikan kalimat pembuka/penutup."""

    text = call_gemini(prompt)
    if not text:
        text = call_nvidia(prompt)

    if not text:
        print(f'[Ticker] All APIs failed, using fallback for {month_name}')
        return FALLBACK_EVENTS.get(month_str, {})

    try:
        start = text.find('{')
        end = text.rfind('}') + 1
        if start == -1 or end == 0:
            raise ValueError('No JSON found')
        json_str = text[start:end]
        events = json.loads(json_str)
        return {str(k): v for k, v in events.items()}
    except Exception as e:
        print(f'[Ticker] Failed to parse JSON: {e}')
        return FALLBACK_EVENTS.get(month_str, {})

def prefetch_all_months():
    ensure_json()
    cached = load_cached_data()

    for month_idx in range(1, 13):
        month_str = str(month_idx)
        if month_str in cached:
            print(f'[Ticker] Month {month_names[month_idx-1]} already cached')
            continue

        events = generate_month_events(month_idx)
        if events:
            cached[month_str] = events
            save_cached_data(cached)
            print(f'[Ticker] Saved month {month_names[month_idx-1]}')
        else:
            print(f'[Ticker] Failed to generate month {month_names[month_idx-1]}')

        if month_idx < 12:
            print(f'[Ticker] Waiting 60 seconds before next month...')
            time.sleep(60)

def ensure_today():
    cached = load_cached_data()
    month_idx, day = hijri_today()
    month_str = str(month_idx)
    day_str = str(day)

    if month_str not in cached:
        events = generate_month_events(month_idx)
        if events:
            cached[month_str] = events
            save_cached_data(cached)

    if month_str in cached and day_str not in cached[month_str]:
        fallback = FALLBACK_EVENTS.get(month_str, {})
        if day_str in fallback:
            cached[month_str][day_str] = fallback[day_str]
        else:
            cached[month_str][day_str] = [f'{day} {month_names[month_idx-1]}: Tidak ada peristiwa tercatat untuk hari ini.']
        save_cached_data(cached)

@app.route('/api/ticker', methods=['GET'])
def get_ticker():
    try:
        ensure_today()
        cached = load_cached_data()
        month_idx, day = hijri_today()
        month_str = str(month_idx)
        day_str = str(day)

        events = cached.get(month_str, {}).get(day_str, [])
        if not events:
            events = [f'{day} {month_names[month_idx-1]}: Tidak ada peristiwa tercatat untuk hari ini.']

        return jsonify({
            'date': f'{day} {month_names[month_idx-1]}',
            'events': events
        })
    except Exception as e:
        print(f'[Ticker] Error in /api/ticker: {e}')
        return jsonify({
            'date': '',
            'events': ['Data sejarah tidak tersedia']
        }), 500

if __name__ == '__main__':
    print('[Ticker] Starting server...')
    ensure_json()
    threading.Thread(target=prefetch_all_months, daemon=True).start()
    app.run(host='0.0.0.0', port=5001, debug=False)