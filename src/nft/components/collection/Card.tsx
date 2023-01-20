import { MouseoverTooltip } from 'components/Tooltip'
import { Box } from 'nft/components/Box'
import { bodySmall } from 'nft/css/common.css'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'

const SuspiciousIcon = styled(AlertTriangle)`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.accentFailure};
`

const SUSPICIOUS_TEXT = 'Blocked on OpenSea'

const Suspicious = () => {
  return (
    <MouseoverTooltip text={<Box className={bodySmall}>{SUSPICIOUS_TEXT}</Box>} placement="top">
      <Box display="flex" flexShrink="0" marginLeft="4">
        <SuspiciousIcon />
      </Box>
    </MouseoverTooltip>
  )
}

export { Suspicious }
