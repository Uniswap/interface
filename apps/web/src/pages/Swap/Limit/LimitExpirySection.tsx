import Row from 'components/deprecated/Row'
import { TFunction } from 'i18next'
import { deprecatedStyled } from 'lib/styled-components'
import { Trans, useTranslation } from 'react-i18next'
import { useLimitContext } from 'state/limit/LimitContext'
import { ThemedText } from 'theme/components'
import { ClickableStyle } from 'theme/components/styles'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { LimitsExpiry } from 'uniswap/src/types/limits'

const ExpirySection = deprecatedStyled(Row)`
  width: 100%;
  padding: 12px 16px;
  justify-content: space-between;
`

const LimitExpiryButton = deprecatedStyled.button<{ $selected: boolean }>`
  display: flex;
  padding: 4px 8px;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  border: 1px solid ${({ theme }) => theme.surface3};
  height: 28px;
  border-radius: 999px;
  background-color: ${({ theme, $selected }) => ($selected ? theme.surface3 : 'unset')};
  color: ${({ theme, $selected }) => ($selected ? theme.neutral1 : theme.neutral2)};
  ${ClickableStyle}
`

const EXPIRY_OPTIONS = [LimitsExpiry.Day, LimitsExpiry.Week, LimitsExpiry.Month, LimitsExpiry.Year]

// eslint-disable-next-line consistent-return
function getExpiryLabelText(t: TFunction, expiry: LimitsExpiry): string {
  switch (expiry) {
    case LimitsExpiry.Day:
      return t('common.oneDay')
    case LimitsExpiry.Week:
      return t('common.oneWeek')
    case LimitsExpiry.Month:
      return t('common.oneMonth')
    case LimitsExpiry.Year:
      return t('common.oneYear')
  }
}

export function LimitExpirySection() {
  const { t } = useTranslation()
  const { limitState, setLimitState } = useLimitContext()

  return (
    <ExpirySection>
      <ThemedText.SubHeaderSmall>
        <Trans i18nKey="common.expiry" />
      </ThemedText.SubHeaderSmall>
      <Row justify="flex-end" gap="xs">
        {EXPIRY_OPTIONS.map((expiry) => (
          <LimitExpiryButton
            key={expiry}
            $selected={expiry === limitState.expiry}
            onClick={() => {
              if (expiry === limitState.expiry) {
                return
              }
              sendAnalyticsEvent(InterfaceEventName.LimitExpirySelected, {
                value: expiry,
              })
              setLimitState((prev) => ({
                ...prev,
                expiry,
              }))
            }}
          >
            <ThemedText.LabelSmall color="inherit" fontWeight={535}>
              {getExpiryLabelText(t, expiry)}
            </ThemedText.LabelSmall>
          </LimitExpiryButton>
        ))}
      </Row>
    </ExpirySection>
  )
}
