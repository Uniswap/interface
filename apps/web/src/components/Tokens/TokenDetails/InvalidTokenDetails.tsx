import { ReactComponent as EyeIcon } from 'assets/svg/eye.svg'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import styled from 'lib/styled-components'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { Button } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'

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

export default function InvalidTokenDetails({
  tokenColor,
  pageChainId,
  isInvalidAddress,
}: {
  tokenColor?: string
  pageChainId: UniverseChainId
  isInvalidAddress?: boolean
}) {
  const { chainId } = useAccount()
  const { t } = useTranslation()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const pageChainIsSupported = useIsSupportedChainId(pageChainId)
  const navigate = useNavigate()
  const selectChain = useSelectChain()

  // if the token's address is valid and the chains match, it's a non-existant token
  const isNonExistentToken = !isInvalidAddress && pageChainId === chainId

  const connectedChainLabel = isSupportedChain ? getChainLabel(chainId) : undefined

  return (
    <InvalidDetailsContainer>
      <EyeIcon />
      {isInvalidAddress || isNonExistentToken ? (
        <>
          <InvalidDetailsText>
            <Trans i18nKey="tdp.invalidTokenPage.title" />
          </InvalidDetailsText>
          <Button
            hoverStyle={{ backgroundColor: opacify(90, tokenColor ?? '') }}
            backgroundColor={tokenColor}
            onPress={() => navigate('/tokens')}
          >
            {t('common.exploreTokens')}
          </Button>
        </>
      ) : (
        <>
          {connectedChainLabel && (
            <InvalidDetailsText>
              <Trans i18nKey="tdp.invalidTokenPage.titleWithChain" values={{ network: connectedChainLabel }} />
            </InvalidDetailsText>
          )}
          <Button
            hoverStyle={{ backgroundColor: opacify(90, tokenColor ?? '') }}
            backgroundColor={tokenColor}
            onPress={() => selectChain(pageChainId)}
          >
            <ThemedText.SubHeader>
              <Trans
                i18nKey="tdp.invalidTokenPage.switchChainPrompt"
                values={{ network: pageChainIsSupported ? getChainLabel(pageChainId) : '' }}
              />
            </ThemedText.SubHeader>
          </Button>
        </>
      )}
    </InvalidDetailsContainer>
  )
}
