from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import pickle
import numpy as np
import os
import psycopg2

# -----------------------
# Flask setup
# -----------------------

app = Flask(__name__)
CORS(app, supports_credentials=True)

# -----------------------
# PostgreSQL connection
# -----------------------

def get_db():
    return psycopg2.connect(
        host="localhost",
        database="movie_recommendation",
        user="postgres",
        password="postgres@123"   # your password
    )

# -----------------------
# Load ML model
# -----------------------

import re

# -----------------------
# Load ML model
# -----------------------

print("📥 Loading model_small.pkl...")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model_small.pkl")

with open(MODEL_PATH, 'rb') as f:
    data = pickle.load(f)

movies = data['movies']
ratings = data['ratings']

# 📄 EXTRACT YEAR FROM TITLE
def extract_year(title):
    match = re.search(r'\((\d{4})\)', title)
    if match:
        return int(match.group(1))
    return 0

print("📅 Extracting movie years...")
movies['year'] = movies['title'].apply(extract_year)

print("📊 Data loaded:")
print("Movies:", len(movies))
print("Ratings:", len(ratings))
print("Users:", ratings['userId'].nunique())

# -----------------------
# Build matrices
# -----------------------

print("🔄 Building user-movie matrix...")

user_movie_matrix = ratings.pivot_table(
    index='userId',
    columns='movieId',
    values='rating'
).fillna(0)

print("🔄 Computing collaborative similarity...")

movie_similarity_df = pd.DataFrame(
    cosine_similarity(user_movie_matrix.T),
    index=user_movie_matrix.columns,
    columns=user_movie_matrix.columns
)

print("🔄 Computing content similarity...")

tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(movies['genres'])

content_similarity_df = pd.DataFrame(
    cosine_similarity(tfidf_matrix),
    index=movies['movieId'],
    columns=movies['movieId']
)

print("✅ Backend fully ready!\n")

# -----------------------
# Recommendation logic
# -----------------------

MOOD_MAP = {
    "Happy": ["Comedy", "Adventure", "Animation", "Musical"],
    "Funny": ["Comedy", "Animation"],
    "Sad": ["Drama", "Romance", "Documentary"],
    "Quirky": ["Indie", "Fantasy", "Comedy"], # Indie might not be a genre in dataset, checking... usually standard genres
    "Romantic": ["Romance", "Comedy"],
    "Action": ["Action", "Thriller", "Sci-Fi", "Adventure"]
}

