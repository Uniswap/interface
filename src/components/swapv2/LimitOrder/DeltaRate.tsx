import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import InfoHelper from 'components/InfoHelper'
import useTheme from 'hooks/useTheme'

import { Label } from '.'
import { RateInfo } from './type'

const DeltaRate = ({
  marketPrice,
  rateInfo,
}: {
  marketPrice: Price<Currency, Currency> | undefined
  rateInfo: RateInfo
}) => {
  const theme = useTheme()
  let percent: number | string = ''
  try {
    if (marketPrice && rateInfo.rate && rateInfo.invertRate) {
      const { rate, invert, invertRate } = rateInfo
      const ourRate = Number(invert ? invertRate : rate)
      const marketRate = Number(invert ? marketPrice.invert().toFixed(10) : marketPrice.toFixed(10))
      percent = ((ourRate - marketRate) / marketRate) * 100
    }
  } catch (error) {
    console.log(error)
  }

  const delta = Number(percent)
  const deltaText = `${delta > 0 ? '+' : ''}${delta.toFixed(5)}%`
  const color = delta > 0 ? theme.apr : theme.red

  return (
    <Label style={{ marginBottom: 0, display: 'flex', alignItems: 'center' }}>
      <Trans>
        Price &nbsp;
        {Math.abs(delta) > 0.0005 && percent ? (
          <Flex alignItems={'center'} color={color}>
            <Text>({deltaText} </Text>
            <InfoHelper
              color={color}
              text={t`Your selected price is ${deltaText} ${delta > 0 ? `above` : `below`} the current market price.`}
            />
            )
          </Flex>
        ) : null}
      </Trans>
    </Label>
  )
}
export default DeltaRate
