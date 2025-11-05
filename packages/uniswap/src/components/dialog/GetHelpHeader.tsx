import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Flex, FlexProps, ModalCloseIcon, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { EnvelopeHeart } from 'ui/src/components/icons/EnvelopeHeart'
import { Text } from 'ui/src/components/text/Text'
import { uniswapUrls } from 'uniswap/src/constants/urls'

function GetHelpButton({ url }: { url?: string }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Link to={url ?? uniswapUrls.helpUrl} style={{ textDecoration: 'none' }} target="_blank">
      <Flex
        row
        width="max-content"
        borderRadius="$rounded12"
        px="$spacing8"
        py="$spacing6"
        gap="$spacing4"
        alignItems="center"
        borderWidth="$spacing1"
        borderColor="$surface3"
        animation="fast"
        hoverStyle={{
          backgroundColor: '$surface3Hovered',
        }}
        $platform-web={{
          width: 'fit-content',
        }}
      >
        <EnvelopeHeart color="$neutral1" size="$icon.16" />
        <Text variant="buttonLabel4" color="$neutral1">
          {t('common.getHelp.button')}
        </Text>
      </Flex>
    </Link>
  )
}

type GetHelpHeaderProps = {
  closeModal: () => void
  link?: string
  title?: ReactNode
  goBack?: () => void
  closeDataTestId?: string
  className?: string
} & FlexProps

export function GetHelpHeader({
  title,
  goBack,
  link,
  closeModal,
  closeDataTestId,
  className,
  ...props
}: GetHelpHeaderProps): JSX.Element {
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
          <BackArrow size="$icon.24" color="$neutral2" hoverColor="$neutral2Hovered" />
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
