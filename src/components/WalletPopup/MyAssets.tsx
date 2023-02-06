import { Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { stringify } from 'querystring'
import { useState } from 'react'
import { Info } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import AutoSizer from 'react-virtualized-auto-sizer'
import { Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import Loader from 'components/Loader'
import Row from 'components/Row'
import { CurrencyRow } from 'components/SearchModal/CurrencyList'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useNativeBalance } from 'state/wallet/hooks'
import { currencyId } from 'utils/currencyId'

const tokenItemStyle = { paddingLeft: 0, paddingRight: 8 }
const Wrapper = styled.div`
  width: 100%;
  flex: 1 0 auto;
  overflow-y: auto;
  overflow-x: hidden;
  &::-webkit-scrollbar {
    display: block;
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
  }
`

export default function MyAssets({
  tokens,
  loadingTokens,
  usdBalances,
  currencyBalances,
}: {
  tokens: Currency[]
  loadingTokens: boolean
  usdBalances: { [address: string]: number }
  currencyBalances: { [address: string]: TokenAmount | undefined }
}) {
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const [modalOpen, setModalOpen] = useState(false)
  const showModal = () => {
    setModalOpen(true)
    mixpanelHandler(MIXPANEL_TYPE.WUI_IMPORT_TOKEN_CLICK)
  }
  const hideModal = () => setModalOpen(false)
  const nativeBalance = useNativeBalance()
  const navigate = useNavigate()
  const qs = useParsedQueryString()
  const { chainId } = useActiveWeb3React()

  if (loadingTokens) {
    return (
      <Wrapper>
        <Row style={{ height: 73 }} gap="6px" justify="center">
          <Loader /> <Text color={theme.subText}>Loading tokens...</Text>
        </Row>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <AutoSizer>
        {({ height, width }) => (
          <div style={{ height, width }}>
            {tokens.map(token => {
              const address = token.wrapped.address
              const currencyBalance = token.isNative ? nativeBalance : currencyBalances[address]
              const usdBalance =
                currencyBalance && usdBalances[address]
                  ? usdBalances[address] * parseFloat(currencyBalance.toExact())
                  : undefined
              return (
                <CurrencyRow
                  onSelect={() => {
                    navigate({ search: stringify({ ...qs, inputCurrency: currencyId(token, chainId) }) })
                  }}
                  isSelected={false}
                  key={address + token.symbol}
                  style={tokenItemStyle}
                  currency={token}
                  currencyBalance={currencyBalance as CurrencyAmount<Currency>}
                  showFavoriteIcon={false}
                  usdBalance={usdBalance}
                  hoverColor="transparent"
                />
              )
            })}
            <Column
              gap="6px"
              style={{
                alignItems: 'center',
                borderTop: tokens.length ? `1px solid ${theme.border}` : 'none',
                padding: '12px 0',
                marginTop: tokens.length ? 8 : 0,
                fontSize: 14,
              }}
            >
              <Info color={theme.subText} />
              <Text color={theme.subText}>
                <Trans>Don&apos;t see your tokens</Trans>
              </Text>
              <Text color={theme.primary} style={{ cursor: 'pointer' }} onClick={showModal}>
                <Trans>Import Tokens</Trans>
              </Text>
            </Column>
          </div>
        )}
      </AutoSizer>
      <CurrencySearchModal
        title={t`Import Tokens`}
        tooltip={
          <Text>
            <Trans>
              Find a token by searching for name, symbol or address.
              <br />
              You can select and import any token on KyberSwap.
            </Trans>
          </Text>
        }
        isOpen={modalOpen}
        onDismiss={hideModal}
        onCurrencySelect={hideModal}
        showCommonBases
        onCurrencyImport={(token: Token) => {
          mixpanelHandler(MIXPANEL_TYPE.WUI_IMPORT_TOKEN_BUTTON_CLICK, { token_name: token.symbol })
        }}
      />
    </Wrapper>
  )
}
