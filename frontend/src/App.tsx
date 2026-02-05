import { useState } from "react";
import Auth from "./Auth";
import Preferences from "./Preferences";
import RateMovies from "./RateMovies";
import Dashboard from "./Dashboard";

export default function App() {

  const [step, setStep] = useState<"auth" | "preferences" | "rate" | "dashboard">("auth");
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  if (step === "auth") {
    return (
      <Auth
        onLoginSuccess={(id: number) => {
          setUserId(id);
          setStep("preferences");
        }}
      />
    );
  }

  if (step === "preferences") {
    return (
      <Preferences
        userId={userId!}
        onNext={(genres) => {
          setSelectedGenres(genres);
          setStep("rate");
        }}
      />
    );
  }

  if (step === "rate") {
    return <RateMovies userId={userId!} selectedGenres={selectedGenres} onFinish={() => setStep("dashboard")} />;
  }

  return <Dashboard userId={userId!} />;
}
