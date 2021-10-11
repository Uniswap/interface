import { TYPE } from '../../../themed'
import Toggle from '../../Toggle'
import { useMultihop } from '../state/hooks'
import { Row } from './components'
import Label from './Label'

export default function MultihopToggle() {
  const [multihop, setMultihop] = useMultihop()
  return (
    <Row>
      <Label name="Multihop" />
      <TYPE.text>
        <Toggle checked={multihop} onToggle={setMultihop} />
      </TYPE.text>
    </Row>
  )
}
