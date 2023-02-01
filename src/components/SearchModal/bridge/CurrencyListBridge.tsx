import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { CSSProperties, memo, useCallback } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { formatPoolValue } from 'pages/Bridge/helpers'
import { MultiChainTokenInfo } from 'pages/Bridge/type'
import { useBridgeState } from 'state/bridge/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useCurrencyBalances } from 'state/wallet/hooks'

import { CurrencyRow, getDisplayTokenInfo } from '../CurrencyList'

interface TokenRowPropsBridge {
  currency: WrappedTokenInfo | undefined
  currencyBalance: CurrencyAmount<Currency>
  style: CSSProperties
}

const CurrencyListBridge = memo(function CurrencyListV2({
  currencies,
  isOutput,
  onCurrencySelect,
  listTokenRef,
}: {
  currencies: WrappedTokenInfo[]
  onCurrencySelect: (currency: WrappedTokenInfo) => void
  isOutput: boolean | undefined
  listTokenRef: React.Ref<HTMLDivElement>
}) {
  const [{ tokenInfoIn, tokenInfoOut, poolValueOutMap }] = useBridgeState()
  const currencyBalances = useCurrencyBalances(!isOutput ? currencies : [])
  const theme = useTheme()

  const Row: any = useCallback(
    function TokenRow({ style, currency, currencyBalance }: TokenRowPropsBridge) {
      if (!currency) return
      const isSelected =
        tokenInfoIn?.address?.toLowerCase() === currency?.address?.toLowerCase() ||
        tokenInfoOut?.sortId === currency?.multichainInfo?.sortId
      const handleSelect = () => currency && onCurrencySelect(currency)
      const { symbol } = getDisplayTokenInfo(currency)
      const { sortId, type, anytoken } = (currency?.multichainInfo || {}) as Partial<MultiChainTokenInfo>
      const poolLiquidity = isOutput && anytoken?.address ? formatPoolValue(poolValueOutMap?.[anytoken?.address]) : 0

      return (
        <CurrencyRow
          showFavoriteIcon={false}
          style={style}
          currency={currency}
          currencyBalance={currencyBalance}
          isSelected={isSelected}
          onSelect={handleSelect}
          otherSelected={false}
          customBalance={isOutput ? poolLiquidity : undefined}
          customName={
            sortId !== undefined ? (
              <Flex>
                {symbol}&nbsp;
                <Text color={theme.subText} fontWeight="normal">
                  {`${['swapin', 'swapout'].includes(type ?? '') ? '(Bridge)' : `(Router ${sortId})`}`}
                </Text>
              </Flex>
            ) : null
          }
        />
      )
    },
    [onCurrencySelect, tokenInfoIn, isOutput, tokenInfoOut, theme, poolValueOutMap],
  )

  return (
    <div style={{ flex: '1', overflow: 'hidden', height: '100%' }}>
      {isOutput ? (
        currencies.map((item, index) => (
          <Row index={index} currency={item} key={index} currencyBalance={currencyBalances[index]} />
        ))
      ) : (
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemSize={56}
              itemCount={currencies.length}
              itemData={currencies}
              outerRef={listTokenRef}
            >
              {({ data, index, style }) => (
                <Row
                  index={index}
                  currency={data[index]}
                  key={data[index]?.address || index}
                  currencyBalance={currencyBalances[index]}
                  style={style}
                />
              )}
            </FixedSizeList>
          )}
        </AutoSizer>
      )}
    </div>
  )
})
export default CurrencyListBridge
