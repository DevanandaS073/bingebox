# Verification Script
import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://localhost:5000"

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as f:
            return json.loads(f.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.read().decode()}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def get_json(url):
    try:
        with urllib.request.urlopen(url) as f:
            return json.loads(f.read().decode('utf-8'))
    except Exception as e:
        return None

def test_flow():
    print("⏳ Waiting for server...", end="", flush=True)
    for _ in range(10):
        health = get_json(f"{BASE_URL}/api/health")
        if health:
            print("\n✅ Server is UP!")
            break
        time.sleep(2)
        print(".", end="", flush=True)
    
    # 1. Signup
    username = f"pref_user_{int(time.time())}"
    email = f"{username}@test.com"
    pwd = "password"
    
    print(f"\n👉 Signing up {username}...")
    post_json(f"{BASE_URL}/api/signup", {"username": username, "email": email, "password": pwd})
    
    # 2. Login
    print(f"👉 Logging in...")
    resp = post_json(f"{BASE_URL}/api/login", {"email": email, "password": pwd})
    if not resp or not resp.get("success"):
        return
    user_id = resp["user_id"]
    print(f"✅ Logged in as ID: {user_id}")
    
    # 3. Set Preferences
    # Let's say we like 'Comedy'
    print("👉 Setting Preferences: [Comedy] + Mood: Happy")
    resp = post_json(f"{BASE_URL}/api/preferences", {
        "user_id": user_id,
        "genres": ["Comedy"],
        "mood": "Happy"
    })
    print("Preferences Response:", resp)
    
    # 4. Rate Movies (Optional, but let's add some basic ones)
    # Rate Inception (Sci-Fi) high, but we prefer Comedy.
    ratings = {"1": 5} 
    print("👉 Sending ratings...", ratings)
    post_json(f"{BASE_URL}/api/rate", {"user_id": user_id, "ratings": ratings})
    
    # 5. Recommend
    print("👉 Getting recommendations...")
    resp = post_json(f"{BASE_URL}/api/recommend", {"user_id": user_id, "num_recommendations": 5})
    
    recs = resp.get("recommendations", [])
    print(f"✅ Received {len(recs)} recommendations")
    
    # Check if we have Comedy movies
    comedy_count = 0
    for r in recs:
        print(f"   - {r['title']} (Score: {r['score']:.2f}) [{r['genres']}]")
        if "Comedy" in r['genres']:
            comedy_count += 1
            
    if comedy_count > 0:
        print(f"🎉 SUCCESS: Found {comedy_count} Comedy movies (Preferences worked!)")
    else:
        print("⚠️ Warning: No Comedy movies found. Boosting might need adjustment.")

if __name__ == "__main__":
    test_flow()
