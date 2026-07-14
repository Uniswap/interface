import { AirdropScreen } from '~/terminal/screens/AirdropScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalAirdropPage(): JSX.Element {
  return (
    <TerminalChrome activeId="airdrop">
      <AirdropScreen />
    </TerminalChrome>
  )
}
