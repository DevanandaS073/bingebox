import { useState } from "react";

interface Result {
  title: string;
  genres: string;
  score: number;
}

export default function Dashboard({ userId }: { userId: number }) {

  const [numResults, setNumResults] = useState("5");
  const [method, setMethod] = useState("hybrid");

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          num_recommendations: parseInt(numResults),
          method: method,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.recommendations);
      } else {
        setError(data.message || "No recommendations found");
      }

    } catch {
      setError("❌ Backend not running");
    }

    setLoading(false);
  };

  return (

    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex justify-between items-center py-6 border-b border-white/10 mb-8">
          <h1 className="text-red-600 text-4xl font-bold tracking-tighter uppercase" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            BingeBox
          </h1>
          <div className="text-sm font-medium text-gray-300">
            Welcome back
          </div>
        </nav>

        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Sidebar / Controls */}
          <div className="w-full md:w-1/3 lg:w-1/4 bg-[#141414] rounded-lg p-6 border border-white/5 sticky top-6">
            <h2 className="text-xl font-bold mb-6 text-white border-l-4 border-red-600 pl-3">
              Control Panel
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-medium text-gray-400 text-sm uppercase tracking-wide">
                  Number of Results
                </label>
                <input
                  type="number"
                  value={numResults}
                  onChange={(e) => setNumResults(e.target.value)}
                  className="w-full bg-[#333] border border-transparent focus:border-gray-500 rounded p-3 text-white outline-none transition"
                  min="1"
                  max="20"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-400 text-sm uppercase tracking-wide">
                  Recommendation Method
                </label>
                <div className="relative">
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-[#333] border border-transparent focus:border-gray-500 rounded p-3 text-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="hybrid">🚀 Hybrid</option>
                    <option value="collaborative">🤝 Collaborative</option>
                    <option value="content">🎭 Content-Based</option>
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">
                    ▼
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3.5 rounded font-bold hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 transition shadow-lg mt-4 uppercase tracking-wider text-sm"
                disabled={loading}
              >
                {loading ? "PROCESSING..." : "GET RECOMMENDATIONS"}
              </button>
            </form>

            {error && (
              <div className="mt-6 bg-red-900/30 text-red-400 p-4 rounded border border-red-900/50 text-sm leading-relaxed">
                {error}
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="flex-1 w-full">

            {results.length === 0 && !loading && (
              <div className="h-64 flex flex-col items-center justify-center text-center text-gray-500 border-2 border-dashed border-[#333] rounded-lg">
                <span className="text-4xl mb-4">🎬</span>
                <p className="text-lg">Ready to binge? <br /> Get your recommendations now.</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="text-red-600 mr-3 text-3xl">|</span> Top Picks For You
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {results.map((movie, index) => (
                    <div
                      key={index}
                      className="group bg-[#181818] rounded-md overflow-hidden hover:scale-105 transition-all duration-300 shadow-xl cursor-pointer relative"
                    >
                      {/* Fake Poster Placeholder */}
                      <div className="aspect-[2/3] bg-[#222] relative flex items-center justify-center overflow-hidden">
                        <span className="text-6xl opacity-10 grayscale">🎞️</span>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-white font-bold leading-tight drop-shadow-md text-lg">
                            {movie.title}
                          </p>
                          <p className="text-xs text-gray-300 mt-1 line-clamp-1 opacity-80">
                            {movie.genres}
                          </p>
                        </div>

                        {/* Score Badge */}
                        <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          {Math.round(movie.score * 100)}% Match
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
