import { useState } from "react";

interface Props {
    showSignOut?: boolean;
    onSignOut?: () => void;
    isLogin?: boolean;
    onToggleAuth?: () => void;
}

export default function Navbar({ showSignOut, onSignOut, isLogin, onToggleAuth }: Props) {
    return (
        <nav className="relative z-20 flex justify-between items-center px-8 py-6 w-full max-w-7xl mx-auto">
            <h1 className="text-red-600 text-4xl font-bold tracking-tighter uppercase cursor-pointer" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                BingeBox
            </h1>

            <div className="flex gap-4">
                {onToggleAuth && (
                    <button
                        onClick={onToggleAuth}
                        className="text-white bg-red-600 px-4 py-1.5 rounded text-sm font-medium hover:bg-red-700 transition"
                    >
                        {isLogin ? "Sign Up" : "Sign In"}
                    </button>
                )}

                {showSignOut && (
                    <button
                        onClick={onSignOut}
                        className="text-white bg-transparent border border-white px-4 py-1.5 rounded text-sm font-medium hover:bg-white/10 transition"
                    >
                        Sign Out
                    </button>
                )}
            </div>
        </nav>
    );
}
