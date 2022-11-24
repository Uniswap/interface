import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import CoingeckoLight from 'assets/svg/coingecko-light.svg'
import Coingecko from 'assets/svg/coingecko.svg'
import AddTokenToMetaMask from 'components/AddToMetamask'
import { ButtonEmpty } from 'components/Button'
import Copy from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import { AutoRow, RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTokenInfo from 'hooks/useTokenInfo'
import { Field } from 'state/swap/actions'
import { useIsDarkMode } from 'state/user/hooks'
import { formattedNum, shortenAddress } from 'utils'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { formatLongNumber } from 'utils/formatBalance'

const NOT_AVAIALBLE = '--'

const Wrapper = styled.div`
  border-radius: 4px;
  width: 100%;
`

const TabContainer = styled.div`
  display: flex;
  flex: 1;
  border-radius: 999px;
  background-color: ${({ theme }) => theme.tabBackgound};
  padding: 2px;
`

const Tab = styled(ButtonEmpty)<{ isActive?: boolean; isLeft?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  background-color: ${({ theme, isActive }) => (isActive ? theme.tabActive : theme.tabBackgound)};
  padding: 4px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 999px;

  &:hover {
    text-decoration: none;
  }
`

const TabText = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 2px;
  color: ${({ theme, isActive }) => (isActive ? theme.text : theme.subText)};
  margin-left: 4px;
`

const InfoRow = styled(RowBetween)`
  padding: 14px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 12px 0
  `}
`

const InfoRowLabel = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
`

const InfoRowValue = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 12px;
  font-weight: 500;
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

const BackText = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const BackIconWrapper = styled(ArrowLeft)`
  height: 20px;
  width: 20px;
  margin-right: 10px;
  cursor: pointer;
  path {
    stroke: ${({ theme }) => theme.text} !important;
  }
`
enum TAB {
  TOKEN_IN,
  TOKEN_OUT,
}
const TokenInfo = ({ currencies, onBack }: { currencies: { [field in Field]?: Currency }; onBack?: () => void }) => {
  const { chainId } = useActiveWeb3React()
  const inputNativeCurrency = useCurrencyConvertedToNative(currencies[Field.INPUT])
  const outputNativeCurrency = useCurrencyConvertedToNative(currencies[Field.OUTPUT])
  const inputToken = inputNativeCurrency?.wrapped
  const outputToken = outputNativeCurrency?.wrapped
  const [activeTab, setActiveTab] = useState(TAB.TOKEN_IN)
  const selectedToken = activeTab === TAB.TOKEN_OUT ? outputToken : inputToken
  const { data: tokenInfo, loading } = useTokenInfo(selectedToken)
  const darkMode = useIsDarkMode()

  // Handle switch network case
  useEffect(() => {
    inputToken?.address && setActiveTab(TAB.TOKEN_IN)
  }, [chainId, inputToken])

  const listData = [
    { label: t`Price`, value: tokenInfo.price ? formattedNum(tokenInfo.price.toString(), true) : NOT_AVAIALBLE },
    {
      label: t`Trading Volume (24H)`,
      value: tokenInfo.tradingVolume ? formatLongNumber(tokenInfo.tradingVolume.toString(), true) : NOT_AVAIALBLE,
    },
    {
      label: t`Market Cap Rank`,
      value: tokenInfo.marketCapRank ? `#${formattedNum(tokenInfo.marketCapRank.toString())}` : NOT_AVAIALBLE,
    },
    {
      label: t`Market Cap`,
      value: tokenInfo.marketCap ? formatLongNumber(tokenInfo.marketCap.toString(), true) : NOT_AVAIALBLE,
    },
    {
      label: t`All-Time High`,
      value: tokenInfo.allTimeHigh ? formattedNum(tokenInfo.allTimeHigh.toString(), true) : NOT_AVAIALBLE,
    },
    {
      label: t`All-Time Low`,
      value: tokenInfo.allTimeLow ? formattedNum(tokenInfo.allTimeLow.toString(), true) : NOT_AVAIALBLE,
    },
    {
      label: t`Circulating Supply`,
      value: tokenInfo.circulatingSupply ? formatLongNumber(tokenInfo.circulatingSupply.toString()) : NOT_AVAIALBLE,
    },
    {
      label: t`Total Supply`,
      value: tokenInfo.totalSupply ? formatLongNumber(tokenInfo.totalSupply.toString()) : NOT_AVAIALBLE,
    },
  ]

  const isActiveTokenIn = activeTab === TAB.TOKEN_IN
  const isActiveTokenOut = activeTab === TAB.TOKEN_OUT

  return (
    <>
      <Wrapper>
        <Flex justifyContent="space-between" alignItems="center" marginBottom="4px">
          {onBack && (
            <Flex alignItems="center" marginRight={20}>
              <BackIconWrapper onClick={onBack}></BackIconWrapper>
              <BackText>{t`Info`}</BackText>
            </Flex>
          )}
          <TabContainer>
            <Tab isActive={isActiveTokenIn} padding="0" onClick={() => setActiveTab(TAB.TOKEN_IN)}>
              <CurrencyLogo currency={inputNativeCurrency} size="16px" />
              <TabText isActive={isActiveTokenIn}>{inputNativeCurrency?.symbol}</TabText>
            </Tab>
            <Tab isActive={isActiveTokenOut} padding="0" onClick={() => setActiveTab(TAB.TOKEN_OUT)}>
              <CurrencyLogo currency={outputNativeCurrency} size="16px" />
              <TabText isActive={isActiveTokenOut}>{outputNativeCurrency?.symbol}</TabText>
            </Tab>
          </TabContainer>
        </Flex>

        {listData.map(item => (
          <InfoRow key={item.label}>
            <InfoRowLabel>{item.label}</InfoRowLabel>
            <InfoRowValue>{loading ? <Loader size="10px" /> : item.value}</InfoRowValue>
          </InfoRow>
        ))}

        <InfoRow style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <InfoRowLabel>
            <Trans>Contract Address</Trans>
          </InfoRowLabel>

          <AutoRow width="fit-content" gap="4px">
            {selectedToken ? (
              <>
                <CurrencyLogo currency={selectedToken} size="16px" />
                <InfoRowValue>{shortenAddress(chainId, selectedToken.address, 3)}</InfoRowValue>
                <Copy toCopy={selectedToken.address} />
                <AddTokenToMetaMask token={selectedToken} />
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
