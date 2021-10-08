import Widget from '../Widget'
import { SettingsModal } from './Settings'

interface SwapProps {
  darkMode: boolean
}

function SwapSettings({ darkMode = true }: SwapProps) {
  return (
    <Widget darkMode={darkMode}>
      <SettingsModal onClose={() => undefined} />
    </Widget>
  )
}

export default <SwapSettings darkMode={true} />
