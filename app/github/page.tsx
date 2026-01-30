import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  MapPin,
  Building2,
  Users,
  GitFork,
  Star,
  ExternalLink,
  Activity,
} from "lucide-react";

const USERNAME = "StephenTangCook";

interface ProfileData {
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

interface RepoData {
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

interface ActivityData {
  id: string;
  type: string;
  repo: string;
  summary: string;
  created_at: string;
}

interface GitHubData {
  profile: ProfileData;
  repos: RepoData[];
  activity: ActivityData[];
  error?: string;
}

async function getGitHubData(): Promise<GitHubData> {
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

  const profile = await profileRes.json();
  const repos = reposRes.ok ? await reposRes.json() : [];
  const rawEvents = eventsRes.ok ? await eventsRes.json() : [];

  const activity = rawEvents.map(
    (event: { id: string; type: string; repo: { name: string }; created_at: string; payload: Record<string, unknown> }) => ({
      id: event.id,
      type: event.type,
      repo: event.repo.name,
      summary: summarizeEvent(event),
      created_at: event.created_at,
    })
  );

  return { profile, repos, activity };
}

function summarizeEvent(event: {
  type: string;
  repo: { name: string };
  payload: Record<string, unknown>;
}): string {
  const repo = event.repo.name;
  switch (event.type) {
    case "PushEvent": {
      const commits = (event.payload.commits as { message: string }[]) || [];
      return `Pushed ${commits.length} commit${commits.length !== 1 ? "s" : ""} to ${repo}`;
    }
    case "CreateEvent":
      return `Created ${event.payload.ref_type} in ${repo}`;
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
    default:
      return `${event.type.replace("Event", "")} in ${repo}`;
  }
}

const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-500",
  Rust: "bg-orange-600",
  Go: "bg-cyan-500",
  Java: "bg-red-500",
  Ruby: "bg-red-600",
  CSS: "bg-purple-500",
  HTML: "bg-orange-500",
  Shell: "bg-green-400",
};

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default async function GitHubPage() {
  const data = await getGitHubData();
  const { profile, repos, activity } = data;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          GitHub Activity Summary
        </h1>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatar_url}
                alt={profile.login}
                className="h-20 w-20 rounded-full"
              />
              <div className="space-y-1">
                <CardTitle>
                  <a
                    href={profile.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {profile.name || profile.login}
                  </a>
                </CardTitle>
                <CardDescription>@{profile.login}</CardDescription>
                {profile.bio && (
                  <p className="text-sm text-foreground/70">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-foreground/70">
              {profile.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {profile.company}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {profile.followers} followers · {profile.following} following
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="h-4 w-4" />
                {profile.public_repos} repos
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Repos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Repositories</CardTitle>
            <CardDescription>
              Recently updated public repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-foreground/10">
              {repos.map((repo) => (
                <div key={repo.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-500 hover:underline"
                      >
                        {repo.name}
                        <ExternalLink className="ml-1 inline h-3 w-3" />
                      </a>
                      {repo.description && (
                        <p className="mt-0.5 text-sm text-foreground/60 line-clamp-1">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-foreground/50">
                      {timeAgo(repo.updated_at)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-foreground/50">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${languageColors[repo.language] || "bg-gray-400"}`}
                        />
                        {repo.language}
                      </span>
                    )}
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3" />
                        {repo.stargazers_count}
                      </span>
                    )}
                    {repo.forks_count > 0 && (
                      <span className="flex items-center gap-0.5">
                        <GitFork className="h-3 w-3" />
                        {repo.forks_count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {repos.length === 0 && (
                <p className="text-sm text-foreground/50">
                  No public repositories found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Public events from the last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activity.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-foreground/5"
                >
                  <span className="text-foreground/80">{event.summary}</span>
                  <span className="shrink-0 text-xs text-foreground/40">
                    {timeAgo(event.created_at)}
                  </span>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-sm text-foreground/50">
                  No recent public activity.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
