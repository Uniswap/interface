import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Flex, Text } from 'rebass'

import HoverInlineText from 'components/HoverInlineText'
import SwitchIcon from 'components/Icons/SwitchIcon'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'

import { Spin } from '../styled'

function NewPoolNote({
  marketPrice,
  onRefreshPrice,
  loading,
  baseCurrency,
  quoteCurrency,
}: {
  marketPrice: number
  onRefreshPrice: () => void
  loading: boolean
  baseCurrency: Currency | undefined | null
  quoteCurrency: Currency | undefined | null
}) {
  const theme = useTheme()
  const [invertMarketPrice, setInvertMarketPrice] = useState(false)
  return (
    <Flex flexDirection="column" sx={{ gap: 20 }}>
      <RowBetween sx={{ borderBottom: `1px solid ${theme.border}` }} paddingBottom="20px !important">
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
      <Text fontWeight="500" color={theme.subText} fontSize="12px" fontStyle="italic">
        <Trans>Gas fees will be higher than usual due to initialization of the pool.</Trans>
      </Text>
    </Flex>
  )
}

export default NewPoolNote
