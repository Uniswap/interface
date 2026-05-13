import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { LimitsExpiry } from 'uniswap/src/types/limits'
import { useLimitContext } from '~/features/Swap/state/limit/LimitContext'
import { deprecatedStyled } from '~/lib/deprecated-styled'
import { ClickableStyle } from '~/theme/components/styles'

const ExpirySection = deprecatedStyled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
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

// oxlint-disable-next-line typescript/consistent-return
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
      <Text variant="body3" color="$neutral2">
        {t('common.expiry')}
      </Text>
      <Flex row justifyContent="flex-end" gap="$gap4" alignItems="center">
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
            <Text variant="buttonLabel3" color="inherit">
              {getExpiryLabelText(t, expiry)}
            </Text>
          </LimitExpiryButton>
        ))}
      </Flex>
    </ExpirySection>
  )
}
