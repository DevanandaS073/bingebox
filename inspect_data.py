
import pickle
import os
import pandas as pd

MODEL_PATH = os.path.join("backend", "model_small.pkl")

with open(MODEL_PATH, 'rb') as f:
    data = pickle.load(f)

movies = data['movies']
print("Columns:", movies.columns.tolist())
print("First 5 rows:")
print(movies.head())

# Check for year in title if no year column
if 'title' in movies.columns:
    print("\nSample Titles:", movies['title'].head(10).tolist())
