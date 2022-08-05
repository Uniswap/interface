import { Trans } from '@lingui/macro'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { AlertTriangle, X } from 'react-feather'
import styled from 'styled-components'

import { useURLWarningToggle, useURLWarningVisible } from '../../state/user/hooks'

const PhishAlert = styled.div<{ isActive: any }>`
  width: 100%;
  padding: 6px 6px;
  background-color: ${({ theme }) => theme.blue1};
  color: #333;
  font-size: 11px;
  justify-content: space-between;
  align-items: center;
  display: ${({ isActive }) => (isActive ? 'flex' : 'none')};
`

export const StyledClose = styled(X)`
  :hover {
    cursor: pointer;
  }
`

export default function URLWarning() {
  const toggleURLWarning = useURLWarningToggle()
  const showURLWarning = useURLWarningVisible()

  return isMobile ? (
    <PhishAlert isActive={showURLWarning}>
      <div style={{ display: 'flex' }}>
        <AlertTriangle style={{ marginRight: 6 }} size={12} />{' '}
        <Trans>
          Make sure the URL is
          <code style={{ padding: '0 4px', display: 'inline', fontWeight: 'bold' }}>KyberSwap.com</code>
        </Trans>
      </div>
      <StyledClose size={12} onClick={toggleURLWarning} />
    </PhishAlert>
  ) : window.location.hostname === 'kyberswap.com' ? (
    <PhishAlert isActive={showURLWarning}>
      <div style={{ display: 'flex' }}>
        <AlertTriangle style={{ marginRight: 6 }} size={12} />{' '}
        <Trans>
          Always make sure the URL is
          <code style={{ padding: '0 4px', display: 'inline', fontWeight: 'bold' }}>KyberSwap.com</code> - bookmark it
          to be safe.
        </Trans>
      </div>
      <StyledClose size={12} onClick={toggleURLWarning} />
    </PhishAlert>
  ) : null
}
