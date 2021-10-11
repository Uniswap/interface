import { TYPE } from '../../../themed'
import Toggle from '../../Toggle'
import { useExpertMode } from '../state/hooks'
import { Row } from './components'
import Label from './Label'

export default function ExpertModeToggle() {
  const [expertMode, setExpertMode] = useExpertMode()
  return (
    <Row>
      <Label name="Expert Mode" />
      <TYPE.text>
        <Toggle checked={expertMode} onToggle={setExpertMode} />
      </TYPE.text>
    </Row>
  )
}
