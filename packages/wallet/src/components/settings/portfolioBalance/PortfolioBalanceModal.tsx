import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Switch, Text, TouchableArea } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { setHideSmallBalances, setHideSpamTokens } from 'uniswap/src/features/settings/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isExtensionApp } from 'utilities/src/platform'

// avoids rendering during animation which makes it laggy
// set to a bit above the Switch animation "simple" which is 80ms
const AVOID_RENDER_DURING_ANIMATION_MS = 100

type PortfolioBalanceModalProps = {
  isOpen: boolean
  onClose: () => void
}

export type PortfolioBalanceModalState = Omit<PortfolioBalanceModalProps, 'onClose' | 'isOpen'>

export function PortfolioBalanceModal({ isOpen, onClose }: PortfolioBalanceModalProps): JSX.Element {
  const { t } = useTranslation()
  const hideSpamTokens = useHideSpamTokensSetting()
  const { isTestnetModeEnabled } = useEnabledChains()
  const dispatch = useDispatch()

  const hideSmallBalances = useHideSmallBalancesSetting()

  const onToggleHideSmallBalances = useCallback(() => {
    setTimeout(() => {
      dispatch(setHideSmallBalances(!hideSmallBalances))
    }, AVOID_RENDER_DURING_ANIMATION_MS)
  }, [dispatch, hideSmallBalances])

  const onToggleHideSpamTokens = useCallback(() => {
    setTimeout(() => {
      dispatch(setHideSpamTokens(!hideSpamTokens))
    }, AVOID_RENDER_DURING_ANIMATION_MS)
  }, [dispatch, hideSpamTokens])

  return (
    <Modal isModalOpen={isOpen} name={ModalName.PortfolioBalanceModal} onClose={onClose}>
      <Flex
        animation="fast"
        gap="$spacing16"
        pb={isExtensionApp ? undefined : '$spacing24'}
        py={isExtensionApp ? '$spacing16' : undefined}
        px="$spacing12"
        width="100%"
      >
        <Flex centered>
          <Text color="$neutral1" variant="subheading1">
            {t('settings.setting.smallBalances.title')}
          </Text>
        </Flex>

        <Flex pr="$spacing12">
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
        </Flex>
      </Flex>
    </Modal>
  )
}

interface PortfolioBalanceOptionProps {
  active?: boolean
  title: string
  subtitle: string
  onCheckedChange?: (checked: boolean) => void
}

function PortfolioBalanceOption({
  active,
  title,
  subtitle,
  onCheckedChange,
}: PortfolioBalanceOptionProps): JSX.Element {
  const { isTestnetModeEnabled } = useEnabledChains()

  return (
    <TouchableArea alignItems="center" flexDirection="row" justifyContent="space-between" py="$spacing12">
      <Flex row shrink>
        <Flex shrink ml="$spacing16">
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
            disabled={isTestnetModeEnabled}
            onCheckedChange={onCheckedChange}
          />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
