import { useDappContext } from 'src/background/features/dapp/hooks'
import { selectChainByDappAndWallet } from 'src/background/features/dapp/selectors'
import { disconnectAction, saveChainAction } from 'src/background/features/dappRequests/saga'
import { useAppDispatch, useAppSelector } from 'src/background/store'
import { Circle, getToken, Icons, Image, Popover, Text, XStack, YStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function SwitchNetworksModal(): JSX.Element {
  const dispatch = useAppDispatch()
  const { dappUrl, dappName } = useDappContext()
  const activeWalletAddress = useActiveAccountAddressWithThrow()
  const activeChain = useAppSelector(selectChainByDappAndWallet(activeWalletAddress, dappUrl))

  const onNetworkClicked = (chainId: ChainId): void => {
    dispatch(saveChainAction({ chainId }))
  }

  const onDisconnect = (): void => {
    dispatch(disconnectAction())
  }

  return (
    <YStack
      alignContent="center"
      // TODO:  update background color to blurry scrim when available
      backgroundColor="$background0"
      borderRadius="$rounded12"
      gap="$spacing8"
      minWidth={220}>
      <YStack
        borderBottomColor="$backgroundOutline"
        borderBottomWidth={1}
        gap="$spacing4"
        padding="$spacing8">
        {dappName ? <Text variant="subheadLarge">{dappName}</Text> : null}
        {dappUrl ? (
          <Text color="$blue400" variant="bodyMicro">
            {dappUrl}
          </Text>
        ) : null}
      </YStack>

      {ALL_SUPPORTED_CHAIN_IDS.map((chain: ChainId) => {
        return (
          <Button
            key={chain}
            flex={1}
            justifyContent="space-between"
            onPress={(): void => onNetworkClicked(chain)}>
            <XStack alignItems="center" flexGrow={1} justifyContent="flex-start">
              <XStack alignItems="center" gap="$spacing12" paddingRight="$spacing8">
                <Image
                  borderRadius="$roundedFull"
                  height={iconSizes.icon28}
                  source={CHAIN_INFO[chain].logo}
                  width={iconSizes.icon28}
                />
                <Text color="$textPrimary" variant="subheadSmall">
                  {CHAIN_INFO[chain]?.label}
                </Text>
              </XStack>
              {activeChain === chain ? (
                <XStack flexGrow={1}>
                  <Circle
                    backgroundColor="$accentActive"
                    height={iconSizes.icon8}
                    marginRight="$spacing8"
                    width={iconSizes.icon8}
                  />
                </XStack>
              ) : null}
            </XStack>
          </Button>
        )
      })}

      <Popover.Close asChild>
        <Button borderRadius="$rounded32" theme="secondary" onPress={onDisconnect}>
          <XStack alignItems="center" gap="$spacing8" justifyContent="center">
            <Icons.Power color="$textPrimary" size={getToken('$icon.16')} />
            {/* TODO(EXT-207 / EXT-208): fix button component styling and derive text color from theme */}{' '}
            <Text color="$textPrimary" variant="subheadSmall">
              Disconnect
            </Text>
          </XStack>
        </Button>
      </Popover.Close>
    </YStack>
  )
}
