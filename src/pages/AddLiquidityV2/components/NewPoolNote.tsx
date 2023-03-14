import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Flex, Text } from 'rebass'

import HoverInlineText from 'components/HoverInlineText'
import SwitchIcon from 'components/Icons/SwitchIcon'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/mint/proamm/type'
import { ExternalLink, TYPE } from 'theme'
import { formattedNum } from 'utils'

import { Spin } from '../styled'

function NewPoolNote({
  marketPrice,
  onRefreshPrice,
  loading,
  baseCurrency,
  quoteCurrency,
  amountUnlockUSD,
  amountUnlocks,
}: {
  marketPrice: number
  onRefreshPrice: () => void
  loading: boolean
  baseCurrency: Currency | undefined | null
  quoteCurrency: Currency | undefined | null
  amountUnlockUSD: number
  amountUnlocks: { [field in Field]: CurrencyAmount<Currency> }
}) {
  const theme = useTheme()
  const [invertMarketPrice, setInvertMarketPrice] = useState(false)
  return (
    <>
      <RowBetween>
        <Text fontWeight="500" color={theme.subText} fontSize="12px">
          <Trans>Market Price</Trans>
        </Text>
        <TYPE.main fontSize="14px">
          {marketPrice ? (
            <Flex alignItems="center">
              <Flex sx={{ cursor: 'pointer', marginRight: '6px' }} role="button" onClick={onRefreshPrice}>
                <Spin spinning={loading} />
              </Flex>
              <HoverInlineText
                maxCharacters={24}
                text={
                  !invertMarketPrice
                    ? `1 ${baseCurrency?.symbol} = ${formattedNum(marketPrice.toString())} ${quoteCurrency?.symbol}`
                    : `1 ${quoteCurrency?.symbol} = ${formattedNum((1 / marketPrice).toString())} ${
                        baseCurrency?.symbol
                      }`
                }
              />

              <Flex css={{ cursor: 'pointer' }} role="button" onClick={() => setInvertMarketPrice(prev => !prev)}>
                <SwitchIcon />
              </Flex>
            </Flex>
          ) : (
            '--'
          )}
        </TYPE.main>
      </RowBetween>

      <Text fontSize="12px" fontStyle="italic" color={theme.subText}>
        <Trans>Note:</Trans>
        <Text marginLeft="0.5rem" marginTop="0.5rem" lineHeight="1rem">
          <li>
            <Trans>Gas fees will be higher than usual due to initialization of the pool.</Trans>
          </li>
        </Text>
        <Text marginLeft="0.5rem" marginTop="0.5rem" lineHeight="1rem">
          <li>
            <Trans>
              A very small amount of your liquidity about {formattedNum(amountUnlockUSD.toString(), true)}{' '}
              <Text as="span" color={theme.warning}>
                ({amountUnlocks[Field.CURRENCY_A].toSignificant(6)} {amountUnlocks[Field.CURRENCY_A].currency.symbol},{' '}
                {amountUnlocks[Field.CURRENCY_B].toSignificant(6)} {amountUnlocks[Field.CURRENCY_B].currency.symbol})
              </Text>{' '}
              will be used to first initialize the pool. Read more{' '}
              <ExternalLink href="https://docs.kyberswap.com/overview/elastic-walkthrough#pool-unlocking--initialization">
                here↗
              </ExternalLink>
            </Trans>
          </li>
        </Text>
      </Text>
    </>
  )
}

export default NewPoolNote
