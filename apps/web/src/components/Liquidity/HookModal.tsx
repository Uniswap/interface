import { FlagWarning, getFlagsFromContractAddress, getFlagWarning } from 'components/Liquidity/utils'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { useMemo, useState } from 'react'
import { CopyHelper } from 'theme/components'
import { Button, Checkbox, Flex, HeightAnimator, Separator, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useTranslation } from 'uniswap/src/i18n'
import { shortenAddress } from 'uniswap/src/utils/addresses'

function HookWarnings({ flags }: { flags: FlagWarning[] }) {
  const { t } = useTranslation()

  const [expandedProperties, setExpandedProperties] = useState(false)

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
          <Flex flex={1}>
            <Text variant="buttonLabel3" color="$neutral2">
              {t('position.addingHook.viewProperties')}
            </Text>
          </Flex>
          <RotatableChevron direction={expandedProperties ? 'up' : 'down'} color="$neutral2" width={16} height={16} />
        </Flex>
      </TouchableArea>
      {expandedProperties && (
        <Flex gap="$gap8" mt="$padding16">
          {flags.map(({ name, info, dangerous }) => (
            <Flex key={name} row>
              <Flex flex={1}>
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

export function HookModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)

  const {
    setPositionState,
    positionState: { hook },
  } = useCreatePositionContext()

  const clearHook = () => {
    setPositionState((state) => ({
      ...state,
      hook: undefined,
    }))
    onClose()
  }

  const onContinue = () => {
    if (disclaimerChecked) {
      onClose()
    }
  }

  const onDisclaimerChecked = () => {
    setDisclaimerChecked((state) => !state)
  }

  const { flags, hasDangerous } = useMemo(() => {
    if (!hook) {
      return {
        flags: [],
        hasDangerous: false,
      }
    }

    let hasDangerous = false
    const flagInfos: Record<string, FlagWarning> = {}
    getFlagsFromContractAddress(hook).forEach((flag) => {
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
  }, [hook, t])

  if (!hook) {
    return null
  }

  // TODO(WEB-5289): match entrance/exit animations with the currency selector
  return (
    <Modal name={ModalName.Hook} onClose={onClose} isModalOpen={isOpen}>
      <Flex gap="$spacing24">
        <GetHelpHeader closeModal={onClose} />
        <Flex gap="$gap8" alignContent="center" px="$padding20">
          <Text variant="subheading1" textAlign="center">
            {hasDangerous ? t('position.hook.warningHeader') : t('position.addingHook')}
          </Text>
          <Text variant="body2" color="$neutral2" textAlign="center">
            {hasDangerous ? t('position.hook.warningInfo') : t('position.addingHook.disclaimer')}
          </Text>
          <LearnMoreLink centered url={uniswapUrls.helpArticleUrls.v4HooksInfo} textVariant="buttonLabel3" />
        </Flex>

        <HeightAnimator animation="fast">
          <Flex borderRadius="$rounded16" backgroundColor="$surface2" py="$gap12" px="$gap16">
            <Flex row>
              <Flex flex={1}>
                <Text variant="body3" color="$neutral2">
                  {t('common.text.contract')}
                </Text>
              </Flex>
              <CopyHelper toCopy={hook} iconSize={16} iconPosition="right" color="$neutral2">
                <Text variant="body3" color="$neutral2">
                  {shortenAddress(hook)}
                </Text>
              </CopyHelper>
            </Flex>
            <HookWarnings flags={flags} />
          </Flex>

          {hasDangerous && (
            <Flex
              row
              alignItems="center"
              gap="$gap12"
              borderRadius="$rounded16"
              backgroundColor="$surface2"
              p="$gap12"
              mt="$spacing24"
            >
              <Checkbox size="$icon.16" checked={disclaimerChecked} onPress={onDisclaimerChecked} />
              <Text variant="buttonLabel4" color="$neutral2">
                {t('position.hook.disclaimer')}
              </Text>
            </Flex>
          )}

          <Flex row gap="$gap8" mt="$spacing24">
            <Button size="small" theme="secondary" width="49%" onPress={clearHook}>
              {t('position.removeHook')}
            </Button>
            <Button disabled={!disclaimerChecked} size="small" theme="primary" width="49%" onPress={onContinue}>
              {t('common.button.continue')}
            </Button>
          </Flex>
        </HeightAnimator>
      </Flex>
    </Modal>
  )
}
