import { useAtom } from 'jotai'

import Row from '../../Row'
import Toggle from '../../Toggle'
import { simplifyUiAtom } from '../state'
import Label from './Label'

export default function SimplifyUiToggle() {
  const [simplifyUi, toggleSimplifyUi] = useAtom(simplifyUiAtom)
  return (
    <Row>
      <Label name="Simplified UI" />
      <Toggle checked={simplifyUi} onToggle={toggleSimplifyUi} />
    </Row>
  )
}
