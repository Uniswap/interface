import { PropsWithChildren, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, Image, ModalCloseIcon, Text, TouchableArea } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { iconSizes } from 'ui/src/theme'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ExternalLink } from '~/theme/components/Links'

export function ModalContent({
  title,
  subtext,
  children,
  header,
  footer,
  learnMoreLink,
  goBack,
  onClose,
  ...rest
}: PropsWithChildren<{
  title: string
  subtext?: string | ReactNode
  header?: ReactNode
  footer?: ReactNode
  learnMoreLink?: string
  goBack?: () => void
  onClose?: () => void
}> &
  FlexProps) {
  const { t } = useTranslation()

  return (
    <>
      <Flex>
        <Flex row width="100%">
          {goBack && (
            <TouchableArea testID={TestID.Back} onPress={goBack}>
              <BackArrow size="$icon.20" color="$neutral2" hoverColor="$neutral2Hovered" />
            </TouchableArea>
          )}
          {onClose && (
            <Flex marginLeft="auto">
              <ModalCloseIcon size="$icon.20" onClose={onClose} data-testid="get-the-app-close-button" />
            </Flex>
          )}
        </Flex>
        <Flex alignSelf="center" alignItems="center" gap="$spacing16" width="100%" {...rest}>
          <Flex alignItems="center" gap="$spacing24">
            {header ?? <Image height={iconSizes.icon64} source={UNISWAP_LOGO} width={iconSizes.icon64} />}
            <Flex alignItems="center" gap="$spacing12">
              <Text variant="heading3" color="$neutral1">
                {title}
              </Text>
              {typeof subtext === 'string' ? (
                <Text variant="body2" color="$neutral2" textAlign="center">
                  {subtext}
                </Text>
              ) : (
                subtext
              )}
              {learnMoreLink && (
                <ExternalLink href={learnMoreLink}>
                  <Text variant="body2">{t('common.button.learn')}</Text>
                </ExternalLink>
              )}
            </Flex>
          </Flex>
          {children}
        </Flex>
      </Flex>
      {footer}
    </>
  )
}
