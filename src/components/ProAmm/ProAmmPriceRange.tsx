import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { Flex, Text } from 'rebass'

import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import LiquidityChartRangeInput from 'components/LiquidityChartRangeInput'
import { RowBetween, RowFixed } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { Bound } from 'state/mint/proamm/type'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { RotateSwapIcon } from './styles'

export default function ProAmmPriceRange({
  position,
  ticksAtLimit,
}: {
  position: Position
  ticksAtLimit: { [bound: string]: boolean | undefined }
}) {
  const theme = useTheme()

  const currency0 = unwrappedToken(position.pool.token0)
  const currency1 = unwrappedToken(position.pool.token1)

  //   track which currency should be base
  const [baseCurrency, setBaseCurrency] = useState(currency0)

  const sorted = baseCurrency.symbol === currency0.symbol
  const quoteCurrency = sorted ? currency1 : currency0
  const price = sorted ? position.pool.priceOf(position.pool.token0) : position.pool.priceOf(position.pool.token1)

  const priceLower = sorted ? position.token0PriceLower : position.token0PriceUpper.invert()
  const priceUpper = sorted ? position.token0PriceUpper : position.token0PriceLower.invert()

  const handleRateChange = useCallback(() => {
    setBaseCurrency(quoteCurrency)
  }, [quoteCurrency])

  return (
    <OutlineCard marginTop="1rem" padding="1rem">
      <AutoColumn gap="12px">
        <Flex>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <Trans>Selected Price Range</Trans>
          </Text>
          <InfoHelper
            text={t`Represents the range where all your liquidity is concentrated. When market price of your token pair is no longer between your selected price range, your liquidity becomes inactive and you stop earning fees`}
            placement={'right'}
            size={12}
          ></InfoHelper>
        </Flex>

        <div>
          <Flex alignItems="center" justifyContent="center" sx={{ gap: '8px' }}>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>Current Price</Trans>
            </Text>
            <RowFixed>
              <Text fontSize={'12px'} fontWeight="500" style={{ textAlign: 'right' }}>{`${price.toSignificant(6)} ${
                quoteCurrency.symbol
              } per ${baseCurrency.symbol}`}</Text>
              <span onClick={handleRateChange} style={{ marginLeft: '2px', cursor: 'pointer' }}>
                <RotateSwapIcon rotated={baseCurrency !== currency0} size={14} />
              </span>
            </RowFixed>
          </Flex>

          <LiquidityChartRangeInput
            style={{ minHeight: '180px' }}
            currencyA={baseCurrency}
            currencyB={quoteCurrency}
            feeAmount={position.pool.fee}
            ticksAtLimit={ticksAtLimit}
            price={price ? parseFloat(price.toSignificant(8)) : undefined}
            leftPrice={priceLower}
            rightPrice={priceUpper}
            onLeftRangeInput={() => {
              //
            }}
            onRightRangeInput={() => {
              //
            }}
            interactive={false}
          />
        </div>
        <RowBetween style={{ gap: '12px' }}>
          <Flex>
            <Text fontSize="12px" fontWeight={500} color={theme.subText}>
              <Trans>Min Price</Trans>
            </Text>
            <InfoHelper
              text={t`Your position will be 100% composed of ${baseCurrency?.symbol} at this price`}
              placement={'right'}
              size={12}
            />
          </Flex>

          <Text fontWeight="500" fontSize="12px">
            <Trans>
              {formatTickPrice(priceLower, ticksAtLimit, Bound.LOWER)} {quoteCurrency.symbol} per {baseCurrency.symbol}
            </Trans>
          </Text>
        </RowBetween>
        <RowBetween style={{ gap: '12px' }}>
          <Flex>
            <Text fontSize="12px" fontWeight={500} color={theme.subText}>
              <Trans>Max Price</Trans>
            </Text>
            <InfoHelper
              text={t`Your position will be 100% composed of ${quoteCurrency?.symbol} at this price`}
              placement={'right'}
              size={12}
            />
          </Flex>

          <Text fontSize="12px" fontWeight="500">
            <Trans>
              {formatTickPrice(priceUpper, ticksAtLimit, Bound.UPPER)} {quoteCurrency.symbol} per {baseCurrency.symbol}
            </Trans>
          </Text>
        </RowBetween>
      </AutoColumn>
    </OutlineCard>
  )
}
