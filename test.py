import requests
import json

API_KEY = ""
URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"

headers = {
    "Content-Type": "application/json"
}

data = {
    "contents": [
        {
            "parts": [
                {"text": "Explain how AI works in simple terms"}
            ]
        }
    ]
}

response = requests.post(URL, headers=headers, data=json.dumps(data))

if response.status_code == 200:
    result = response.json()
    print(result["candidates"][0]["content"]["parts"][0]["text"])
else:
    print("Error:", response.status_code, response.text)