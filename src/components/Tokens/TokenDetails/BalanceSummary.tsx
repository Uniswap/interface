import { Trans } from '@lingui/macro'
import { ChainId, Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { getChainInfo } from 'constants/chainInfo'
import { asSupportedChain } from 'constants/chains'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const BalancesCard = styled.div<{ isInfoTDPEnabled: boolean }>`
  border-radius: 16px;
  ${({ isInfoTDPEnabled, theme }) => `color: ${isInfoTDPEnabled ? theme.neutral2 : theme.neutral1};`};
  display: none;
  height: fit-content;
  padding: 16px;
  width: 100%;
  ${({ isInfoTDPEnabled, theme }) => isInfoTDPEnabled && `background-color: ${theme.surface2};`};

  // 768 hardcoded to match NFT-redesign navbar breakpoints
  // src/nft/css/sprinkles.css.ts
  // change to match theme breakpoints when this navbar is updated
  @media screen and (min-width: 768px) {
    display: flex;
  }
`
const BalanceSection = styled.div`
  height: fit-content;
  width: 100%;
`
const BalanceRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  margin-top: 12px;
`
const BalanceItem = styled.div`
  display: flex;
  align-items: center;
`

const BalanceContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 8px;
  flex: 1;
`

const BalanceAmountsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

const PerformanceContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
`

const StyledNetworkLabel = styled.div`
  color: ${({ color }) => color};
  font-size: 12px;
  line-height: 16px;
`

export default function BalanceSummary({ token }: { token: Currency }) {
  const { account, chainId } = useWeb3React()
  const theme = useTheme()
  const { label, color } = getChainInfo(asSupportedChain(chainId) ?? ChainId.MAINNET)
  const balance = useCurrencyBalance(account, token)
  const { formatCurrencyAmount } = useFormatter()
  const formattedBalance = formatCurrencyAmount({
    amount: balance,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdValue = formatCurrencyAmount({
    amount: useStablecoinValue(balance),
    type: NumberType.FiatTokenStats,
  })
  const twentyFourHourReturn = (
    <Row>
      <ThemedText.LabelSmall>$ dolla</ThemedText.LabelSmall>
      <ThemedText.LabelSmall>$ dolla</ThemedText.LabelSmall>
    </Row>
  )

  const isInfoTDPEnabled = useInfoTDPEnabled()

  if (!account || !balance) {
    return null
  }
  return (
    <BalancesCard isInfoTDPEnabled={isInfoTDPEnabled}>
      <BalanceSection>
        <ThemedText.SubHeaderSmall>
          {/* // question: hmm it looks like Trans does handle variables? */}
          {isInfoTDPEnabled ? <Trans>Your {token.symbol}</Trans> : <Trans>Your balance on {label}</Trans>}
        </ThemedText.SubHeaderSmall>
        <BalanceRow>
          <CurrencyLogo currency={token} size={isInfoTDPEnabled ? '24px' : '2rem'} hideL2Icon={false} />
          <BalanceContainer>
            <BalanceAmountsContainer>
              <BalanceItem>
                <ThemedText.SubHeader>
                  {formattedBalance} {!isInfoTDPEnabled && token.symbol}
                </ThemedText.SubHeader>
              </BalanceItem>
              <BalanceItem>
                {/* figma says this text should be 18px */}
                {isInfoTDPEnabled ? (
                  <ThemedText.BodySecondary>{formattedUsdValue}</ThemedText.BodySecondary>
                ) : (
                  <ThemedText.BodyPrimary>{formattedUsdValue}</ThemedText.BodyPrimary>
                )}
              </BalanceItem>
            </BalanceAmountsContainer>
            {!isInfoTDPEnabled && <StyledNetworkLabel color={color}>{label}</StyledNetworkLabel>}
          </BalanceContainer>
        </BalanceRow>
        {isInfoTDPEnabled && (
          <PerformanceContainer>
            <ThemedText.BodySmall>24H return</ThemedText.BodySmall>
            <ThemedText.LabelSmall>{twentyFourHourReturn}</ThemedText.LabelSmall>
          </PerformanceContainer>
        )}
      </BalanceSection>
    </BalancesCard>
  )
}
