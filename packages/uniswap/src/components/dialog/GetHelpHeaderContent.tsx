import { Flex, ModalCloseIcon, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { Text } from 'ui/src/components/text/Text'
import type { GetHelpHeaderProps } from 'uniswap/src/components/dialog/GetHelpHeader'

export type GetHelpButtonProps = {
  url?: string
}

/**
 * Shared header UI structure used by both web and native implementations.
 * Accepts a platform-specific GetHelpButton component as a child.
 */
export function GetHelpHeaderContent({
  title,
  goBack,
  link,
  closeModal,
  closeDataTestId,
  className,
  GetHelpButton,
  backArrowHoverColor,
  ...props
}: GetHelpHeaderProps & {
  GetHelpButton: React.ComponentType<GetHelpButtonProps>
  backArrowHoverColor?: string
}): JSX.Element {
  return (
    <Flex
      row
      justifyContent="space-between"
      alignItems="center"
      gap="$spacing4"
      width="100%"
      className={className}
      {...props}
    >
      {goBack && (
        <TouchableArea onPress={goBack}>
          <BackArrow size="$icon.24" color="$neutral2" hoverColor={backArrowHoverColor} />
        </TouchableArea>
      )}
      {title && (
        <Flex>
          <Text variant="body2">{title}</Text>
        </Flex>
      )}
      <Flex row fill justifyContent="flex-end" alignItems="center" gap="$spacing12">
        <GetHelpButton url={link} />
        <ModalCloseIcon testId={closeDataTestId} role="none" onClose={closeModal} />
      </Flex>
    </Flex>
  )
}
