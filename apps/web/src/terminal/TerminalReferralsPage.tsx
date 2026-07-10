import { ReferralsScreen } from '~/terminal/screens/ReferralsScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalReferralsPage(): JSX.Element {
  return (
    <TerminalChrome activeId="referrals">
      <ReferralsScreen />
    </TerminalChrome>
  )
}
