import { EnvelopeHeartIcon } from 'components/Icons/EnvelopeHeart'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Flex, ModalCloseIcon, TouchableArea, useSporeColors } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'

function GetHelpButton({ url }: { url?: string }) {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <Link to={url ?? uniswapUrls.helpUrl} style={{ textDecoration: 'none' }} target="_blank">
      <Flex
        row
        width="fit-content"
        borderRadius="$rounded16"
        px="$spacing8"
        py="$spacing4"
        backgroundColor="$surface2"
        gap="4px"
        alignItems="center"
        hoverStyle={{ backgroundColor: '$surface2Hovered' }}
      >
        <EnvelopeHeartIcon fill={colors.neutral2.val} />
        <Text variant="body2" color="$neutral2">
          {t('common.getHelp.button')}
        </Text>
      </Flex>
    </Link>
  )
}

interface GetHelpHeaderProps {
  closeModal: () => void
  link?: string
  title?: ReactNode
  goBack?: () => void
  closeDataTestId?: string
  className?: string
}

export function GetHelpHeader({ title, goBack, link, closeModal, closeDataTestId, className }: GetHelpHeaderProps) {
  return (
    <Flex row justifyContent="space-between" alignItems="center" gap="$spacing4" width="100%" className={className}>
      {goBack && (
        <TouchableArea onPress={goBack}>
          <BackArrow size={iconSizes.icon24} color="$neutral2" hoverColor="$neutral2Hovered" />
        </TouchableArea>
      )}
      {title && (
        <Flex>
          <Text variant="body2">{title}</Text>
        </Flex>
      )}
      <Flex row fill justifyContent="flex-end" alignItems="center" gap="10px">
        <GetHelpButton url={link} />
        <ModalCloseIcon testId={closeDataTestId} onClose={closeModal} />
      </Flex>
    </Flex>
  )
}
