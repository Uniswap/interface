import { TYPE } from 'lib/themed'

import Toggle from '../../Toggle'
import { useMultihop } from '../state/hooks'
import { Row } from './components'
import Label from './Label'

export default function MultihopToggle() {
  const [multihop, toggleMultihop] = useMultihop()
  return (
    <Row>
      <Label name="Multihop" />
      <TYPE.text>
        <Toggle checked={multihop} onToggle={toggleMultihop} />
      </TYPE.text>
    </Row>
  )
}
