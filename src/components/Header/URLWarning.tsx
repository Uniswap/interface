import { useContractKit } from '@celo-tools/use-contractkit'
import { ChainId } from '@ubeswap/sdk'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { AlertTriangle, X } from 'react-feather'
import styled from 'styled-components'

import { useURLWarningToggle, useURLWarningVisible } from '../../state/user/hooks'

const PhishAlert = styled.div<{ isActive: any }>`
  width: 100%;
  padding: 6px 6px;
  background-color: ${({ theme }) => theme.blue1};
  color: white;
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

const defaultAppUrl = 'app.ubeswap.org'

const appURL: Record<string, string> = {
  [ChainId.MAINNET]: 'app.ubeswap.org',
  [ChainId.ALFAJORES]: 'app-alfajores.ubeswap.org',
  [ChainId.BAKLAVA]: 'app-baklava.ubeswap.org',
}

export default function URLWarning() {
  const toggleURLWarning = useURLWarningToggle()
  const showURLWarning = useURLWarningVisible()
  const { network } = useContractKit()
  const chainId = network.chainId

  return isMobile ? (
    <PhishAlert isActive={showURLWarning}>
      <div style={{ display: 'flex' }}>
        <AlertTriangle style={{ marginRight: 6 }} size={12} /> Make sure the URL is
        <code style={{ padding: '0 4px', display: 'inline', fontWeight: 'bold' }}>
          {appURL[chainId] || defaultAppUrl}
        </code>
      </div>
      <StyledClose size={12} onClick={toggleURLWarning} />
    </PhishAlert>
  ) : window.location.hostname === 'app.ubeswap.org' ? (
    <PhishAlert isActive={showURLWarning}>
      <div style={{ display: 'flex' }}>
        <AlertTriangle style={{ marginRight: 6 }} size={12} /> Always make sure the URL is
        <code style={{ padding: '0 4px', display: 'inline', fontWeight: 'bold' }}>
          {appURL[chainId] || defaultAppUrl}
        </code>{' '}
        - bookmark it to be safe.
      </div>
      <StyledClose size={12} onClick={toggleURLWarning} />
    </PhishAlert>
  ) : null
}
