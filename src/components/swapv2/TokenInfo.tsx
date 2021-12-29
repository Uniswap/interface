import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { Currency } from '@dynamic-amm/sdk'

import Coingecko from 'assets/svg/coingecko.svg'
import CoingeckoLight from 'assets/svg/coingecko-light.svg'
import { ButtonEmpty } from 'components/Button'
import { AutoRow, RowBetween } from 'components/Row'
import Loader from 'components/Loader'
import Copy from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import AddTokenToMetaMask from 'components/AddToMetamask'
import { useActiveWeb3React } from 'hooks'
import useTokenInfo from 'hooks/useTokenInfo'
import { Field } from 'state/swap/actions'
import { useIsDarkMode } from 'state/user/hooks'
import { formattedNum, shortenAddress } from 'utils'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { formatLongNumber } from 'utils/formatBalance'

const NOT_AVAIALBLE = '--'

const Wrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  padding: 16px 20px 20px;
`

const TabContainer = styled.div`
  display: flex;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.buttonBlack};
`

const Tab = styled(ButtonEmpty)<{ isActive?: boolean; isLeft?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  background-color: ${({ theme, isActive }) => (isActive ? theme.primary : theme.buttonBlack)};
  padding: 8px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;

  &:hover {
    text-decoration: none;
  }
`

const TabText = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 2px;
  color: ${({ theme, isActive }) => (isActive ? theme.textReverse : theme.subText)};
  margin-left: 4px;
`

const InfoRow = styled(RowBetween)`
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const InfoRowLabel = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;

  @media only screen and (min-width: 768px) {
    font-size: 14px;
  }
`

const InfoRowValue = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 12px;
  font-weight: 400;

  @media only screen and (min-width: 768px) {
    font-size: 14px;
  }
`

const PoweredByWrapper = styled.div`
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  align-items: center;
  margin-top: 14px;
`

const PoweredByText = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.subText};
`

const TokenInfo = ({ currencies }: { currencies: { [field in Field]?: Currency } }) => {
  const { chainId } = useActiveWeb3React()
  const inputNativeCurrency = useCurrencyConvertedToNative(currencies[Field.INPUT])
  const outputNativeCurrency = useCurrencyConvertedToNative(currencies[Field.OUTPUT])
  const inputToken = wrappedCurrency(inputNativeCurrency, chainId)
  const outputToken = wrappedCurrency(outputNativeCurrency, chainId)
  const [activeTab, setActiveTab] = useState<string>(inputNativeCurrency?.symbol || '')
  const selectedToken = activeTab === outputNativeCurrency?.symbol ? outputToken : inputToken
  const { data: tokenInfo, loading } = useTokenInfo(selectedToken)
  const darkMode = useIsDarkMode()

  // Handle switch network case
  useEffect(() => {
    inputNativeCurrency?.symbol && setActiveTab(inputNativeCurrency.symbol)
  }, [chainId, inputNativeCurrency?.symbol])

  return (
    <>
      <Wrapper>
        <TabContainer>
          <Tab
            isActive={activeTab === inputNativeCurrency?.symbol}
            padding="0"
            onClick={() => setActiveTab(inputNativeCurrency?.symbol || '')}
          >
            <CurrencyLogo currency={inputNativeCurrency} size="16px" />
            <TabText isActive={activeTab === inputNativeCurrency?.symbol}>{inputNativeCurrency?.symbol}</TabText>
          </Tab>
          <Tab
            isActive={activeTab === outputNativeCurrency?.symbol}
            padding="0"
            onClick={() => setActiveTab(outputNativeCurrency?.symbol || '')}
          >
            <CurrencyLogo currency={outputNativeCurrency} size="16px" />
            <TabText isActive={activeTab === outputNativeCurrency?.symbol}>{outputNativeCurrency?.symbol}</TabText>
          </Tab>
        </TabContainer>

        <InfoRow>
          <InfoRowLabel>
            <Trans>Price</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? <Loader /> : tokenInfo.price ? formattedNum(tokenInfo.price.toString(), true) : NOT_AVAIALBLE}
          </InfoRowValue>
        </InfoRow>

        <InfoRow>
          <InfoRowLabel>
            <Trans>Trading Volume (24H)</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? (
              <Loader />
            ) : tokenInfo.tradingVolume ? (
              formatLongNumber(tokenInfo.tradingVolume.toString(), true)
            ) : (
              NOT_AVAIALBLE
            )}
          </InfoRowValue>
        </InfoRow>

        <InfoRow>
          <InfoRowLabel>
            <Trans>Market Cap Rank</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? (
              <Loader />
            ) : tokenInfo.marketCapRank ? (
              `#${formattedNum(tokenInfo.marketCapRank.toString())}`
            ) : (
              NOT_AVAIALBLE
            )}
          </InfoRowValue>
        </InfoRow>

        <InfoRow>
          <InfoRowLabel>
            <Trans>Market Cap</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? (
              <Loader />
            ) : tokenInfo.marketCap ? (
              formatLongNumber(tokenInfo.marketCap.toString(), true)
            ) : (
              NOT_AVAIALBLE
            )}
          </InfoRowValue>
        </InfoRow>

        <InfoRow>
          <InfoRowLabel>
            <Trans>All-Time High</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? (
              <Loader />
            ) : tokenInfo.allTimeHigh ? (
              formattedNum(tokenInfo.allTimeHigh.toString(), true)
            ) : (
              NOT_AVAIALBLE
            )}
          </InfoRowValue>
        </InfoRow>

        <InfoRow>
          <InfoRowLabel>
            <Trans>All-Time Low</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? (
              <Loader />
            ) : tokenInfo.allTimeLow ? (
              formattedNum(tokenInfo.allTimeLow.toString(), true)
            ) : (
              NOT_AVAIALBLE
            )}
          </InfoRowValue>
        </InfoRow>

        <InfoRow>
          <InfoRowLabel>
            <Trans>Circulating Supply</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? (
              <Loader />
            ) : tokenInfo.circulatingSupply ? (
              formatLongNumber(tokenInfo.circulatingSupply.toString())
            ) : (
              NOT_AVAIALBLE
            )}
          </InfoRowValue>
        </InfoRow>

        <InfoRow>
          <InfoRowLabel>
            <Trans>Total Supply</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? (
              <Loader />
            ) : tokenInfo.totalSupply ? (
              formatLongNumber(tokenInfo.totalSupply.toString())
            ) : (
              NOT_AVAIALBLE
            )}
          </InfoRowValue>
        </InfoRow>

        <InfoRow style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <InfoRowLabel>
            <Trans>Contract Address</Trans>
          </InfoRowLabel>

          <AutoRow width="fit-content" gap="4px">
            {chainId && selectedToken ? (
              <>
                <CurrencyLogo currency={selectedToken} size="16px" />
                <InfoRowValue>{shortenAddress(selectedToken.address, 3)}</InfoRowValue>
                <Copy toCopy={selectedToken.address} />
                <AddTokenToMetaMask token={selectedToken} chainId={chainId} />
              </>
            ) : (
              <Loader />
            )}
          </AutoRow>
        </InfoRow>
      </Wrapper>
      <PoweredByWrapper>
        <PoweredByText>
          <Trans>Powered by</Trans>
        </PoweredByText>{' '}
        <img src={darkMode ? Coingecko : CoingeckoLight} alt="Coingecko logo" />
      </PoweredByWrapper>
    </>
  )
}

export default TokenInfo
