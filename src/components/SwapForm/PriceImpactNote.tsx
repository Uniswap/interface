import { Trans, t } from '@lingui/macro'
import { CSSProperties } from 'react'
import { AlertTriangle } from 'react-feather'
import styled, { useTheme } from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import { checkPriceImpact } from 'utils/prices'

const Wrapper = styled.div<{ veryHigh?: boolean }>`
  padding: 12px 16px;

  display: flex;
  align-items: center;

  border-radius: 999px;
  color: ${({ theme, veryHigh }) => (veryHigh ? theme.red : theme.warning)};
  background: ${({ theme, veryHigh }) => (veryHigh ? `${theme.red}33` : `${theme.warning}33`)};
  font-size: 12px;
`

type Props = {
  isAdvancedMode?: boolean
  priceImpact: number | undefined
  hasTooltip: boolean
  style?: CSSProperties
}
const PriceImpactNote: React.FC<Props> = ({ isAdvancedMode, priceImpact, hasTooltip, style }) => {
  const theme = useTheme()
  const priceImpactResult = checkPriceImpact(priceImpact)

  if (priceImpact === undefined) {
    return null
  }

  // invalid
  if (priceImpactResult.isInvalid) {
    return (
      <Wrapper style={style}>
        <AlertTriangle color={theme.warning} size={16} style={{ marginRight: '10px' }} />
        <Trans>Unable to calculate Price Impact</Trans>
        <InfoHelper text={t`Turn on Advanced Mode to trade`} color={theme.text} />
      </Wrapper>
    )
  }

  if (priceImpactResult.isHigh) {
    return (
      <Wrapper style={style} veryHigh={priceImpactResult.isVeryHigh}>
        <AlertTriangle size={16} style={{ marginRight: '10px' }} />
        {priceImpactResult.isVeryHigh ? <Trans>Price Impact is Very High</Trans> : <Trans>Price Impact is High</Trans>}

        {hasTooltip && (
          <InfoHelper
            color={priceImpactResult.isVeryHigh ? theme.red : theme.warning}
            text={
              isAdvancedMode
                ? t`You have turned on Advanced Mode from settings. Trades with high price impact can be executed`
                : t`Turn on Advanced Mode from settings to execute trades with high price impact`
            }
          />
        )}
      </Wrapper>
    )
  }

  return null
}

export default PriceImpactNote
