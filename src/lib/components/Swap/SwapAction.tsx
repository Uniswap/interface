import styled from 'lib/theme'
import TYPE from 'lib/theme/type'

import Button from '../Button'

export const ActionButton = styled(Button)`
  border: 1px solid ${({ theme }) => theme.outline};
  border-radius: 0.5em;
  height: 3.5em;
`

export default function SwapAction() {
  return (
    <ActionButton disabled>
      <TYPE.buttonLarge>Enter amount</TYPE.buttonLarge>
    </ActionButton>
  )
}
