import Expand from 'components/Expand'
import { PrivacyOptions } from 'components/Icons/PrivacyOptions'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useOpenModal, useTogglePrivacyPolicy } from 'state/application/hooks'
import { Anchor, AnchorProps, Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const MenuLink = ({ children, ...rest }: AnchorProps) => (
  <Anchor textDecorationLine="none" cursor="pointer" group {...rest}>
    <Text
      color="$neutral2"
      $group-hover={{ color: '$accent1' }}
      animation="fastHeavy"
      variant="body4"
      display="flex"
      alignItems="center"
      gap="$gap4"
    >
      {children}
    </Text>
  </Anchor>
)

export function LegalAndPrivacyMenu({ closeMenu }: { closeMenu?: () => void }) {
  const { toggle: toggleIsOpen, value: isOpen } = useBooleanState(false)
  const { t } = useTranslation()
  const togglePrivacyPolicy = useTogglePrivacyPolicy()
  const openPrivacyChoices = useOpenModal({ name: ModalName.PrivacyChoices })
  const handleOnMenuPress = useCallback(
    (handler: () => void) => () => {
      handler()
      closeMenu?.()
    },
    [closeMenu],
  )

  return (
    <Expand
      isOpen={isOpen}
      onToggle={toggleIsOpen}
      iconSize="icon16"
      button={
        <Text color="$neutral2" variant="body4" pr={spacing.spacing4}>
          {t('common.legalAndPrivacy')}
        </Text>
      }
    >
      <Flex gap="$gap8">
        <MenuLink onPress={handleOnMenuPress(openPrivacyChoices)}>
          <PrivacyOptions /> {t('common.privacyChoices')}
        </MenuLink>
        <MenuLink onPress={handleOnMenuPress(togglePrivacyPolicy)}>{t('common.privacyPolicy')}</MenuLink>
        <MenuLink href={uniswapUrls.termsOfServiceUrl} target="_blank">
          {t('common.termsOfService')}
        </MenuLink>
      </Flex>
    </Expand>
  )
}
