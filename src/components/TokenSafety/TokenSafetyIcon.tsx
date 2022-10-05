import { ReactComponent as Verified } from 'assets/svg/verified.svg'
import { Warning } from 'constants/tokenSafety'
import styled from 'styled-components/macro'
import { colors } from 'theme/colors'

const VerifiedContainer = styled.div`
  margin-left: 4px;
  display: flex;
  justify-content: center;
`

export const VerifiedIcon = styled(Verified)<{ size?: string }>`
  width: ${({ size }) => size ?? '1em'};
  height: ${({ size }) => size ?? '1em'};
  color: ${colors.magentaVibrant};
`

export default function TokenSafetyIcon({ warning }: { warning: Warning | null }) {
  if (warning) return null
  return (
    <VerifiedContainer>
      <VerifiedIcon />
    </VerifiedContainer>
  )
}
