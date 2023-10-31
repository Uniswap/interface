import { useDappContext } from 'src/background/features/dapp/hooks'
import { saveDappConnection } from 'src/background/features/dapp/slice'
import { Anchor, Button, Flex, FlexProps, Icons, Popover, Text, TouchableArea } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch } from 'wallet/src/state'

export function ConnectPopup({
  onClose,
  top,
  right,
}: { onClose?: () => void } & Pick<FlexProps, 'top' | 'right'>): JSX.Element {
  return (
    <Flex
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth={1}
      padding="$spacing8"
      position="absolute"
      right={right}
      shadowColor="$surface5"
      shadowOffset={{ width: 0, height: 4 }}
      shadowRadius={10}
      top={top}
      zIndex="$popover">
      <ConnectPopupContent onClose={onClose} />
    </Flex>
  )
}

export function ConnectPopupContent({
  onClose,
  asPopover = false,
}: {
  onClose?: () => void
  asPopover?: boolean
}): JSX.Element {
  const dispatch = useAppDispatch()

  const { dappName, dappUrl } = useDappContext()
  const activeAddress = useActiveAccountAddressWithThrow()

  const onConnect = async (): Promise<void> => {
    await dispatch(saveDappConnection({ dappUrl, walletAddress: activeAddress }))
    onClose?.()
  }

  return (
    <Flex p="$spacing8">
      <Flex row>
        <Flex grow gap="$none">
          <Text variant="subheading2">{dappName}</Text>
          <Anchor
            color="$accent1"
            fontSize={fonts.buttonLabel4.fontSize}
            href={dappUrl}
            textDecorationLine="none">
            {dappUrl}
          </Anchor>
        </Flex>
        {asPopover ? (
          <Popover.Close cursor="pointer">
            <Icons.X color="$neutral3" size="$icon.20" />
          </Popover.Close>
        ) : (
          <TouchableArea onPress={onClose}>
            <Icons.X color="$neutral3" size="$icon.20" />
          </TouchableArea>
        )}
      </Flex>
      <Text color="$neutral2" pb="$spacing8" pt="$spacing16" variant="body2">
        Your wallet isn't connected to this site.
      </Text>
      {asPopover ? (
        <Popover.Close onPress={onConnect}>
          <Button size="small" theme="tertiary">
            Connect
          </Button>
        </Popover.Close>
      ) : (
        <Button size="small" theme="tertiary" onPress={onConnect}>
          Connect
        </Button>
      )}
    </Flex>
  )
}
