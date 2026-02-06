import { useState, useEffect } from "react";

interface Movie {
  id: number;
  title: string;
  genre: string;
  summary: string;
  year?: number;
}

export default function RateMovies({ userId, selectedGenres, onFinish }: { userId: number; selectedGenres: string[]; onFinish: () => void }) {

  const [ratings, setRatings] = useState<{ [key: number]: number }>({});
  const [moviesList, setMoviesList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/movies-by-genre", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ genres: selectedGenres, n: 10 })
        });
        const data = await response.json();
        if (data.success) {
          setMoviesList(data.movies);
        }
      } catch (e) {
        console.error("Failed to fetch movies", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [selectedGenres]);

  const setRating = (movieId: number, rating: number) => {
    setRatings({ ...ratings, [movieId]: rating });
  };

  const handleSubmit = async () => {
    if (Object.keys(ratings).length < 3) {
      alert("Please rate at least 3 movies 🙂");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ratings: ratings
        })
      });

      const data = await response.json();

      if (data.success) {
        onFinish();
      } else {
        alert("Failed to save ratings: " + data.message);
      }
    } catch (e) {
      console.error(e);
      alert("Backend not reachable");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex justify-between items-center py-6">
          <h1 className="text-red-600 text-4xl font-bold tracking-tighter uppercase" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            BingeBox
          </h1>
        </nav>

        <div className="flex flex-col items-center min-h-[80vh] py-10">
          <div className="w-full max-w-4xl">

            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold mb-3">Rate Some Movies</h2>
              <p className="text-gray-400">Rate at least 3 movies to help us understand your taste.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {loading && <div className="text-center text-gray-400 py-10">Loading movies...</div>}
              {!loading && moviesList.map(movie => (
                <div key={movie.id} className="bg-[#141414] hover:bg-[#1f1f1f] transition duration-300 p-6 rounded-md flex flex-col sm:flex-row gap-6 items-start sm:items-center border border-white/5">

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {movie.title}
                      {movie.year ? <span className="ml-2 text-gray-400 font-normal">({movie.year})</span> : null}
                    </h3>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{movie.genre}</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{movie.summary}</p>
                  </div>

                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        onClick={() => setRating(movie.id, num)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all
                          ${(ratings[movie.id] || 0) >= num
                            ? "bg-red-600 text-white scale-110 shadow-lg"
                            : "bg-[#333] text-gray-500 hover:bg-[#444] hover:text-gray-300"
                          }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <button
                onClick={handleSubmit}
                className="px-12 py-4 bg-red-600 rounded text-xl font-bold text-white hover:bg-red-700 transition shadow-xl"
              >
                Submit & Start Bingeing
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
