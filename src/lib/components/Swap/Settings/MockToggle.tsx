import { useAtom } from 'jotai'

import Row from '../../Row'
import Toggle from '../../Toggle'
import { mockTogglableAtom } from '../state'
import Label from './Label'

export default function MockToggle() {
  const [simplifyUi, toggleSimplifyUi] = useAtom(mockTogglableAtom)
  return (
    <Row>
      <Label name="Simplified UI" />
      <Toggle checked={simplifyUi} onToggle={toggleSimplifyUi} />
    </Row>
  )
}