def recommend(user_id, n=10, method="hybrid"):

    conn = get_db()
    cur = conn.cursor()
    
    # 1. Fetch Ratings
    cur.execute("SELECT movie_id, rating FROM ratings WHERE user_id = %s", (user_id,))
    rating_rows = cur.fetchall()
    
    # 2. Fetch Preferences
    cur.execute("SELECT genres, mood FROM preferences WHERE user_id = %s", (user_id,))
    pref_row = cur.fetchone()
    
    cur.close()
    conn.close()

    # Process Ratings
    user_ratings_dict = {row[0]: row[1] for row in rating_rows}
    rated_movie_ids = set(user_ratings_dict.keys())
    
    # Process Preferences
    preferred_genres = []
    preferred_mood = ""
    
    if pref_row:
        # genres is already a list if stored as jsonb and psycopg2 handles it, 
        # or we might need json.loads if it comes back as string.
        # usually psycopg2 with jsonb returns list/dict python objects directly.
        preferred_genres = pref_row[0] if pref_row[0] else [] 
        preferred_mood = pref_row[1] if pref_row[1] else ""
        
    print(f"👤 User {user_id} | Genres: {preferred_genres} | Mood: {preferred_mood}")

    # MOOD GENRES
    mood_target_genres = MOOD_MAP.get(preferred_mood, [])

    predictions = []

    # Filter for candidates: ONLY movies > 2000
    # We can either filter explicitly or just punish older movies heavily.
    # User requested Strict filtering "Fetch only movies released between 2000 and 2026".
    candidate_movies = movies[movies['year'] >= 2000]

    for index, row in candidate_movies.iterrows():
        mid = row['movieId']

        if mid in rated_movie_ids:
            continue
            
        # Optimization: Skip movies not in our lookup dicts to save time
        if mid not in movie_similarity_df.columns and mid not in content_similarity_df.columns:
            continue

        score_collab = 0
        score_content = 0

        # Collaborative (Item-Item)
        if mid in movie_similarity_df.columns:
            sims = movie_similarity_df[mid]
            valid_sims_indices = sims.index.intersection(rated_movie_ids)
            
            if not valid_sims_indices.empty:
                my_ratings_for_sim_movies = [user_ratings_dict[m] for m in valid_sims_indices]
                my_sims_values = sims[valid_sims_indices].values
                sim_sum = my_sims_values.sum()
                
                if sim_sum > 0:
                    dot_product = np.dot(my_ratings_for_sim_movies, my_sims_values)
                    score_collab = dot_product / sim_sum

        # Content-based
        if mid in content_similarity_df.columns:
            if rating_rows:
                sorted_user_ratings = sorted(rating_rows, key=lambda x: x[1], reverse=True)
                top_3_favs = [x[0] for x in sorted_user_ratings[:3]]
                scores = []
                for fav in top_3_favs:
                    if fav in content_similarity_df.columns:
                        scores.append(content_similarity_df[mid][fav])
                if scores:
                    score_content = float(np.mean(scores))
            else:
                # Cold start: Boost basic content score slightly if we have no history
                score_content = 0.0

        # Base Score
        if method == "collaborative":
            final_score = score_collab
        elif method == "content":
            final_score = score_content
        else:
            final_score = (0.7 * score_collab) + (0.3 * score_content)
            
        # ---------------------------
        # BOOSTING LOGIC 🚀
        # ---------------------------
        
        movie_genres_str = row['genres']
        movie_genres_list = movie_genres_str.split('|')
        
        # 1. Genre Match Boost
        overlap = set(preferred_genres).intersection(movie_genres_list)
        if overlap:
            final_score += 0.3 # Strong additive boost
            
        # 2. Mood Match Boost
        mood_overlap = set(mood_target_genres).intersection(movie_genres_list)
        if mood_overlap:
            final_score += 0.2
            
        # 3. Recency Bias (Multiplicative)
        # year from 2000 to 2026.
        # 2000 -> 1.0
        # 2024 -> 1.24
        age_bonus = 1.0 + (row['year'] - 2000) * 0.01
        final_score *= age_bonus
        
        if final_score > 0:
            predictions.append({
                "movieId": mid,
                "score": final_score,
                "year": row['year']
            })
            
    if not predictions:
        return []

    result = pd.DataFrame(predictions)\
        .sort_values("score", ascending=False)\
        .head(n)

    result = result.merge(movies, on="movieId", suffixes=('', '_dup'))
    # Clean up duplicate columns if any (merge might add _dup if columns exist in both)
    # Actually movies has 'year' now, so predictions 'year' and movies 'year' might crash or duplicate.
    # predictions has 'year', movies has 'year'. merge on movieId.
    # Result will have year_x and year_y.
    
    # Let's fix column selection
    final_cols = []
    if 'year_x' in result.columns:
        result['year'] = result['year_x']

    return result[["title", "genres", "score", "year"]].to_dict("records")

# -----------------------
# AUTH APIs
# -----------------------

@app.route("/api/signup", methods=["POST"])
def signup():

    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
            (username, email, password)
        )
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Account created successfully"
        })

    except Exception as e:
        conn.rollback()
        return jsonify({
            "success": False,
            "message": "Email already exists"
        })

    finally:
        cur.close()
        conn.close()


@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, username FROM users WHERE email=%s AND password=%s",
        (email, password)
    )

    user = cur.fetchone()

    cur.close()
    conn.close()

    if user:
        return jsonify({
            "success": True,
            "user_id": user[0],
            "username": user[1]
        })
    else:
        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        })

# -----------------------
# RATINGS API
# -----------------------

@app.route("/api/rate", methods=["POST"])
def rate_movies():
    data = request.get_json()
    
    user_id = data.get("user_id")
    ratings_list = data.get("ratings")
    
    if not user_id or not ratings_list:
        return jsonify({"success": False, "message": "Missing data"}), 400

    conn = get_db()
    cur = conn.cursor()

    try:
        for movie_id_str, score in ratings_list.items():
            
            cur.execute("""
                INSERT INTO ratings (user_id, movie_id, rating)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_id, movie_id) 
                DO UPDATE SET rating = EXCLUDED.rating;
            """, (user_id, int(movie_id_str), score))
            
        conn.commit()
        return jsonify({"success": True, "message": "Ratings saved"})
        
    except Exception as e:
        conn.rollback()
        print(e)
        return jsonify({"success": False, "message": str(e)}), 500
        
    finally:
        cur.close()
        conn.close()

