import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Switch, Text, TouchableArea } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  useHideReportedActivitySetting,
  useHideSmallBalancesSetting,
  useHideSpamTokensSetting,
} from 'uniswap/src/features/settings/hooks'
import { setHideReportedActivity, setHideSmallBalances, setHideSpamTokens } from 'uniswap/src/features/settings/slice'
import { isWebApp } from 'utilities/src/platform'

// avoids rendering during animation which makes it laggy
// set to a bit above the Switch animation "simple" which is 80ms
const AVOID_RENDER_DURING_ANIMATION_MS = 100

export function PortfolioBalanceSettingsContent(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { isTestnetModeEnabled } = useEnabledChains()

  const hideSmallBalances = useHideSmallBalancesSetting()
  const onToggleHideSmallBalances = useCallback(() => {
    setTimeout(() => {
      dispatch(setHideSmallBalances(!hideSmallBalances))
    }, AVOID_RENDER_DURING_ANIMATION_MS)
  }, [dispatch, hideSmallBalances])

  const hideSpamTokens = useHideSpamTokensSetting()
  const onToggleHideSpamTokens = useCallback(() => {
    setTimeout(() => {
      dispatch(setHideSpamTokens(!hideSpamTokens))
    }, AVOID_RENDER_DURING_ANIMATION_MS)
  }, [dispatch, hideSpamTokens])

  const hideReportedActivity = useHideReportedActivitySetting()
  const onToggleHideReportedActivity = useCallback(() => {
    setTimeout(() => {
      dispatch(setHideReportedActivity(!hideReportedActivity))
    }, AVOID_RENDER_DURING_ANIMATION_MS)
  }, [dispatch, hideReportedActivity])

  return (
    <Flex mx={isWebApp ? undefined : '$spacing16'}>
      <PortfolioBalanceOption
        active={hideSmallBalances && !isTestnetModeEnabled}
        subtitle={t('settings.hideSmallBalances.subtitle')}
        title={t('settings.hideSmallBalances')}
        onCheckedChange={onToggleHideSmallBalances}
      />
      <PortfolioBalanceOption
        active={hideSpamTokens}
        subtitle={t('settings.setting.unknownTokens.subtitle')}
        title={t('settings.setting.unknownTokens.title')}
        onCheckedChange={onToggleHideSpamTokens}
      />
      <PortfolioBalanceOption
        active={hideReportedActivity}
        subtitle={t('settings.setting.reportedActivity.subtitle')}
        title={t('settings.setting.reportedActivity.title')}
        disableInTestnetMode={false}
        onCheckedChange={onToggleHideReportedActivity}
      />
    </Flex>
  )
}

interface PortfolioBalanceOptionProps {
  active?: boolean
  title: string
  subtitle: string
  onCheckedChange?: (checked: boolean) => void
  disableInTestnetMode?: boolean
}

function PortfolioBalanceOption({
  active,
  title,
  subtitle,
  onCheckedChange,
  disableInTestnetMode = true,
}: PortfolioBalanceOptionProps): JSX.Element {
  const { isTestnetModeEnabled } = useEnabledChains()

  return (
    <TouchableArea alignItems="center" flexDirection="row" justifyContent="space-between" py="$spacing12">
      <Flex row shrink alignItems="center">
        <Flex shrink>
          <Text color="$neutral1" variant="subheading2">
            {title}
          </Text>
          <Text color="$neutral2" pr="$spacing12" variant="body3">
            {subtitle}
          </Text>
        </Flex>

        <Flex grow alignItems="flex-end">
          <Switch
            checked={active}
            variant="branded"
            disabled={isTestnetModeEnabled && disableInTestnetMode}
            onCheckedChange={onCheckedChange}
          />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
