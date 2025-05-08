import { PropsWithChildren, ReactNode } from 'react'
import { Flex, FlexProps, Image, ModalCloseIcon, Text, TouchableArea } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { iconSizes } from 'ui/src/theme'

export function ModalContent({
  title,
  subtext,
  children,
  logo,
  header,
  footer,
  goBack,
  onClose,
  ...rest
}: PropsWithChildren<{
  title: string
  subtext?: string
  logo?: ReactNode
  header?: ReactNode
  footer?: ReactNode
  goBack?: () => void
  onClose?: () => void
}> &
  FlexProps) {
  return (
    <>
      <Flex pt="$padding16">
        <Flex row mt="spacing16" px="$spacing20" width="100%">
          {goBack && (
            <TouchableArea onPress={goBack}>
              <BackArrow size={iconSizes.icon24} color="$neutral2" hoverColor="$neutral2Hovered" />
            </TouchableArea>
          )}
          {onClose && (
            <Flex marginLeft="auto">
              <ModalCloseIcon onClose={onClose} data-testid="get-the-app-close-button" />
            </Flex>
          )}
        </Flex>
        <Flex alignItems="center" gap="$spacing32" {...rest}>
          <Flex alignItems="center" gap="$spacing12">
            {header ?? <Image height={iconSizes.icon64} source={UNISWAP_LOGO} width={iconSizes.icon64} />}
            <Flex alignItems="center" gap="$spacing8" px="$spacing40">
              <Text variant="heading3" color="$neutral1">
                {title}
              </Text>
              <Text variant="body2" color="$neutral2" textAlign="center">
                {subtext}
              </Text>
            </Flex>
          </Flex>
          {children}
        </Flex>
      </Flex>
      {footer}
    </>
  )
}
