import { PropsWithChildren, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'theme/components/Links'
import { Flex, FlexProps, Image, ModalCloseIcon, Text, TouchableArea } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { iconSizes } from 'ui/src/theme'

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
      <Flex pt="$padding16">
        <Flex row mt="$spacing6" mb="$spacing6" px="$spacing20" width="100%">
          {goBack && (
            <TouchableArea onPress={goBack}>
              <BackArrow size="$icon.20" color="$neutral2" hoverColor="$neutral2Hovered" />
            </TouchableArea>
          )}
          {onClose && (
            <Flex marginLeft="auto">
              <ModalCloseIcon size="$icon.20" onClose={onClose} data-testid="get-the-app-close-button" />
            </Flex>
          )}
        </Flex>
        <Flex alignItems="center" gap="$spacing32" maxWidth="480px" {...rest}>
          <Flex alignItems="center" gap="$spacing12">
            {header ?? <Image height={iconSizes.icon64} source={UNISWAP_LOGO} width={iconSizes.icon64} />}
            <Flex alignItems="center" gap="$spacing12" px="$spacing40">
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
                  <Text variant="buttonLabel1">{t('common.button.learn')}</Text>
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
