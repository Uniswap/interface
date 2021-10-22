import { useAtom } from 'jotai'

import Row from '../../Row'
import Toggle from '../../Toggle'
import { mockTogglableAtom } from '../state'
import Label from './Label'

export default function MockToggle() {
  const [mockTogglable, toggleMockTogglable] = useAtom(mockTogglableAtom)
  return (
    <Row>
      <Label name="Mock Toggle" />
      <Toggle checked={mockTogglable} onToggle={toggleMockTogglable} />
    </Row>
  )
}
