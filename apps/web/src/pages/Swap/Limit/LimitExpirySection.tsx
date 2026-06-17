import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, TouchableArea } from 'ui/src'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { LimitsExpiry } from 'uniswap/src/types/limits'
import { useLimitContext } from '~/pages/Swap/Limit/state/LimitContext'

const ExpirySection = styled(Flex, {
  row: true,
  alignItems: 'center',
  width: '100%',
  py: '$spacing12',
  px: '$spacing16',
  justifyContent: 'space-between',
})

const LimitExpiryButton = styled(TouchableArea, {
  name: 'LimitExpiryButton',
  tag: 'button',
  row: true,
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '$gap4',
  height: '$spacing28',
  borderRadius: '$roundedFull',
  borderWidth: 1,
  borderStyle: 'solid',
  px: '$spacing8',
  py: '$spacing4',
  userSelect: 'none',

  variants: {
    selected: {
      true: {
        backgroundColor: '$surface3',
        borderColor: '$surface3',
      },
      false: {
        backgroundColor: 'transparent',
        borderColor: '$surface3',
      },
    },
  },

  defaultVariants: {
    selected: false,
  },
})

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
            selected={expiry === limitState.expiry}
            onPress={() => {
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
            <Text variant="buttonLabel3" color={expiry === limitState.expiry ? '$neutral1' : '$neutral2'}>
              {getExpiryLabelText(t, expiry)}
            </Text>
          </LimitExpiryButton>
        ))}
      </Flex>
    </ExpirySection>
  )
}
