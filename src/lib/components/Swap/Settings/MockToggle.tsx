import { Trans } from '@lingui/macro'
import { useAtom } from 'jotai'

import Row from '../../Row'
import Toggle from '../../Toggle'
import { mockTogglableAtom } from '../state'
import { Label } from './components'

export default function MockToggle() {
  const [mockTogglable, toggleMockTogglable] = useAtom(mockTogglableAtom)
  return (
    <Row>
      <Label name={<Trans>Mock Toggle</Trans>} />
      <Toggle checked={mockTogglable} onToggle={toggleMockTogglable} />
    </Row>
  )
}
