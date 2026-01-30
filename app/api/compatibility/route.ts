import { NextResponse } from "next/server";

interface GitHubProfile {
  login: string;
  avatar_url: string;
  name: string | null;
  bio: string | null;
}

interface GitHubRepo {
  language: string | null;
  full_name: string;
}

interface GitHubEvent {
  type: string;
  created_at: string;
}

interface StarredRepo {
  full_name: string;
}

async function fetchGitHub(url: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (res.status === 403 || res.status === 429) throw new Error("RATE_LIMIT");
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

async function fetchUserData(username: string) {
  const [profile, repos, events, starred] = await Promise.all([
    fetchGitHub(`https://api.github.com/users/${username}`) as Promise<GitHubProfile>,
    fetchGitHub(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`) as Promise<GitHubRepo[]>,
    fetchGitHub(`https://api.github.com/users/${username}/events/public?per_page=100`) as Promise<GitHubEvent[]>,
    fetchGitHub(`https://api.github.com/users/${username}/starred?per_page=100`) as Promise<StarredRepo[]>,
  ]);
  return { profile, repos, events, starred };
}

function getLanguages(repos: GitHubRepo[]): Set<string> {
  const langs = new Set<string>();
  for (const repo of repos) {
    if (repo.language) langs.add(repo.language);
  }
  return langs;
}

function getCodingHours(events: GitHubEvent[]): number[] {
  const hours = new Array(24).fill(0);
  for (const event of events) {
    const hour = new Date(event.created_at).getUTCHours();
    hours[hour]++;
  }
  return hours;
}

function languageChemistry(langs1: Set<string>, langs2: Set<string>): number {
  if (langs1.size === 0 && langs2.size === 0) return 50;
  const all = new Set([...langs1, ...langs2]);
  const shared = [...langs1].filter((l) => langs2.has(l));
  if (all.size === 0) return 50;
  return (shared.length / all.size) * 100;
}

function scheduleSync(hours1: number[], hours2: number[]): number {
  const total1 = hours1.reduce((a, b) => a + b, 0);
  const total2 = hours2.reduce((a, b) => a + b, 0);
  if (total1 === 0 || total2 === 0) return 50;

  const norm1 = hours1.map((h) => h / total1);
  const norm2 = hours2.map((h) => h / total2);

  let overlap = 0;
  for (let i = 0; i < 24; i++) {
    overlap += Math.min(norm1[i], norm2[i]);
  }
  return overlap * 100;
}

function starCrossedRepos(starred1: StarredRepo[], starred2: StarredRepo[]): number {
  if (starred1.length === 0 && starred2.length === 0) return 50;
  const set1 = new Set(starred1.map((r) => r.full_name));
  const set2 = new Set(starred2.map((r) => r.full_name));
  const all = new Set([...set1, ...set2]);
  const shared = [...set1].filter((r) => set2.has(r));
  if (all.size === 0) return 50;
  return (shared.length / all.size) * 100;
}

function commitFrequencyHarmony(events1: GitHubEvent[], events2: GitHubEvent[]): number {
  const pushes1 = events1.filter((e) => e.type === "PushEvent").length;
  const pushes2 = events2.filter((e) => e.type === "PushEvent").length;
  if (pushes1 === 0 && pushes2 === 0) return 50;
  const max = Math.max(pushes1, pushes2);
  const min = Math.min(pushes1, pushes2);
  if (max === 0) return 50;
  return (min / max) * 100;
}

function complementarySkills(langs1: Set<string>, langs2: Set<string>): number {
  if (langs1.size === 0 && langs2.size === 0) return 50;
  const unique1 = [...langs1].filter((l) => !langs2.has(l));
  const unique2 = [...langs2].filter((l) => !langs1.has(l));
  const totalUnique = unique1.length + unique2.length;
  const all = new Set([...langs1, ...langs2]);
  if (all.size === 0) return 50;
  // Some unique langs are good (complementary), but too many means nothing in common
  const ratio = totalUnique / all.size;
  // Sweet spot around 30-60% unique
  if (ratio <= 0.5) return 50 + ratio * 100;
  return 100 - (ratio - 0.5) * 100;
}

function getVerdict(score: number): { title: string; message: string } {
  if (score >= 90)
    return {
      title: "Match Made in Git Heaven! 💘",
      message: "You two were destined to pair program together. Fork each other's repos immediately!",
    };
  if (score >= 80)
    return {
      title: "Highly Compatible! 💕",
      message: "Your code styles are like perfectly matched brackets. Time to collaborate!",
    };
  if (score >= 70)
    return {
      title: "Strong Connection! 💖",
      message: "You'd make a great team. Your merge conflicts would be minimal!",
    };
  if (score >= 60)
    return {
      title: "Good Match! 💝",
      message: "There's real potential here. Maybe start with a small PR together?",
    };
  if (score >= 50)
    return {
      title: "It Could Work! 💓",
      message: "With some rebasing and communication, this could be something special.",
    };
  if (score >= 40)
    return {
      title: "Opposites Attract! 💗",
      message: "Different tech stacks, but that's what makes open source beautiful!",
    };
  return {
    title: "Unique Pairing! 🤔",
    message: "You're like tabs and spaces — different, but the code still runs!",
  };
}

export async function POST(request: Request) {
  try {
    const { username1, username2 } = await request.json();

    if (!username1 || !username2) {
      return NextResponse.json({ error: "Two usernames are required" }, { status: 400 });
    }

    if (username1.toLowerCase() === username2.toLowerCase()) {
      return NextResponse.json(
        { error: "Self-love is important, but try someone else!" },
        { status: 400 }
      );
    }

    let user1Data, user2Data;
    try {
      [user1Data, user2Data] = await Promise.all([
        fetchUserData(username1),
        fetchUserData(username2),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "NOT_FOUND") {
          return NextResponse.json({ error: "One or both users not found" }, { status: 404 });
        }
        if (err.message === "RATE_LIMIT") {
          return NextResponse.json(
            { error: "GitHub API rate limit exceeded. Try again later or set a GITHUB_TOKEN." },
            { status: 403 }
          );
        }
      }
      throw err;
    }

    const langs1 = getLanguages(user1Data.repos);
    const langs2 = getLanguages(user2Data.repos);
    const hours1 = getCodingHours(user1Data.events);
    const hours2 = getCodingHours(user2Data.events);

    const categories = [
      {
        name: "Language Chemistry",
        emoji: "🧪",
        weight: 0.25,
        score: Math.round(languageChemistry(langs1, langs2)),
      },
      {
        name: "Schedule Sync",
        emoji: "🕐",
        weight: 0.2,
        score: Math.round(scheduleSync(hours1, hours2)),
      },
      {
        name: "Star-Crossed Repos",
        emoji: "⭐",
        weight: 0.25,
        score: Math.round(starCrossedRepos(user1Data.starred, user2Data.starred)),
      },
      {
        name: "Commit Frequency",
        emoji: "📊",
        weight: 0.15,
        score: Math.round(commitFrequencyHarmony(user1Data.events, user2Data.events)),
      },
      {
        name: "Complementary Skills",
        emoji: "🧩",
        weight: 0.15,
        score: Math.round(complementarySkills(langs1, langs2)),
      },
    ];

    const totalScore = Math.round(
      categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0)
    );

    const verdict = getVerdict(totalScore);

    return NextResponse.json({
      score: totalScore,
      verdict,
      categories,
      users: [
        {
          username: user1Data.profile.login,
          avatar: user1Data.profile.avatar_url,
          name: user1Data.profile.name,
          bio: user1Data.profile.bio,
        },
        {
          username: user2Data.profile.login,
          avatar: user2Data.profile.avatar_url,
          name: user2Data.profile.name,
          bio: user2Data.profile.bio,
        },
      ],
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