# -----------------------
# PREFERENCES API (NEW)
# -----------------------

@app.route("/api/preferences", methods=["POST"])
def save_preferences():
    data = request.get_json()
    
    user_id = data.get("user_id")
    genres = data.get("genres") # List of strings
    mood = data.get("mood")
    
    if not user_id:
        return jsonify({"success": False, "message": "Missing user_id"}), 400
        
    conn = get_db()
    cur = conn.cursor()
    
    try:
        # Use json.dumps for the list to ensure it's stored as valid JSONB
        import json
        genres_json = json.dumps(genres)
        
        cur.execute("""
            INSERT INTO preferences (user_id, genres, mood)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id)
            DO UPDATE SET genres = EXCLUDED.genres, mood = EXCLUDED.mood;
        """, (user_id, genres_json, mood))
        
        conn.commit()
        return jsonify({"success": True, "message": "Preferences saved"})
        
    except Exception as e:
        conn.rollback()
        print("Error saving preferences:", e)
        return jsonify({"success": False, "message": str(e)}), 500
        
    finally:
        cur.close()
        conn.close()

# -----------------------
# MOVIES BY GENRE API (NEW)
# -----------------------

@app.route("/api/movies-by-genre", methods=["POST"])
def get_movies_by_genre():
    data = request.get_json()
    genres = data.get("genres", [])
    n = data.get("n", 10)

    # If no genres provided, return top rated or random
    if not genres:
        # Filter for year >= 2000
        candidates = movies[movies['year'] >= 2000]
        sample = candidates.sample(n=n)
    else:
        # Filter movies that match ANY of the genres
        # movies['genres'] is a pipe-separated string "Action|Adventure"
        
        # Filter for year >= 2000 first
        candidates = movies[movies['year'] >= 2000]
        
        # Create a boolean mask on the filtered candidates
        mask = candidates['genres'].apply(lambda x: any(g in x.split('|') for g in genres))
        filtered_movies = candidates[mask]
        
        if filtered_movies.empty:
            # Fallback if no matches found (rare), but still respect year
            sample = candidates.sample(n=n)
        elif len(filtered_movies) < n:
            # Return all if less than n
            sample = filtered_movies
        else:
            sample = filtered_movies.sample(n=n)

    result = sample[['movieId', 'title', 'genres', 'year']].to_dict('records')
    
    # Add a mock summary if not present (dataset dependent, usually datasets like movielens don't have summaries)
    # The frontend expects a summary. Let's add a placeholder if missing.
    # Checking existing code... frontend interface has 'summary'.
    # Our 'movies' df likely came from MovieLens which only has title/genres.
    # Let's add a generic summary.
    for movie in result:
        movie['summary'] = f"Released in {movie['year']}. A popular {movie['genres'].replace('|', ', ')} movie."
        # Frontend RateMovies props expect: id, title, genre, summary
        # Rename keys to match frontend expectation or update frontend
        movie['id'] = movie.pop('movieId')
        movie['genre'] = movie.pop('genres') # Frontend expects 'genre' singular
        
    return jsonify({
        "success": True,
        "movies": result
    })

# -----------------------
# Recommendation API
# -----------------------

@app.route("/api/recommend", methods=["POST"])
def get_recommendations():

    data = request.get_json()

    try:
        user_id = int(data["user_id"])
        num_recs = int(data.get("num_recommendations", 5))
        method = data.get("method", "hybrid")

        results = recommend(user_id, num_recs, method)

        if not results:
            return jsonify({
                "success": False,
                "message": "No recommendations found"
            })

        return jsonify({
            "success": True,
            "recommendations": results
        })

    except Exception as e:
        print("Recommendation error:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# -----------------------
# Health API
# -----------------------

@app.route("/api/health")
def health():

    return jsonify({
        "status": "ok",
        "movies": len(movies),
        "ratings": len(ratings),
        "users": int(ratings["userId"].nunique())
    })

@app.route("/api/test-db")
def test_db():

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM users;")
    count = cur.fetchone()[0]

    cur.close()
    conn.close()

    return jsonify({"users_in_db": count})


# -----------------------

if __name__ == "__main__":

    print("🚀 Flask running at http://localhost:5000")
    app.run(port=5000, debug=False)

