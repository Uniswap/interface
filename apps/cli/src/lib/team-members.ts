import { $ } from 'bun'

export interface TeamMember {
  login: string
  name: string | null
}

/**
 * Fetches team members from a GitHub organization team
 * Returns members with their login and display name
 */
export async function fetchTeamMembers(org: string, teamSlug: string): Promise<TeamMember[]> {
  try {
    // Get team members (just logins)
    const membersResult = await $`gh api /orgs/${org}/teams/${teamSlug}/members --jq '.[].login'`.text()
    const logins = membersResult.split('\n').filter(Boolean)

    // Fetch detailed user info for each member
    const members: TeamMember[] = []
    for (const login of logins) {
      try {
        const userResult = await $`gh api /users/${login} --jq '{login: .login, name: .name}'`.text()
        const userData = JSON.parse(userResult) as TeamMember
        members.push(userData)
      } catch {
        // If fetching user details fails, just use the login
        members.push({ login, name: null })
      }
    }

    return members
  } catch (error) {
    throw new Error(`Failed to fetch members for team ${teamSlug}. Ensure gh CLI is authenticated and team exists.`, {
      cause: error,
    })
  }
}
