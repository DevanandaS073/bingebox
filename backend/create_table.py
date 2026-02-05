import psycopg2

def create_ratings_table():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="movie_recommendation",
            user="postgres",
            password="postgres@123"
        )
        cur = conn.cursor()
        
        # Create ratings table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ratings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                movie_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, movie_id)
            );
        """)

        # Create preferences table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS preferences (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
                genres JSONB,
                mood VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        print("✅ Ratings table created successfully.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_ratings_table()
