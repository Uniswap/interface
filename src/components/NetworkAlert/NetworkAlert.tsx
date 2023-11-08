import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { getChainUI } from 'components/Logo/ChainLogo'
import { RowBetween } from 'components/Row'
import { getChainInfo } from 'constants/chainInfo'
import { isSupportedChain } from 'constants/chains'
import { ArrowUpRight } from 'react-feather'
import styled from 'styled-components'
import { ExternalLink, HideSmall, ThemedText } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

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
  const { chainId } = useWeb3React()
  const darkMode = useIsDarkMode()

  if (!chainId || !isSupportedChain(chainId)) return null

  const { Symbol: ChainSymbol, bgColor, textColor } = getChainUI(chainId, darkMode)
  const { label, bridge } = getChainInfo(chainId)

  return bridge ? (
    <BridgeLink href={bridge} bgColor={bgColor}>
      <ChainSymbol width={40} height={40} stroke="none" />
      <RowBetween>
        <Column>
          <TitleText $color={textColor}>
            <Trans>{label} token bridge</Trans>
          </TitleText>
          <HideSmall>
            <SubtitleText $color={textColor}>
              <Trans>Deposit tokens to the {label} network.</Trans>
            </SubtitleText>
          </HideSmall>
        </Column>
        <ArrowUpRight width="24px" height="24px" color={textColor} />
      </RowBetween>
    </BridgeLink>
  ) : null
}
