import { LeaderboardScreen } from '~/terminal/screens/LeaderboardScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalLeaderboardPage(): JSX.Element {
  return (
    <TerminalChrome activeId="leaderboard">
      <LeaderboardScreen />
    </TerminalChrome>
  )
}
