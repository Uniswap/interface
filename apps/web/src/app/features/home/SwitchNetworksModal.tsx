import { useDappContext } from 'src/background/features/dapp/hooks'
import { selectChainByDappAndWallet } from 'src/background/features/dapp/selectors'
import { disconnectAction, saveChainAction } from 'src/background/features/dappRequests/saga'
import { useAppDispatch, useAppSelector } from 'src/background/store'
import { Button, Circle, Flex, getTokenValue, Icons, Image, Popover, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function SwitchNetworksModal(): JSX.Element {
  const dispatch = useAppDispatch()
  const { dappUrl, dappName } = useDappContext()
  const activeWalletAddress = useActiveAccountAddressWithThrow()
  const activeChain = useAppSelector(selectChainByDappAndWallet(activeWalletAddress, dappUrl))

  const onNetworkClicked = async (chainId: ChainId): Promise<void> => {
    await dispatch(saveChainAction({ chainId }))
  }

  const onDisconnect = async (): Promise<void> => {
    await dispatch(disconnectAction())
  }

  return (
    <Flex
      alignContent="center"
      // TODO:  update background color to blurry scrim when available
      bg="$surface1"
      borderRadius="$rounded12"
      width={235}>
      <Flex
        borderBottomColor="$surface3"
        borderBottomWidth={1}
        gap="$spacing4"
        mb="$spacing8"
        p="$spacing8">
        {dappName ? <Text variant="subheading1">{dappName}</Text> : null}
        {dappUrl ? (
          <Text color="$blue400" variant="body3">
            {dappUrl}
          </Text>
        ) : null}
      </Flex>

      {ALL_SUPPORTED_CHAIN_IDS.map((chain: ChainId) => {
        return (
          <Button
            key={chain}
            justifyContent="space-between"
            theme={null}
            onPress={async (): Promise<void> => onNetworkClicked(chain)}>
            <Flex grow row alignItems="center" justifyContent="flex-start">
              <Flex grow row alignItems="center" gap="$spacing8" pr="$spacing8">
                <NetworkLogo chainId={chain} size={iconSizes.icon20} />
                <Image
                  borderRadius="$roundedFull"
                  height={iconSizes.icon28}
                  source={CHAIN_INFO[chain].logo ?? { uri: '' }}
                  width={iconSizes.icon28}
                />
                <Text color="$neutral1" variant="subheading2">
                  {CHAIN_INFO[chain]?.label}
                </Text>
              </Flex>
              {activeChain === chain ? (
                <Flex row>
                  <Circle
                    backgroundColor="$statusSuccess"
                    height={iconSizes.icon8}
                    marginRight="$spacing8"
                    width={iconSizes.icon8}
                  />
                </Flex>
              ) : null}
            </Flex>
          </Button>
        )
      })}

      <Popover.Close asChild>
        <Button borderRadius="$rounded32" mt="$spacing8" theme="tertiary" onPress={onDisconnect}>
          <Flex centered row gap="$spacing8">
            <Icons.Power color="$neutral1" size={getTokenValue('$icon.16')} />
            {/* TODO(EXT-207 / EXT-208): fix button component styling and derive text color from theme */}{' '}
            <Text color="$neutral1" variant="subheading2">
              Disconnect
            </Text>
          </Flex>
        </Button>
      </Popover.Close>
    </Flex>
  )
}
