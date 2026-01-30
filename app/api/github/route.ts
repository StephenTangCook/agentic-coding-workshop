import { NextResponse } from "next/server";

const USERNAME = "StephenTangCook";

interface GitHubProfile {
  login: string;
  avatar_url: string;
  name: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
  payload: Record<string, unknown>;
}

function summarizeEvent(event: GitHubEvent): string {
  const repo = event.repo.name;
  switch (event.type) {
    case "PushEvent": {
      const commits = (event.payload.commits as { message: string }[]) || [];
      return `Pushed ${commits.length} commit${commits.length !== 1 ? "s" : ""} to ${repo}`;
    }
    case "CreateEvent":
      return `Created ${event.payload.ref_type} in ${repo}`;
    case "DeleteEvent":
      return `Deleted ${event.payload.ref_type} in ${repo}`;
    case "WatchEvent":
      return `Starred ${repo}`;
    case "ForkEvent":
      return `Forked ${repo}`;
    case "IssuesEvent":
      return `${event.payload.action} issue in ${repo}`;
    case "IssueCommentEvent":
      return `Commented on issue in ${repo}`;
    case "PullRequestEvent":
      return `${event.payload.action} PR in ${repo}`;
    case "PullRequestReviewEvent":
      return `Reviewed PR in ${repo}`;
    case "ReleaseEvent":
      return `${event.payload.action} release in ${repo}`;
    default:
      return `${event.type.replace("Event", "")} in ${repo}`;
  }
}

export async function GET() {
  try {
    const [profileRes, reposRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${USERNAME}`, {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 300 },
      }),
      fetch(
        `https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=10`,
        {
          headers: { Accept: "application/vnd.github.v3+json" },
          next: { revalidate: 300 },
        }
      ),
      fetch(
        `https://api.github.com/users/${USERNAME}/events/public?per_page=30`,
        {
          headers: { Accept: "application/vnd.github.v3+json" },
          next: { revalidate: 300 },
        }
      ),
    ]);

    if (!profileRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch GitHub profile" },
        { status: profileRes.status }
      );
    }

    const profile: GitHubProfile = await profileRes.json();
    const repos: GitHubRepo[] = reposRes.ok ? await reposRes.json() : [];
    const events: GitHubEvent[] = eventsRes.ok ? await eventsRes.json() : [];

    const activity = events.map((event) => ({
      id: event.id,
      type: event.type,
      repo: event.repo.name,
      summary: summarizeEvent(event),
      created_at: event.created_at,
    }));

    return NextResponse.json({
      profile: {
        login: profile.login,
        avatar_url: profile.avatar_url,
        name: profile.name,
        company: profile.company,
        location: profile.location,
        bio: profile.bio,
        public_repos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        html_url: profile.html_url,
      },
      repos: repos.map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        html_url: r.html_url,
        description: r.description,
        language: r.language,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        updated_at: r.updated_at,
      })),
      activity,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch GitHub data" },
      { status: 500 }
    );
  }
}
