import { ChainId } from '@taraswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import { CHAIN_INFO, useIsSupportedChainId } from 'constants/chains'
import useSelectChain from 'hooks/useSelectChain'
import { Trans } from 'i18n'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { useAccount } from 'hooks/useAccount'
import { ReactComponent as EyeIcon } from '../../../assets/svg/eye.svg'

const InvalidDetailsContainer = styled.div`
  padding-top: 128px;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const InvalidDetailsText = styled.span`
  margin-top: 28px;
  margin-bottom: 20px;

  text-align: center;

  color: ${({ theme }) => theme.neutral2};
  font-size: 20px;
  font-weight: 535;
  line-height: 28px;
`

const TokenExploreButton = styled(ButtonPrimary)`
  width: fit-content;
  padding: 12px 16px;
  border-radius: 12px;

  color: ${({ theme }) => theme.neutral1};
  font-size: 16px;
  font-weight: 535;
`

export default function InvalidTokenDetails({
  pageChainId,
  isInvalidAddress,
}: {
  pageChainId: ChainId
  isInvalidAddress?: boolean
}) {
  const { chainId } = useAccount()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const pageChainIsSupported = useIsSupportedChainId(pageChainId)
  const navigate = useNavigate()
  const selectChain = useSelectChain()

  // if the token's address is valid and the chains match, it's a non-existant token
  const isNonExistentToken = !isInvalidAddress && pageChainId === chainId

  const connectedChainLabel = isSupportedChain ? CHAIN_INFO[chainId].label : undefined

  return (
    <InvalidDetailsContainer>
      <EyeIcon />
      {isInvalidAddress || isNonExistentToken ? (
        <>
          <InvalidDetailsText>
            <Trans i18nKey="tdp.invalidTokenPage.title" />
          </InvalidDetailsText>
          <TokenExploreButton onClick={() => navigate('/tokens')}>
            <ThemedText.SubHeader>
              <Trans i18nKey="common.exploreTokens" />
            </ThemedText.SubHeader>
          </TokenExploreButton>
        </>
      ) : (
        <>
          {connectedChainLabel && (
            <InvalidDetailsText>
              <Trans i18nKey="tdp.invalidTokenPage.titleWithChain" values={{ network: connectedChainLabel }} />
            </InvalidDetailsText>
          )}
          <TokenExploreButton onClick={() => selectChain(pageChainId)}>
            <ThemedText.SubHeader>
              <Trans
                i18nKey="tdp.invalidTokenPage.switchChainPrompt"
                values={{ network: pageChainIsSupported ? CHAIN_INFO[pageChainId].label : '' }}
              />
            </ThemedText.SubHeader>
          </TokenExploreButton>
        </>
      )}
    </InvalidDetailsContainer>
  )
}
