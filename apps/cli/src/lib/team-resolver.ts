import { $ } from 'bun'

interface UserResolution {
  username?: string
  emails: string[]
}

interface GitHubCommitSearchItem {
  commit?: {
    author?: {
      email?: string
    }
  }
}

interface GitHubCommitSearchResult {
  items?: GitHubCommitSearchItem[]
}

interface GitHubUserData {
  id?: number
  email?: string
  login?: string
}

/**
 * Resolves a team reference or username to email addresses
 * Supports:
 * - GitHub teams: @org/team
 * - GitHub usernames: alice, bob
 * - Email addresses: alice@example.com
 * - Mixed: @org/team,alice,bob@example.com
 */
export async function resolveTeam(teamRef: string): Promise<{ emails: string[]; usernames: string[] }> {
  const parts = teamRef
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  const allEmails: string[] = []
  const allUsernames: string[] = []

  for (const part of parts) {
    if (part.startsWith('@')) {
      // GitHub team reference
      const { emails, usernames } = await resolveGitHubTeam(part)
      allEmails.push(...emails)
      allUsernames.push(...usernames)
    } else if (part.includes('@')) {
      // Already an email
      allEmails.push(part)
    } else {
      // GitHub username
      const resolution = await resolveUserToEmail(part)
      allEmails.push(...resolution.emails)
      if (resolution.username) {
        allUsernames.push(resolution.username)
      }
    }
  }

  return {
    emails: [...new Set(allEmails)], // Remove duplicates
    usernames: [...new Set(allUsernames)],
  }
}

async function resolveGitHubTeam(teamRef: string): Promise<{ emails: string[]; usernames: string[] }> {
  // Parse @org/team format
  const [org, team] = teamRef.slice(1).split('/')

  if (!org || !team) {
    throw new Error(`Invalid team reference: ${teamRef}. Expected format: @org/team`)
  }

  try {
    // Get team members
    const membersResult = await $`gh api /orgs/${org}/teams/${team}/members --jq '.[].login'`.text()
    const members = membersResult.split('\n').filter(Boolean)

    // Resolve each member to emails
    const emails: string[] = []
    const usernames: string[] = []

    for (const member of members) {
      const resolution = await resolveUserToEmail(member)
      emails.push(...resolution.emails)
      if (resolution.username) {
        usernames.push(resolution.username)
      }
    }

    return { emails, usernames }
  } catch (_error) {
    throw new Error(`Failed to resolve team ${teamRef}. Ensure gh CLI is authenticated and team exists.`)
  }
}

async function resolveUserToEmail(user: string): Promise<UserResolution> {
  // If it contains @, it's already an email
  if (user.includes('@')) {
    return { emails: [user] }
  }

  // Otherwise, treat it as a GitHub username
  try {
    const userDataResult = await $`gh api /users/${user}`.text()
    const userData = JSON.parse(userDataResult) as GitHubUserData

    // Get user's email from their profile (if public)
    const emails: string[] = []
    if (userData.email) {
      emails.push(userData.email)
    }

    // Also try to get commit email by searching for their commits
    try {
      const searchResult = await $`gh api /search/commits?q=author:${user}&per_page=5`.text()
      const searchData = JSON.parse(searchResult) as GitHubCommitSearchResult

      if (searchData.items && searchData.items.length > 0) {
        const commitEmails = searchData.items
          .map((item) => item.commit?.author?.email)
          .filter((email): email is string => typeof email === 'string' && !emails.includes(email))

        emails.push(...commitEmails)
      }
    } catch {
      // Commit search failed, continue with what we have
    }

    if (emails.length === 0 && userData.id) {
      // Fallback: use GitHub's noreply email format
      emails.push(`${userData.id}+${user}@users.noreply.github.com`)
    }

    return { username: user, emails }
  } catch (_error) {
    throw new Error(`Failed to resolve GitHub username "${user}". User may not exist or gh CLI is not configured.`)
  }
}

/**
 * Detects repository from git remote
 */
export async function detectRepository(): Promise<{ owner: string; name: string } | null> {
  try {
    const remote = await $`git config --get remote.origin.url`.text()
    const match = remote.trim().match(/github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/)
    if (match?.[1] && match[2]) {
      return { owner: match[1], name: match[2] }
    }
  } catch {
    // Not a git repo or no remote configured
  }
  return null
}
