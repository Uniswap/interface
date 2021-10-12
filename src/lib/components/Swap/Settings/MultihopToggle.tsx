import { TYPE } from '../../../themed'
import Toggle from '../../Toggle'
import { useMultihop } from '../state/hooks'
import { Row } from './components'
import Label from './Label'

const tooltip = 'Lorem ipsum dolores park'

export default function MultihopToggle() {
  const [multihop, setMultihop] = useMultihop()
  return (
    <Row>
      <Label name="Multihop" tooltip={tooltip} />
      <TYPE.text>
        <Toggle checked={multihop} onToggle={setMultihop} />
      </TYPE.text>
    </Row>
  )
}
