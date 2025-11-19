import {
  type FlagWarning,
  getFlagsFromContractAddress,
  getFlagWarning,
} from 'components/Liquidity/utils/getFlagWarnings'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyHelper } from 'theme/components/CopyHelper'
import { Button, Checkbox, Flex, HeightAnimator, Separator, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { ContractInteraction } from 'ui/src/components/icons/ContractInteraction'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { Page } from 'ui/src/components/icons/Page'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'

function HookWarnings({ flags, hasDangerous }: { flags: FlagWarning[]; hasDangerous: boolean }) {
  const { t } = useTranslation()

  const [expandedProperties, setExpandedProperties] = useState(hasDangerous)

  const toggleExpandedProperties = () => {
    setExpandedProperties((state) => !state)
  }

  if (!flags.length) {
    return null
  }

  return (
    <>
      <Separator my="$gap8" />
      <TouchableArea onPress={toggleExpandedProperties}>
        <Flex row alignItems="center">
          <Flex row flex={1} gap="$gap4" alignItems="center">
            <ContractInteraction color="$neutral2" size="$icon.16" />
            <Text variant="buttonLabel3" color="$neutral2">
              {expandedProperties ? t('position.addingHook.hideProperties') : t('position.addingHook.viewProperties')}
            </Text>
          </Flex>
          <RotatableChevron direction={expandedProperties ? 'up' : 'down'} color="$neutral2" width={16} height={16} />
        </Flex>
      </TouchableArea>
      {expandedProperties && (
        <Flex gap="$gap8" mt="$padding16">
          {flags.map(({ Icon, name, info, dangerous }) => (
            <Flex key={name} row>
              <Flex row flex={1} alignItems="center" gap="$gap4" mb="auto">
                <Icon size="$icon.16" color={dangerous ? '$statusCritical' : '$neutral2'} />
                <Text variant="body3" color={dangerous ? '$statusCritical' : '$neutral2'}>
                  {name}
                </Text>
              </Flex>
              <Flex flexWrap="wrap" width="55%">
                <Text variant="body4" color={dangerous ? '$statusCritical' : '$neutral2'}>
                  {info}
                </Text>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}
    </>
  )
}

export function HookModal({
  isOpen,
  onClose,
  onClearHook,
  onContinue,
  address,
}: {
  address: Address
  isOpen: boolean
  onClose: () => void
  onClearHook: () => void
  onContinue: () => void
}) {
  const { t } = useTranslation()
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)

  const handleClearHook = () => {
    onClearHook()
    onClose()
  }

  const onDisclaimerChecked = () => {
    setDisclaimerChecked((state) => !state)
  }

  const { flags, hasDangerous } = useMemo(() => {
    if (!address) {
      return {
        flags: [],
        hasDangerous: false,
      }
    }

    let hasDangerous = false
    const flagInfos: Record<string, FlagWarning> = {}
    getFlagsFromContractAddress(address).forEach((flag) => {
      const warning = getFlagWarning(flag, t)

      if (warning?.dangerous) {
        hasDangerous = true
      }

      if (warning?.name) {
        flagInfos[warning.name] = warning
      }
    })

    return {
      flags: Object.values(flagInfos),
      hasDangerous,
    }
  }, [address, t])

  const canContinue = !hasDangerous || disclaimerChecked
  const handleContinue = () => {
    if (canContinue) {
      onContinue()
      onClose()
    }
  }

  if (!address) {
    return null
  }

  // TODO(WEB-5289): match entrance/exit animations with the currency selector
  return (
    <Modal
      name={ModalName.Hook}
      onClose={onClose}
      isModalOpen={isOpen}
      analyticsProperties={{ hook_address: address, hasDangerous }}
    >
      <HeightAnimator>
        <Flex gap="$spacing24">
          <GetHelpHeader closeModal={onClose} />
          <Flex>
            <Flex
              mx="auto"
              p="$padding12"
              borderRadius="$rounded12"
              backgroundColor={hasDangerous ? '$statusCritical2' : '$surface3'}
              justifyContent="center"
            >
              {hasDangerous ? (
                <AlertTriangleFilled size="$icon.24" color="$statusCritical" />
              ) : (
                <DocumentList size="$icon.24" color="$neutral1" />
              )}
            </Flex>
            <Text variant="subheading1" textAlign="center" mt="$padding16">
              {hasDangerous ? t('position.hook.warningHeader') : t('position.addingHook')}
            </Text>
            <Text variant="body2" color="$neutral2" textAlign="center" my="$padding8">
              {hasDangerous ? t('position.hook.warningInfo') : t('position.addingHook.disclaimer')}
            </Text>
            <LearnMoreLink centered url={uniswapUrls.helpArticleUrls.addingV4Hooks} textVariant="buttonLabel3" />
          </Flex>

          <Flex borderRadius="$rounded16" backgroundColor="$surface2" py="$gap12" px="$gap16">
            <Flex row>
              <Flex row alignItems="center" flex={1} gap="$gap4">
                <Page color="$neutral2" size="$icon.16" />
                <Text variant="body3" color="$neutral2">
                  {t('common.text.contract')}
                </Text>
              </Flex>
              <CopyHelper toCopy={address} iconSize={16} iconPosition="right" color="$neutral2">
                <Text variant="body3" color="$neutral2">
                  {shortenAddress({ address })}
                </Text>
              </CopyHelper>
            </Flex>
            <HookWarnings flags={flags} hasDangerous={hasDangerous} />
          </Flex>

          {hasDangerous && (
            <Flex row alignItems="center" gap="$gap8" borderRadius="$rounded16" backgroundColor="$surface2" p="$gap12">
              <Checkbox size="$icon.16" checked={disclaimerChecked} onPress={onDisclaimerChecked} />
              <Text variant="buttonLabel4" color="$neutral2">
                {t('position.hook.disclaimer')}
              </Text>
            </Flex>
          )}

          <Flex row gap="$gap8">
            <Trace logPress element={ElementName.Cancel}>
              <Button size="small" emphasis="secondary" onPress={handleClearHook}>
                {t('position.removeHook')}
              </Button>
            </Trace>
            <Trace logPress element={ElementName.Continue}>
              <Button
                isDisabled={!canContinue}
                size="small"
                variant="branded"
                onPress={handleContinue}
                data-testid={TestID.HookModalContinueButton}
              >
                {t('common.button.continue')}
              </Button>
            </Trace>
          </Flex>
        </Flex>
      </HeightAnimator>
    </Modal>
  )
}
