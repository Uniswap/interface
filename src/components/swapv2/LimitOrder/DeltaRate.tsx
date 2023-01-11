import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Text } from 'rebass'

import InfoHelper from 'components/InfoHelper'
import { Label } from 'components/swapv2/LimitOrder/LimitOrderForm'
import useTheme from 'hooks/useTheme'

import { RateInfo } from './type'

const DeltaRate = ({
  marketPrice,
  rateInfo,
  symbolIn,
}: {
  marketPrice: Price<Currency, Currency> | undefined
  rateInfo: RateInfo
  symbolIn: string
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
  const sign = delta > 0 ? '+' : ''
  const deltaText = `${Math.abs(delta) > 100 ? '>100' : `${sign}${delta.toFixed(2)}`}%`
  const color = delta > 0 ? theme.apr : theme.red
  console.log(delta)

  return (
    <Label style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
      <Trans>Sell {symbolIn} at rate</Trans>
      {Math.abs(delta) > 0.009 && percent ? (
        <>
          <Text as="span" color={color}>
            &nbsp;{deltaText}
          </Text>
          <InfoHelper
            color={color}
            text={t`Your selected price is ${deltaText} ${delta > 0 ? `above` : `below`} the current market price.`}
          />
        </>
      ) : null}
    </Label>
  )
}
export default DeltaRate
