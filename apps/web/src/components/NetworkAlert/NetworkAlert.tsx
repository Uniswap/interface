import { getChainUI } from 'components/Logo/ChainLogo'
import { RowBetween } from 'components/Row'
import { NetworkLayer, getChain, useIsSupportedChainId } from 'constants/chains'
import { Trans } from 'i18n'
import { ArrowUpRight } from 'react-feather'
import styled from 'styled-components'
import { ExternalLink, HideSmall, ThemedText } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { useAccount } from 'hooks/useAccount'
import Column from '../Column'

const BridgeLink = styled(ExternalLink)<{ bgColor: string }>`
  color: ${({ color }) => color};
  background: ${({ bgColor }) => bgColor};
  align-items: center;
  border-radius: 8px;
  color: white;
  display: flex;
  font-size: 16px;
  justify-content: space-between;
  padding: 12px 18px 12px 12px;
  text-decoration: none !important;
  width: 100%;

  border-radius: 20px;
  display: flex;
  flex-direction: row;
  gap: 12px;
  overflow: hidden;
  position: relative;
  width: 100%;

  margin-top: 16px;
`

const TitleText = styled(ThemedText.BodyPrimary)<{ $color: string }>`
  font-weight: 535;
  color: ${({ $color }) => $color};
`

const SubtitleText = styled(ThemedText.BodySmall)<{ $color: string }>`
  line-height: 20px;
  color: ${({ $color }) => $color};
`

export function NetworkAlert() {
  const { chainId } = useAccount()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const darkMode = useIsDarkMode()

  if (!isSupportedChain) {
    return null
  }

  const { Symbol: ChainSymbol, bgColor, textColor } = getChainUI(chainId, darkMode)
  const chainInfo = getChain({ chainId })

  return chainInfo.networkLayer == NetworkLayer.L2 ? (
    <BridgeLink href={chainInfo.bridge} bgColor={bgColor}>
      <ChainSymbol width={40} height={40} stroke="none" />
      <RowBetween>
        <Column>
          <TitleText $color={textColor}>
            <Trans i18nKey="token.bridge" values={{ label: chainInfo.label }} />
          </TitleText>
          <HideSmall>
            <SubtitleText $color={textColor}>
              <Trans i18nKey="common.deposit.toNetwork" values={{ label: chainInfo.label }} />
            </SubtitleText>
          </HideSmall>
        </Column>
        <ArrowUpRight width="24px" height="24px" color={textColor} />
      </RowBetween>
    </BridgeLink>
  ) : null
}
