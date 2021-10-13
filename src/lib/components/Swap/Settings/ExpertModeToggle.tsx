import { TYPE } from 'lib/themed'

import Toggle from '../../Toggle'
import { useExpertMode } from '../state/hooks'
import { Row } from './components'
import Label from './Label'

const tooltip = 'Allow high impact trades and skip the confirmation screen. Use at your own risk.'

export default function ExpertModeToggle() {
  const [expertMode, toggleExpertMode] = useExpertMode()
  return (
    <Row>
      <Label name="Expert Mode" tooltip={tooltip} />
      <TYPE.text>
        <Toggle checked={expertMode} onToggle={toggleExpertMode} />
      </TYPE.text>
    </Row>
  )
}
