import { ChainId } from 'dxswap-sdk'
import { transparentize } from 'polished'
import React, { useCallback } from 'react'
import styled from 'styled-components'
import { TYPE } from '../../theme'
import Modal from '../Modal'
import { AutoRow } from '../Row'
import { AutoColumn } from '../Column'
import { AlertTriangle } from 'react-feather'
import { NETWORK_DETAIL } from '../../constants'
import { ButtonPrimary } from '../Button'

const WarningContainer = styled.div`
  width: 100%;
  overflow: auto;
`

const OuterContainer = styled.div`
  background: ${({ theme }) => transparentize(0.45, theme.bg2)};
`

const UpperSectionContainer = styled.div`
  padding: 20px;
`

const StyledWarningIcon = styled(AlertTriangle)`
  stroke: ${({ theme }) => theme.text3};
`

export default function NetworkWarningModal({
  isOpen,
  targetedNetwork
}: {
  isOpen: boolean
  targetedNetwork?: ChainId
}) {
  const handleDismiss = useCallback(() => null, [])
  const handleAddClick = useCallback(() => {
    if (!window.ethereum || !window.ethereum.request || !targetedNetwork) return
    window.ethereum
      .request({
        method: 'wallet_addEthereumChain',
        params: [{ ...NETWORK_DETAIL[targetedNetwork], metamaskAddable: undefined }]
      })
      .catch(error => {
        console.error(`error adding network to metamask`, error)
      })
  }, [targetedNetwork])

  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss} maxHeight={90}>
      <OuterContainer>
        <WarningContainer className="network-warning-container">
          <AutoColumn>
            <UpperSectionContainer>
              <AutoRow gap="6px">
                <StyledWarningIcon size="20px" />
                <TYPE.main fontSize="16px" lineHeight="22px" color={'text3'}>
                  Wrong network
                </TYPE.main>
              </AutoRow>
              <TYPE.body
                marginY="20px"
                fontSize="14px"
                fontWeight="400"
                lineHeight="22px"
                letterSpacing="-0.02em"
                color="text4"
              >
                You're currently on the wrong network to correctly visualize this page. Please switch to{' '}
                {targetedNetwork ? NETWORK_DETAIL[targetedNetwork].chainName : ''} in your connected wallet to continue.
              </TYPE.body>
              {targetedNetwork &&
                window.ethereum &&
                window.ethereum.isMetaMask &&
                NETWORK_DETAIL[targetedNetwork] &&
                NETWORK_DETAIL[targetedNetwork].metamaskAddable && (
                  <>
                    <TYPE.body
                      marginY="20px"
                      fontSize="14px"
                      fontWeight="400"
                      lineHeight="22px"
                      letterSpacing="-0.02em"
                      color="text4"
                    >
                      To add/switch to the requested network, click the button below.
                    </TYPE.body>
                    <ButtonPrimary onClick={handleAddClick}>Add</ButtonPrimary>
                  </>
                )}
            </UpperSectionContainer>
          </AutoColumn>
        </WarningContainer>
      </OuterContainer>
    </Modal>
  )
}
