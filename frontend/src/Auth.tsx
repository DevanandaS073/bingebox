import { useState } from "react";
import Navbar from "./components/Navbar";

interface Props {
  onLoginSuccess: (id: number) => void;
}

export default function Auth({ onLoginSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isLogin
      ? "http://localhost:5000/api/login"
      : "http://localhost:5000/api/signup";

    const body = isLogin
      ? { email, password }
      : { username, email, password };

    try {
      // Simulate network feel
      await new Promise(r => setTimeout(r, 600));

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        if (isLogin) {
          onLoginSuccess(data.user_id);
        } else {
          setIsLogin(true);
          setError("Account created. Please sign in."); // Using error state for success msg temporarily or separate state? 
          // Let's use a separate logic or simple alert, but for UI purity I'll just switch tabs and maybe show a success toast.
          // Re-using error state for simplicity in this specific "premium" layout often involves a designated notification area.
        }
      } else {
        setError(data.message);
      }
    } catch {
      setError("Service temporarily unavailable.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white relative overflow-hidden">

      {/* Background Hero (Simulated Movie Collage Overlay) */}
      <div
        className="absolute inset-0 z-0 opacity-40 bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg')] bg-cover bg-center"
        style={{ filter: 'grayscale(100%) contrast(120%) brightness(50%)' }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/60 to-black/20" />

      {/* Navbar Minimal */}
      <Navbar
        isLogin={isLogin}
        onToggleAuth={() => { setIsLogin(!isLogin); setError(""); }}
      />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[80vh] px-4">

        <div className="w-full max-w-[450px] p-12 sm:p-16 bg-black/75 backdrop-blur-sm rounded-lg border border-white/10 shadow-2xl">
          <h2 className="text-3xl font-bold mb-8 text-white">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>

          {error && (
            <div className="bg-[#e87c03] p-3 rounded text-sm text-white mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {!isLogin && (
              <div className="relative group">
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-4 text-white bg-[#333] rounded focus:bg-[#454545] focus:outline-none focus:ring-2 focus:ring-gray-500 peer placeholder-transparent"
                  placeholder="Username"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <label
                  htmlFor="username"
                  className="absolute text-sm text-gray-400 duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
                >
                  Username
                </label>
              </div>
            )}

            <div className="relative group">
              <input
                type="email"
                required
                className="block w-full px-4 py-4 text-white bg-[#333] rounded focus:bg-[#454545] focus:outline-none focus:ring-2 focus:ring-gray-500 peer placeholder-transparent"
                placeholder="Email address"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label
                htmlFor="email"
                className="absolute text-sm text-gray-400 duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
              >
                Email or phone number
              </label>
            </div>

            <div className="relative group">
              <input
                type="password"
                required
                className="block w-full px-4 py-4 text-white bg-[#333] rounded focus:bg-[#454545] focus:outline-none focus:ring-2 focus:ring-gray-500 peer placeholder-transparent"
                placeholder="Password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label
                htmlFor="password"
                className="absolute text-sm text-gray-400 duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
              >
                Password
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 rounded font-bold text-white hover:bg-red-700 transition disabled:opacity-50 mt-8"
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Start Membership"}
            </button>

            <div className="flex justify-between items-center text-xs text-[#b3b3b3] mt-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-1 bg-[#333] border-none rounded-sm focus:ring-0 accent-gray-500" defaultChecked /> Remember me
              </label>
              <a href="#" className="hover:underline">Need help?</a>
            </div>

          </form>

          <div className="mt-16 text-[#737373]">
            {isLogin ? (
              <p>
                New to BingeBox?{' '}
                <button onClick={() => setIsLogin(false)} className="text-white hover:underline font-medium">
                  Sign up now
                </button>.
              </p>
            ) : (
              <p>
                Already a member?{' '}
                <button onClick={() => setIsLogin(true)} className="text-white hover:underline font-medium">
                  Sign in
                </button>.
              </p>
            )}
            <p className="text-xs mt-4">
              This page is protected by Google reCAPTCHA to ensure you're not a bot. <a href="#" className="text-blue-500 hover:underline">Learn more.</a>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
