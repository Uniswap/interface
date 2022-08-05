import { Currency } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import JSBI from 'jsbi'
import { ReactNode, useCallback, useState } from 'react'
import { Text } from 'rebass'

import RangeBadge from 'components/Badge/RangeBadge'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import RateToggle from 'components/RateToggle'
import { RowBetween, RowFixed } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { Bound } from 'state/mint/proamm/actions'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/wrappedCurrency'

export const PositionPreview = ({
  position,
  title,
  inRange,
  baseCurrencyDefault,
  ticksAtLimit,
}: {
  position: Position
  title?: ReactNode
  inRange: boolean
  baseCurrencyDefault?: Currency | undefined
  ticksAtLimit: { [bound: string]: boolean | undefined }
}) => {
  const theme = useTheme()

  const currency0 = unwrappedToken(position.pool.token0)
  const currency1 = unwrappedToken(position.pool.token1)

  // track which currency should be base
  const [baseCurrency, setBaseCurrency] = useState(
    baseCurrencyDefault
      ? baseCurrencyDefault === currency0
        ? currency0
        : baseCurrencyDefault === currency1
        ? currency1
        : currency0
      : currency0,
  )

  const sorted = baseCurrency === currency0
  const quoteCurrency = sorted ? currency1 : currency0

  const price = sorted ? position.pool.priceOf(position.pool.token0) : position.pool.priceOf(position.pool.token1)

  const priceLower = sorted ? position.token0PriceLower : position.token0PriceUpper.invert()
  const priceUpper = sorted ? position.token0PriceUpper : position.token0PriceLower.invert()

  const handleRateChange = useCallback(() => {
    setBaseCurrency(quoteCurrency)
  }, [quoteCurrency])

  const removed = position?.liquidity && JSBI.equal(position?.liquidity, JSBI.BigInt(0))

  return (
    <AutoColumn gap="md" style={{ marginTop: '0.5rem' }}>
      <RowBetween style={{ marginBottom: '0.5rem' }}>
        <RowFixed>
          <DoubleCurrencyLogo
            currency0={currency0 ?? undefined}
            currency1={currency1 ?? undefined}
            size={24}
            margin={true}
          />
          <Text ml="10px" fontSize="24px">
            {currency0?.symbol} / {currency1?.symbol}
          </Text>
        </RowFixed>
        <RangeBadge removed={removed} inRange={inRange} />
      </RowBetween>

      <OutlineCard>
        <AutoColumn gap="md">
          <RowBetween>
            <RowFixed>
              <CurrencyLogo currency={currency0} />
              <Text ml="8px">{currency0?.symbol}</Text>
            </RowFixed>
            <RowFixed>
              <Text mr="8px">{position.amount0.toSignificant(4)}</Text>
            </RowFixed>
          </RowBetween>
          <RowBetween>
            <RowFixed>
              <CurrencyLogo currency={currency1} />
              <Text ml="8px">{currency1?.symbol}</Text>
            </RowFixed>
            <RowFixed>
              <Text mr="8px">{position.amount1.toSignificant(4)}</Text>
            </RowFixed>
          </RowBetween>
          <Divider />
          <RowBetween>
            <Text>
              <Trans>Fee Tier</Trans>
            </Text>
            <Text>
              <Trans>{position?.pool?.fee / 100}%</Trans>
            </Text>
          </RowBetween>
        </AutoColumn>
      </OutlineCard>

      <AutoColumn gap="md">
        <RowBetween>
          {title ? <Text fontWeight="500">{title}</Text> : <div />}
          <RateToggle
            currencyA={sorted ? currency0 : currency1}
            currencyB={sorted ? currency1 : currency0}
            handleRateToggle={handleRateChange}
          />
        </RowBetween>

        <RowBetween style={{ gap: '12px' }}>
          <OutlineCard width="48%" padding="8px">
            <AutoColumn gap="4px" justify="center">
              <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                <Trans>Min Price</Trans>
              </Text>
              <Text textAlign="center" fontWeight="500" fontSize="20px">{`${formatTickPrice(
                priceLower,
                ticksAtLimit,
                Bound.LOWER,
              )}`}</Text>
              <Text textAlign="center" fontSize="12px" fontWeight="500" color={theme.subText}>
                <Trans>
                  {quoteCurrency.symbol} per {baseCurrency.symbol}
                </Trans>
              </Text>
              <Text textAlign="center" color={theme.subText} fontSize={12} marginTop="4px">
                <Trans>Your position will be 100% composed of {baseCurrency?.symbol} at this price</Trans>
              </Text>
            </AutoColumn>
          </OutlineCard>

          <OutlineCard width="48%" padding="8px">
            <AutoColumn gap="4px" justify="center">
              <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                <Trans>Max Price</Trans>
              </Text>
              <Text fontSize="20px" textAlign="center" fontWeight="500">{`${formatTickPrice(
                priceUpper,
                ticksAtLimit,
                Bound.UPPER,
              )}`}</Text>
              <Text textAlign="center" fontSize="12px" fontWeight="500" color={theme.subText}>
                <Trans>
                  {quoteCurrency.symbol} per {baseCurrency.symbol}
                </Trans>
              </Text>
              <Text textAlign="center" color={theme.subText} fontSize="12px" style={{ marginTop: '4px' }}>
                <Trans>Your position will be 100% composed of {quoteCurrency?.symbol} at this price</Trans>
              </Text>
            </AutoColumn>
          </OutlineCard>
        </RowBetween>
        <OutlineCard padding="12px ">
          <RowBetween>
            <Text fontWeight="500">
              <Trans>Current {baseCurrency.symbol} Price</Trans>
            </Text>
            <RowFixed>
              <Text fontWeight="500">{`${price.toSignificant(5)} `}</Text>
              <Text textAlign="center" color={theme.subText} marginLeft="4px">
                <Trans>{quoteCurrency.symbol}</Trans>
              </Text>
            </RowFixed>
          </RowBetween>
        </OutlineCard>
      </AutoColumn>
    </AutoColumn>
  )
}
