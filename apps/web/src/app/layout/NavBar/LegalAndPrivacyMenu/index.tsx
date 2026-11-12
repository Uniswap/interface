import { isMobileWeb } from '@universe/environment'
import { Anchor, AnchorProps, Flex, Text } from '@universe/mycelium'
import { spacing } from '@universe/mycelium/tokens'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { Expand } from '~/components/Expand'
import { PrivacyOptions } from '~/components/Icons/PrivacyOptions'
import { MobileTouchableArea } from '~/components/MobileTouchableArea'
import { useModalState } from '~/hooks/useModalState'

// A plain inline link for the `singleRowLinks` layout — rendered as text-flow content inside a
// single `Text`, so the browser wraps whole links via normal inline layout instead of flexbox
// (nesting `MenuLink`'s flex-row `MobileTouchableArea` inside a flex-wrap row collapses each
// Anchor to zero width; inline layout doesn't have that failure mode).
// Anchor doesn't support the `variant` prop (that's a Text-only styled variant), so the body4 font
// tokens are set explicitly here to match the `•` separators, which inherit body4 from the
// wrapping `Text` in the `singleRowLinks` layout below.
const InlineMenuLink = ({ children, ...rest }: AnchorProps) => (
  <Anchor
    fontFamily="$body"
    fontSize="$micro"
    lineHeight="$micro"
    fontWeight="$book"
    textDecorationLine="none"
    cursor="pointer"
    color="$neutral2"
    hoverStyle={{ color: '$accent1' }}
    {...rest}
  >
    {children}
  </Anchor>
)

const MenuLink = ({ children, ...rest }: AnchorProps) => (
  <Anchor textDecorationLine="none" cursor="pointer" group {...rest}>
    {/* `justifyContent: center` only centers vertically on mobile, where MobileTouchableArea is a
        column-direction TouchableArea (used with minHeight to keep short labels vertically centered
        in the larger tap target). On desktop, MobileTouchableArea is a row Flex, so the same value
        would center the label horizontally instead of left-aligning it — force flex-start there. */}
    <MobileTouchableArea
      justifyContent={isMobileWeb ? 'center' : 'flex-start'}
      minHeight={isMobileWeb ? 28 : undefined}
    >
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

export function LegalAndPrivacyMenu({
  closeMenu,
  singleRowLinks,
}: {
  closeMenu?: () => void
  // Collapses Privacy Policy / Terms of Service / Disclosures onto one wrapping row instead of
  // one per line. Only pass this where the dropdown has enough width for it (desktop menu).
  singleRowLinks?: boolean
}) {
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
        <Text color="$neutral2" variant="body4" py={isMobileWeb ? '$spacing6' : undefined} pr={spacing.spacing4}>
          {t('common.legalAndPrivacy')}
        </Text>
      }
      paddingTop={8}
      width="100%"
    >
      <Flex gap="$gap8">
        <MenuLink onPress={handleOnMenuPress(openPrivacyChoices)}>
          <PrivacyOptions /> {t('common.privacyChoices')}
        </MenuLink>
        {singleRowLinks ? (
          <Text variant="body4" color="$neutral2">
            <InlineMenuLink onPress={handleOnMenuPress(togglePrivacyPolicy)}>
              {t('common.privacyPolicy')}
            </InlineMenuLink>
            {' • '}
            <InlineMenuLink href={UniswapStaticUrls.termsOfServiceUrl} target="_blank" rel="noopener noreferrer">
              {t('common.termsOfService')}
            </InlineMenuLink>
            {' • '}
            <InlineMenuLink onPress={handleOnMenuPress(toggleDisclosures)}>{t('common.disclosures')}</InlineMenuLink>
          </Text>
        ) : (
          <>
            <MenuLink onPress={handleOnMenuPress(togglePrivacyPolicy)}>{t('common.privacyPolicy')}</MenuLink>
            <MenuLink href={UniswapStaticUrls.termsOfServiceUrl} target="_blank" rel="noopener noreferrer">
              {t('common.termsOfService')}
            </MenuLink>
            <MenuLink onPress={handleOnMenuPress(toggleDisclosures)}>{t('common.disclosures')}</MenuLink>
          </>
        )}
      </Flex>
    </Expand>
  )
}
