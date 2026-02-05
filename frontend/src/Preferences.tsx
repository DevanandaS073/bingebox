import { useState } from "react";

interface Props {
  onNext: (genres: string[]) => void;
}

export default function Preferences({ userId, onNext }: { userId: number; onNext: (genres: string[]) => void }) {

  const moods = ["Happy", "Funny", "Sad", "Quirky", "Romantic", "Action"];
  // ... (rest of constants same as before)
  const genres = ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Thriller", "Romance"];

  const [selectedMood, setSelectedMood] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleContinue = async () => {
    if (!selectedMood || selectedGenres.length === 0) {
      alert("Please select a mood and at least one genre 🙂");
      return;
    }

    // Save to backend
    try {
      console.log("Sending preferences to backend...", { user_id: userId, genres: selectedGenres, mood: selectedMood });

      const response = await fetch("http://localhost:5000/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          genres: selectedGenres,
          mood: selectedMood
        })
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        onNext(selectedGenres);
      } else {
        alert("Failed to save: " + (data.message || "Unknown error"));
      }
    } catch (e: any) {
      console.error("Fetch Error:", e);
      alert("Backend Error: " + (e.message || "Unknown"));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Simple Navbar for Flow */}
        <nav className="flex justify-between items-center py-6">
          <h1 className="text-red-600 text-4xl font-bold tracking-tighter uppercase" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            BingeBox
          </h1>
        </nav>

        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="bg-black/75 backdrop-blur-sm border border-white/10 w-full max-w-2xl rounded-lg p-8 md:p-12 space-y-10 shadow-2xl">

            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold text-white">
                Your Preferences
              </h2>
              <p className="text-gray-400 text-lg">
                Let us personalize your BingeBox experience.
              </p>
            </div>

            {/* Mood */}
            <div>
              <p className="font-semibold text-gray-300 mb-4 text-lg">
                How are you feeling today?
              </p>

              <div className="grid grid-cols-3 gap-4">
                {moods.map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`py-3 rounded text-sm font-medium transition-all duration-200
                      ${selectedMood === mood
                        ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transform scale-105"
                        : "bg-[#333] text-gray-300 hover:bg-[#444] hover:text-white"
                      }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div>
              <p className="font-semibold text-gray-300 mb-4 text-lg">
                Favorite genres
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {genres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`py-2 px-3 rounded text-sm font-medium transition-all duration-200
                      ${selectedGenres.includes(genre)
                        ? "bg-white text-black font-bold shadow-lg transform scale-105"
                        : "border border-gray-600 text-gray-400 hover:border-white hover:text-white"
                      }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Button */}
            <button
              onClick={handleContinue}
              className="w-full py-4 bg-red-600 rounded text-xl font-bold text-white hover:bg-red-700 transition disabled:opacity-50 shadow-lg mt-4"
            >
              Continue
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}


