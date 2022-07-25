import { Position } from '@kyberswap/ks-sdk-elastic'
import React, { useCallback, useState } from 'react'
import { Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { AutoColumn } from 'components/Column'
import Card, { OutlineCard } from 'components/Card'
import Divider from 'components/Divider'
import { RowBetween, RowFixed } from 'components/Row'
import { Trans, t } from '@lingui/macro'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { Swap2 as SwapIcon } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import { formatTickPrice } from 'utils/formatTickPrice'
import { Bound } from 'state/mint/proamm/actions'
import styled from 'styled-components'
import { rgba } from 'polished'

const PriceRangeCard = styled(Card)`
  background-color: ${({ theme }) => rgba(theme.buttonGray, 0.6)};
`
export default function ProAmmPriceRange({
  position,
  ticksAtLimit,
  layout = 0,
}: {
  position: Position
  ticksAtLimit: { [bound: string]: boolean | undefined }
  layout?: number
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
      <AutoColumn gap="13px">
        {layout === 0 && (
          <>
            {' '}
            <Text fontSize="16px" fontWeight="500">
              Pool Information
            </Text>
            <Divider />
          </>
        )}

        <RowBetween>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <Trans>{layout === 0 ? 'CURRENT PRICE' : 'Current Price'}</Trans>
          </Text>
          <RowFixed>
            <Text fontSize={layout === 0 ? '14px' : '12px'} style={{ textAlign: 'right' }}>{`${price.toSignificant(
              10,
            )} ${quoteCurrency.symbol} per ${baseCurrency.symbol}`}</Text>
            <span onClick={handleRateChange} style={{ marginLeft: '2px', cursor: 'pointer' }}>
              <SwapIcon size={layout === 0 ? 16 : 14} />
            </span>
          </RowFixed>
        </RowBetween>

        <Divider />
        <Flex>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <Trans>{layout === 0 ? 'SELECTED PRICE RANGE' : 'Selected Price Range'}</Trans>
          </Text>
          <InfoHelper
            text={t`Represents the range where all your liquidity is concentrated. When market price of your token pair is no longer between your selected price range, your liquidity becomes inactive and you stop earning fees`}
            placement={'right'}
            size={12}
          ></InfoHelper>
        </Flex>
        <RowBetween style={{ gap: '12px' }}>
          <PriceRangeCard width="48%" padding="12px 8px">
            <AutoColumn gap="10px" justify="center">
              <Flex>
                <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                  <Trans>MIN PRICE</Trans>
                </Text>
                <InfoHelper
                  text={t`Your position will be 100% composed of ${baseCurrency?.symbol} at this price`}
                  placement={'right'}
                  size={12}
                ></InfoHelper>
              </Flex>
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
            </AutoColumn>
          </PriceRangeCard>
          <PriceRangeCard width="48%" padding="12px 8px">
            <AutoColumn gap="10px" justify="center">
              <Flex>
                <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                  <Trans>MAX PRICE</Trans>
                </Text>
                <InfoHelper
                  text={t`Your position will be 100% composed of ${quoteCurrency?.symbol} at this price`}
                  placement={'right'}
                  size={12}
                ></InfoHelper>
              </Flex>
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
            </AutoColumn>
          </PriceRangeCard>
        </RowBetween>
      </AutoColumn>
    </OutlineCard>
  )
}
