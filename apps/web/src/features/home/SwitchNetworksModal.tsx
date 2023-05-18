import { useAppDispatch, useAppSelector } from 'src/background/store'
import { useDappInfo } from 'src/features/dapp/hooks'
import { selectChainByDappAndWallet } from 'src/features/dapp/selectors'
import { saveChainAction } from 'src/features/dappRequests/saga'
import { Circle, Image, Text, XStack, YStack } from 'ui/src'
import PowerIcon from 'ui/src/assets/icons/power.svg'
import { Button } from 'ui/src/components/button/Button'
import { iconSize } from 'ui/src/theme/tokens'
import {
  ALL_SUPPORTED_CHAIN_IDS,
  ChainId,
  CHAIN_ID_TO_LOGO,
  CHAIN_INFO,
} from 'wallet/src/constants/chains'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function SwitchNetworksModal(): JSX.Element {
  const dispatch = useAppDispatch()
  const { dappUrl, dappName } = useDappInfo()
  const activeWalletAddress = useActiveAccountAddressWithThrow()
  const activeChain = useAppSelector(selectChainByDappAndWallet(activeWalletAddress, dappUrl))

  const onNetworkClicked = (chainId: ChainId): void => {
    dispatch(saveChainAction({ chainId }))
  }

  const onDisconnect = (): void => {
    // TODO: Disconnect from wallet
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
            <XStack flexGrow={1} justifyContent="flex-start">
              <XStack alignItems="center" flex={1} gap="$spacing12" paddingRight="$spacing8">
                <Image
                  height={iconSize.icon28}
                  source={CHAIN_ID_TO_LOGO[chain]}
                  width={iconSize.icon28}
                />
                <Text color="$white" variant="subheadLarge">
                  {CHAIN_INFO[chain]?.label}
                </Text>
              </XStack>
              {activeChain === chain ? (
                <XStack flexGrow={1}>
                  <Circle
                    backgroundColor="$background3"
                    height={iconSize.icon8}
                    marginRight="$spacing8"
                    width={iconSize.icon8}
                  />
                </XStack>
              ) : null}
            </XStack>
          </Button>
        )
      })}

      <Button borderRadius="$rounded32" theme="secondary" onPress={onDisconnect}>
        <XStack alignItems="center" gap="$spacing8">
          <PowerIcon height={iconSize.icon16} width={iconSize.icon16} />
          Disconnect
        </XStack>
      </Button>
    </YStack>
  )
}
