import { Percent } from '@taraswap/sdk-core'
import { OutlineCard } from 'components/Card'
import { Trans } from 'i18n'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { opacify } from 'theme/utils'
import { useFormatter } from 'utils/formatNumbers'

import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { MouseoverTooltip } from '../Tooltip'

const StyledCard = styled(OutlineCard)`
  padding: 12px;
  border: 1px solid ${({ theme }) => opacify(24, theme.critical)};
`

interface PriceImpactWarningProps {
  priceImpact: Percent
}

export default function PriceImpactWarning({ priceImpact }: PriceImpactWarningProps) {
  const { formatPercent } = useFormatter()
  const theme = useTheme()

  return (
    <StyledCard>
      <AutoColumn gap="sm">
        <MouseoverTooltip text={<Trans i18nKey="swap.priceImpact.high" />}>
          <RowBetween>
            <RowFixed>
              <ThemedText.DeprecatedSubHeader color={theme.critical}>
                <Trans i18nKey="common.priceImpact" />
              </ThemedText.DeprecatedSubHeader>
            </RowFixed>
            <ThemedText.DeprecatedLabel textAlign="right" fontSize={14} color="critical">
              ~{formatPercent(priceImpact)}
            </ThemedText.DeprecatedLabel>
          </RowBetween>
        </MouseoverTooltip>
      </AutoColumn>
    </StyledCard>
  )
}
