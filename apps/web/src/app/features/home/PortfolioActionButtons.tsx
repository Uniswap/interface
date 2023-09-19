import { useToastController } from '@tamagui/toast'
import { cloneElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppRoutes } from 'src/app/navigation/constants'
import { Flex, getTokenValue, Icons, Text, YStack } from 'ui/src'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const enabledHoverStyle = { cursor: 'pointer' }

const ICON_COLOR = '$accent1'
const ICON_SIZE = getTokenValue('$icon.24')

type ActionButtonCommonProps = {
  label: string
  Icon: JSX.Element
}

// accepts an `onClick` prop or a `url` prop, but not both or neither
type ActionButtonProps =
  | (ActionButtonCommonProps & {
      onClick: () => void
      url?: never
    })
  | (ActionButtonCommonProps & {
      url: string
      onClick?: never
    })

function ActionButton({ label, Icon, onClick, url }: ActionButtonProps): JSX.Element {
  const actionHandler = url
    ? // if it has a url prop, open it in a new tab
      (): void => {
        // false positive because of .open
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        window.open(url, '_blank')
      }
    : // otherwise call the onClick function
      onClick

  return (
    // TODO(EXT-248): Change to TouchableArea
    // https://linear.app/uniswap/issue/EXT-248/need-web-equivalent-of-touchablearea
    <YStack
      alignItems="flex-start"
      backgroundColor="$accentSoft"
      borderRadius="$rounded16"
      flex={1}
      flexBasis={1}
      gap="$spacing12"
      hoverStyle={enabledHoverStyle}
      justifyContent="space-between"
      padding="$spacing12"
      onPress={actionHandler}>
      {cloneElement(Icon, { color: ICON_COLOR, size: ICON_SIZE })}
      <Text color="$accent1" fontWeight="600" variant="bodyLarge">
        {label}
      </Text>
    </YStack>
  )
}

export function PortfolioActionButtons(): JSX.Element {
  const navigate = useNavigate()
  const address = useActiveAccountAddressWithThrow()
  const { show: showToast } = useToastController()

  const onSendClick = (): void => {
    navigate(AppRoutes.Transfer)
  }

  const onCopyClick = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(address)
      showToast('Copied address to clipboard', {
        native: false,
        duration: 3000,
        viewportName: 'popup',
      })
    } catch (e) {
      showToast('Failed to copy address to clipboard', {
        native: false,
        duration: 3000,
        viewportName: 'popup',
      })
    }
  }

  return (
    <YStack gap="$spacing8">
      <Flex flexDirection="row" gap="$spacing8">
        <ActionButton Icon={<Icons.CoinConvert />} label="Swap" url="https://app.uniswap.org" />
        <ActionButton
          Icon={<Icons.Buy />}
          label="Buy"
          url={uniswapUrls.helpArticleUrls.moonpayHelp}
        />
      </Flex>
      <Flex flexDirection="row" gap="$spacing8">
        <ActionButton Icon={<Icons.SendRoundedAirplane />} label="Send" onClick={onSendClick} />
        <ActionButton Icon={<Icons.ReceiveArrow />} label="Receive" onClick={onCopyClick} />
      </Flex>
    </YStack>
  )
}
