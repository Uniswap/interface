import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, AnchorProps, Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { Expand } from '~/components/Expand'
import { PrivacyOptions } from '~/components/Icons/PrivacyOptions'
import { MobileTouchableArea } from '~/components/MobileTouchableArea'
import { useModalState } from '~/hooks/useModalState'

const MenuLink = ({ children, ...rest }: AnchorProps) => (
  <Anchor textDecorationLine="none" cursor="pointer" group {...rest}>
    <MobileTouchableArea>
      <Text
        color="$neutral2"
        $group-hover={{ color: '$accent1' }}
        transition="all 0.1s ease-in-out"
        variant="body4"
        display="flex"
        alignItems="center"
        gap="$gap4"
      >
        {children}
      </Text>
    </MobileTouchableArea>
  </Anchor>
)

export function LegalAndPrivacyMenu({ closeMenu }: { closeMenu?: () => void }) {
  const { toggle: toggleIsOpen, value: isOpen } = useBooleanState(false)
  const { t } = useTranslation()
  const { toggleModal: togglePrivacyPolicy } = useModalState(ModalName.PrivacyPolicy)
  const { toggleModal: toggleDisclosures } = useModalState(ModalName.Disclosures)
  const { openModal: openPrivacyChoices } = useModalState(ModalName.PrivacyChoices)
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
      iconSize="$icon.16"
      button={
        <Text color="$neutral2" variant="body4" pr={spacing.spacing4}>
          {t('common.legalAndPrivacy')}
        </Text>
      }
      paddingTop="8px"
      width="100%"
    >
      <Flex gap="$gap8">
        <MenuLink onPress={handleOnMenuPress(openPrivacyChoices)}>
          <PrivacyOptions /> {t('common.privacyChoices')}
        </MenuLink>
        <MenuLink onPress={handleOnMenuPress(togglePrivacyPolicy)}>{t('common.privacyPolicy')}</MenuLink>
        <MenuLink href={UniswapStaticUrls.termsOfServiceUrl} target="_blank">
          {t('common.termsOfService')}
        </MenuLink>
        <MenuLink onPress={handleOnMenuPress(toggleDisclosures)}>{t('common.disclosures')}</MenuLink>
      </Flex>
    </Expand>
  )
}
