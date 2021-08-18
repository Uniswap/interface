import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { TYPE } from '../../theme'
import Modal from '../Modal'
import { AutoRow } from '../Row'
import { AutoColumn } from '../Column'
import { AlertTriangle } from 'react-feather'
import { NETWORK_DETAIL } from '../../constants'
import { ButtonPrimary } from '../Button'
import { useTargetedChainIdFromUrl } from '../../hooks/useTargetedChainIdFromUrl'
import { useIsSwitchingToCorrectChain } from '../../state/multi-chain-links/hooks'
import { useActiveWeb3React } from '../../hooks'
import { switchOrAddNetwork } from '../../utils'
import { isMobile } from 'react-device-detect'

const WarningContainer = styled.div`
  width: 100%;
  overflow: auto;
`

const OuterContainer = styled.div`
  background: ${({ theme }) => theme.bg1And2};
`

const UpperSectionContainer = styled.div`
  padding: 20px;
`

const StyledWarningIcon = styled(AlertTriangle)`
  stroke: ${({ theme }) => theme.text3};
`

export default function NetworkWarningModal() {
  const { chainId, account } = useActiveWeb3React()
  const urlLoadedChainId = useTargetedChainIdFromUrl()
  const switchingToCorrectChain = useIsSwitchingToCorrectChain()

  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(!!account && !!chainId && !!urlLoadedChainId && !!switchingToCorrectChain)
  }, [account, chainId, switchingToCorrectChain, urlLoadedChainId])

  const handleDismiss = useCallback(() => null, [])

  const handleAddClick = useCallback(() => {
    if (!urlLoadedChainId) return
    switchOrAddNetwork(NETWORK_DETAIL[urlLoadedChainId], account || undefined)
  }, [urlLoadedChainId, account])

  return (
    <Modal isOpen={open} onDismiss={handleDismiss} maxHeight={90}>
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
                {urlLoadedChainId && NETWORK_DETAIL[urlLoadedChainId] ? NETWORK_DETAIL[urlLoadedChainId].chainName : ''}{' '}
                in your connected wallet to continue.
              </TYPE.body>
              {!isMobile &&
                urlLoadedChainId &&
                window.ethereum &&
                window.ethereum.isMetaMask &&
                NETWORK_DETAIL[urlLoadedChainId] && (
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
