import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DoubleArrow } from 'assets/svg/double_arrow.svg'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { Bound } from 'state/mint/proamm/type'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { RotateSwapIcon } from './styles'

const Price = styled.div`
  padding: 6px 28px;
  background-color: ${({ theme }) => theme.buttonGray};
  border-radius: 500px;
  min-width: 120px;
  display: flex;
  justify-content: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding 6px 12px;
  `}
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding 6px 10px;
  `}
`

export default function ProAmmPriceRangeConfirm({
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
        <Text fontSize="12px" fontWeight="500" lineHeight="16px">
          Pool Information
        </Text>
        <Divider />

        <Flex alignItems="center" justifyContent={'space-between'} sx={{ gap: '8px' }}>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <Trans>Current Price</Trans>
          </Text>
          <RowFixed>
            <Text fontSize={'12px'} fontWeight="500" style={{ textAlign: 'right' }}>
              1 {baseCurrency.symbol} = {price.toSignificant(6)} {quoteCurrency.symbol}
            </Text>
            <span onClick={handleRateChange} style={{ marginLeft: '2px', cursor: 'pointer' }}>
              <RotateSwapIcon rotated={baseCurrency !== currency0} size={16} />
            </span>
          </RowFixed>
        </Flex>
        <Divider />

        <Flex>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <Trans>
              Price Range ({quoteCurrency.symbol} per {baseCurrency.symbol})
            </Trans>
          </Text>
          <InfoHelper
            text={t`Represents the range where all your liquidity is concentrated. When market price of your token pair is no longer between your selected price range, your liquidity becomes inactive and you stop earning fees`}
            placement="right"
            size={12}
          />
        </Flex>

        <RowBetween style={{ gap: '10px' }}>
          <Price>
            <Text
              fontSize="14px"
              fontWeight={500}
              color={theme.text}
              lineHeight="20px"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Trans>{formatTickPrice(priceLower, ticksAtLimit, Bound.LOWER)}</Trans>
              <InfoHelper
                text={t`Your position will be 100% composed of ${baseCurrency?.symbol} at this price`}
                placement={'right'}
                size={12}
              />
            </Text>
          </Price>
          <DoubleArrow width="18px" height="8px" />
          <Price>
            <Text
              fontSize="14px"
              fontWeight={500}
              color={theme.text}
              lineHeight="20px"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Trans>{formatTickPrice(priceUpper, ticksAtLimit, Bound.UPPER)}</Trans>
              <InfoHelper
                text={t`Your position will be 100% composed of ${quoteCurrency?.symbol} at this price`}
                placement={'right'}
                size={12}
              />
            </Text>
          </Price>
        </RowBetween>
      </AutoColumn>
    </OutlineCard>
  )
}
