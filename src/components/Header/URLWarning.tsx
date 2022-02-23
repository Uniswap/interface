import { Trans } from '@lingui/macro'
import { AlertTriangle, X } from 'react-feather'
import styled from 'styled-components/macro'

import { useURLWarningToggle, useURLWarningVisible } from '../../state/user/hooks'
import { isMobile } from '../../utils/userAgent'

const PhishAlert = styled.div`
  display: flex;
  width: 100%;
  padding: 6px 6px;
  background-color: ${({ theme }) => theme.blue1};
  color: white;
  font-size: 11px;
  z-index: 10;
  justify-content: space-between;
  align-items: center;
`

export const StyledClose = styled(X)`
  :hover {
    cursor: pointer;
  }
`

export default function URLWarning() {
  const toggleURLWarning = useURLWarningToggle()
  const showURLWarning = useURLWarningVisible()

  return !showURLWarning ? null : isMobile ? (
    <PhishAlert>
      <div style={{ display: 'flex' }}>
        <AlertTriangle style={{ marginRight: 6 }} size={12} />
        <Trans>
          Make sure the URL is
          <code style={{ padding: '0 4px', display: 'inline', fontWeight: 'bold' }}>app.uniswap.org</code>
        </Trans>
      </div>
      <StyledClose size={12} onClick={toggleURLWarning} />
    </PhishAlert>
  ) : (
    <PhishAlert>
      <div style={{ display: 'flex' }}>
        <AlertTriangle style={{ marginRight: 6 }} size={12} />
        <Trans>
          Always make sure the URL is
          <code style={{ padding: '0 4px', display: 'inline', fontWeight: 'bold' }}>app.uniswap.org</code> - bookmark it
          to be safe.
        </Trans>
      </div>
      <StyledClose size={12} onClick={toggleURLWarning} />
    </PhishAlert>
  )
}
