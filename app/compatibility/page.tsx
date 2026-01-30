"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Category {
  name: string;
  emoji: string;
  weight: number;
  score: number;
  description: string;
}

interface User {
  username: string;
  avatar: string;
  name: string | null;
  bio: string | null;
}

interface CompatibilityResult {
  score: number;
  verdict: {
    title: string;
    message: string;
  };
  categories: Category[];
  users: User[];
}

const LOADING_MESSAGES = [
  "Analyzing code chemistry...",
  "Checking for merge conflicts...",
  "Reading commit tea leaves...",
  "Consulting the GitHub stars...",
  "Checking if your branches align...",
  "Comparing indentation preferences...",
  "Scanning for shared dependencies...",
  "Measuring semicolon compatibility...",
  "Evaluating PR review styles...",
  "Calculating fork attraction...",
];

function FloatingHearts() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float-up text-pink-400/30"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
          }}
        >
          <Heart className="w-6 h-6" fill="currentColor" />
        </div>
      ))}
    </div>
  );
}

function InputView({
  username1,
  username2,
  setUsername1,
  setUsername2,
  onSubmit,
  error,
  isLoading,
}: {
  username1: string;
  username2: string;
  setUsername1: (v: string) => void;
  setUsername2: (v: string) => void;
  onSubmit: () => void;
  error: string | null;
  isLoading: boolean;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl border-0">
      <CardContent className="pt-8 pb-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Heart className="w-16 h-16 text-pink-500 animate-heartbeat" fill="currentColor" />
          </div>
          <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
            GitHub Compatibility
          </h1>
          <p className="font-display text-gray-600 mt-2 text-lg">Find your perfect coding match! 💕</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold font-display text-gray-700 mb-1.5">
                First GitHub Username
              </label>
              <Input
                type="text"
                placeholder="octocat"
                value={username1}
                onChange={(e) => setUsername1(e.target.value)}
                className="font-mono border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-center">
              <Heart className="w-8 h-8 text-pink-400 animate-bounce-slow" fill="currentColor" />
            </div>

            <div>
              <label className="block text-sm font-semibold font-display text-gray-700 mb-1.5">
                Second GitHub Username
              </label>
              <Input
                type="text"
                placeholder="torvalds"
                value={username2}
                onChange={(e) => setUsername2(e.target.value)}
                className="font-mono border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !username1.trim() || !username2.trim()}
            className="w-full font-display bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 tracking-wide"
          >
            Calculate Compatibility 💘
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LoadingView({ message }: { message: string }) {
  return (
    <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl border-0">
      <CardContent className="py-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <Heart
              className="w-24 h-24 text-pink-500 animate-heartbeat"
              fill="currentColor"
            />
          </div>
          <p className="font-display text-xl text-gray-700 font-semibold mb-6">{message}</p>
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce-dot-1" />
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce-dot-2" />
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce-dot-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnimatedScore({ targetScore }: { targetScore: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const duration = 2000;
    const steps = 60;
    const increment = targetScore / steps;
    const interval = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        setDisplayScore(targetScore);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [targetScore]);

  return (
    <span className="font-display text-8xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
      {displayScore}%
    </span>
  );
}

function ResultsView({
  result,
  onReset,
}: {
  result: CompatibilityResult;
  onReset: () => void;
}) {
  return (
    <div className="w-full max-w-2xl space-y-6 animate-slide-up">
      {/* Avatars Section */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-4">
            <div className="animate-slide-in-left">
              <Image
                src={result.users[0].avatar}
                alt={result.users[0].username}
                width={96}
                height={96}
                className="rounded-full border-4 border-pink-400 shadow-lg"
              />
              <p className="text-center mt-2 font-mono font-semibold text-gray-700">
                @{result.users[0].username}
              </p>
            </div>

            <div className="animate-scale-in">
              <Heart
                className="w-12 h-12 text-pink-500 animate-heartbeat"
                fill="currentColor"
              />
            </div>

            <div className="animate-slide-in-right">
              <Image
                src={result.users[1].avatar}
                alt={result.users[1].username}
                width={96}
                height={96}
                className="rounded-full border-4 border-purple-400 shadow-lg"
              />
              <p className="text-center mt-2 font-mono font-semibold text-gray-700">
                @{result.users[1].username}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Section */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 animate-scale-in">
        <CardContent className="py-10 text-center">
          <AnimatedScore targetScore={result.score} />
          <h2 className="font-display text-3xl font-bold mt-4 text-gray-800 tracking-tight">
            {result.verdict.title}
          </h2>
          <p className="font-display text-gray-600 mt-3 max-w-md mx-auto text-lg leading-relaxed">
            {result.verdict.message}
          </p>
        </CardContent>
      </Card>

      {/* Categories Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.categories.map((category, index) => (
          <Card
            key={category.name}
            className="bg-white/90 backdrop-blur-sm shadow-lg border-0 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-semibold text-gray-700">
                  {category.emoji} {category.name}
                </span>
                <span className="font-display font-bold text-purple-600">{category.score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-fill-bar"
                  style={{
                    width: `${category.score}%`,
                    animationDelay: `${index * 100 + 300}ms`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {category.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reset Button */}
      <div className="text-center">
        <Button
          onClick={onReset}
          className="font-display bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-6 px-8 text-lg shadow-lg hover:shadow-xl transition-all duration-300 tracking-wide"
        >
          Try Another Pair 💕
        </Button>
      </div>
    </div>
  );
}

function CompatibilityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const urlUser1 = searchParams.get("user1") || "";
  const urlUser2 = searchParams.get("user2") || "";
  
  const [username1, setUsername1] = useState(urlUser1);
  const [username2, setUsername2] = useState(urlUser2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchCompatibility = useCallback(async (user1: string, user2: string) => {
    setError(null);
    setIsLoading(true);
    setLoadingMessage(LOADING_MESSAGES[0]);

    try {
      const response = await fetch("/api/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username1: user1, username2: user2 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch when URL has both usernames
  useEffect(() => {
    if (urlUser1 && urlUser2 && !hasFetched && !result) {
      setHasFetched(true);
      setUsername1(urlUser1);
      setUsername2(urlUser2);
      fetchCompatibility(urlUser1, urlUser2);
    }
  }, [urlUser1, urlUser2, hasFetched, result, fetchCompatibility]);

  // Rotate loading messages
  useEffect(() => {
    if (!isLoading) return;

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = () => {
    // Navigate to URL with query params
    const params = new URLSearchParams({
      user1: username1.trim(),
      user2: username2.trim(),
    });
    router.push(`/compatibility?${params.toString()}`);
    
    // Also trigger the fetch
    setHasFetched(true);
    fetchCompatibility(username1.trim(), username2.trim());
  };

  const handleReset = () => {
    setResult(null);
    setUsername1("");
    setUsername2("");
    setError(null);
    setHasFetched(false);
    // Clear URL params
    router.push("/compatibility");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-pink-500 flex items-center justify-center p-4">
      <FloatingHearts />

      <div className="relative z-10 flex flex-col items-center">
        {!isLoading && !result && (
          <InputView
            username1={username1}
            username2={username2}
            setUsername1={setUsername1}
            setUsername2={setUsername2}
            onSubmit={handleSubmit}
            error={error}
            isLoading={isLoading}
          />
        )}

        {isLoading && <LoadingView message={loadingMessage} />}

        {result && <ResultsView result={result} onReset={handleReset} />}
      </div>
    </div>
  );
}

export default function CompatibilityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-pink-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl border-0">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <Heart className="w-24 h-24 text-pink-500 animate-heartbeat" fill="currentColor" />
              </div>
              <p className="font-display text-xl text-gray-700 font-semibold">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <CompatibilityContent />
    </Suspense>
  );
}
