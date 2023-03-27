import { Trans, t } from '@lingui/macro'
import { FC } from 'react'
import { Text } from 'rebass'

import WarningNote from 'components/WarningNote'
import { checkPriceImpact } from 'utils/prices'

type Props = {
  isDegenMode?: boolean
  priceImpact: number | undefined
}
const PriceImpactNote: FC<Props> = ({ isDegenMode, priceImpact }) => {
  const priceImpactResult = checkPriceImpact(priceImpact)

  if (typeof priceImpact !== 'number') {
    return null
  }

  // invalid
  if (priceImpactResult.isInvalid) {
    return (
      <WarningNote
        level="serious"
        shortText={
          <Text>
            <Trans>Unable to calculate Price Impact</Trans>
          </Text>
        }
        longText={
          <Text>
            {isDegenMode ? (
              <Trans>
                You have turned on <b>Advanced Mode</b> from settings. Trades can still be executed when price impact
                cannot be calculated.
              </Trans>
            ) : (
              <Trans>
                You can turn on <b>Advanced Mode</b> from Settings to execute trades when price impact cannot be
                calculated. This can result in bad rates and loss of funds!
              </Trans>
            )}
          </Text>
        }
      />
    )
  }

  // VERY high
  if (priceImpactResult.isVeryHigh) {
    return (
      <WarningNote
        level="serious"
        shortText={
          <Text>
            <Trans>
              Price Impact is <b>very</b> high
            </Trans>
          </Text>
        }
        longText={
          <Text>
            {isDegenMode ? (
              <Trans>
                You have turned on <b>Advanced Mode</b> from settings. Trades with <b>very</b> high price impact can be
                executed.
              </Trans>
            ) : (
              <Trans>
                You can turn on <b>Advanced Mode</b> from Settings to execute trades with <b>very</b> high price impact.
                This can result in bad rates and loss of funds!
              </Trans>
            )}
          </Text>
        }
      />
    )
  }

  // high
  if (priceImpactResult.isHigh) {
    return <WarningNote shortText={t`Price Impact is high`} />
  }

  return null
}

export default PriceImpactNote
