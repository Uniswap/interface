import Badge, { BadgeVariant } from 'components/Badge'
import { opacify } from 'theme/utils'
import { Check, Shield } from 'react-feather'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'

const StyledBadge = styled(Badge)`
  color: ${({ theme }) => theme.success};
  background: ${({ theme }) => theme.surface3};
  font-size: 12px;
  border-radius: 16px;
  padding: 4px 8px 4px 8px;
  height: 32px;
`
const IconContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 4px;
`
const StyledCheck = styled(Check)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  width: 50%;
  height: 50%;
`
export function ProtectedBadge() {
  const theme = useTheme()
  return (
    <StyledBadge variant={BadgeVariant.SOFT}>
      <IconContainer>
        <Shield fill={opacify(40, theme.success)} size={15} />
        <StyledCheck />
      </IconContainer>
      <Text fontSize={12}>Frontrun Protected</Text>
    </StyledBadge>
  )
}
