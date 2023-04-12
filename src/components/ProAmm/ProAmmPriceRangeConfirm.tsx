import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import React, { useCallback, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DoubleArrow } from 'assets/svg/double_arrow.svg'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { Bound } from 'state/mint/proamm/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { ExternalLink, TYPE } from 'theme'
import { toSignificantOrMaxIntegerPart } from 'utils/formatCurrencyAmount'
import { formatTickPrice } from 'utils/formatTickPrice'
import { checkWarningSlippage, formatSlippage } from 'utils/slippage'
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

  const [allowedSlippage] = useUserSlippageTolerance()
  const isWarningSlippage = checkWarningSlippage(allowedSlippage, false)

  return (
    <OutlineCard marginTop="1rem" padding="1rem">
      <AutoColumn gap="12px">
        <Text fontSize="12px" fontWeight="500" lineHeight="16px">
          More Information
        </Text>
        <Divider />

        <Flex alignItems="center" justifyContent="space-between" sx={{ gap: '8px' }}>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <Trans>Current Price</Trans>
          </Text>
          <RowFixed>
            <Text fontSize={'12px'} fontWeight="500" style={{ textAlign: 'right' }}>
              1 {baseCurrency.symbol} = {toSignificantOrMaxIntegerPart(price, 6)} {quoteCurrency.symbol}
            </Text>
            <span onClick={handleRateChange} style={{ marginLeft: '2px', cursor: 'pointer' }}>
              <RotateSwapIcon rotated={baseCurrency !== currency0} size={16} />
            </span>
          </RowFixed>
        </Flex>

        <Flex alignItems="center" justifyContent="space-between" sx={{ gap: '8px' }}>
          <TextDashed fontSize={12} fontWeight={500} color={theme.subText} minWidth="max-content">
            <MouseoverTooltip
              width="200px"
              text={
                <Text>
                  <Trans>
                    During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                    <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage">
                      here ↗
                    </ExternalLink>
                  </Trans>
                </Text>
              }
              placement="auto"
            >
              <Trans>Max Slippage</Trans>
            </MouseoverTooltip>
          </TextDashed>
          <TYPE.black fontSize={12} color={isWarningSlippage ? theme.warning : undefined}>
            {formatSlippage(allowedSlippage)}
          </TYPE.black>
        </Flex>

        <Divider />

        <Flex>
          <TextDashed fontSize={12} fontWeight={500} color={theme.subText} minWidth="max-content">
            <MouseoverTooltip
              width="200px"
              text={
                <Trans>
                  Represents the range where all your liquidity is concentrated. When market price of your token pair is
                  no longer between your selected price range, your liquidity becomes inactive and you stop earning
                  fees.
                </Trans>
              }
              placement="auto"
            >
              <Trans>
                Price Range ({quoteCurrency.symbol} per {baseCurrency.symbol})
              </Trans>
            </MouseoverTooltip>
          </TextDashed>
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
              {formatTickPrice(priceLower, ticksAtLimit, Bound.LOWER)}
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
              {formatTickPrice(priceUpper, ticksAtLimit, Bound.UPPER)}
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
