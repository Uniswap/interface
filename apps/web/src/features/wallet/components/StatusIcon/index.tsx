import { Platform } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import type { ComponentPropsWithoutRef } from 'react'
import { CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import sockImg from '~/assets/svg/socks.svg'
import { useActiveAddresses, useActiveWallet } from '~/connection/accounts/hooks'
import { CONNECTOR_ICON_OVERRIDE_MAP } from '~/connection/constants'
import { useHasSocks } from '~/features/wallet/components/StatusIcon/useSocksBalance'

const MINI_ICON_SIZE = 16

const MiniIconFrame = styled('div', {
  platform: 'web',
  base: 'absolute flex justify-center items-center rounded-[50%] outline-2 outline-surface1 [outline-offset:-0.1px] bg-surface1 overflow-hidden supports-[overflow:clip]:overflow-clip',
})

function MiniIconContainer({
  $side,
  size,
  isIndicator,
  style,
  ...rest
}: { $side: 'left' | 'right'; size?: number; isIndicator?: boolean } & ComponentPropsWithoutRef<
  typeof MiniIconFrame
>): JSX.Element {
  const offset = isIndicator ? 0 : (size ?? MINI_ICON_SIZE) / 4
  return (
    <MiniIconFrame
      style={{
        width: size ?? MINI_ICON_SIZE,
        height: size ?? MINI_ICON_SIZE,
        bottom: -offset,
        [$side === 'left' ? 'left' : 'right']: -offset,
        ...style,
      }}
      {...rest}
    />
  )
}

function Socks() {
  return (
    <MiniIconContainer $side="left">
      <img width={MINI_ICON_SIZE} height={MINI_ICON_SIZE} src={sockImg} />
    </MiniIconContainer>
  )
}

function MiniWalletIcon({ platform }: { platform: Platform }) {
  const wallet = useActiveWallet(platform)
  if (!wallet) {
    return null
  }

  if (wallet.name === CONNECTION_PROVIDER_NAMES.EMBEDDED_WALLET) {
    return null
  }

  // TODO(APPS-8471): this should use useConnectedWallet() which returns connected WalletConnectorMeta, which is post-icon-override-map transformation
  const icon = CONNECTOR_ICON_OVERRIDE_MAP[wallet.name] ?? wallet.icon

  return (
    <MiniIconContainer $side="right" data-testid="MiniIcon">
      <img width={MINI_ICON_SIZE} height={MINI_ICON_SIZE} src={icon} alt={`${wallet.name} icon`} />
    </MiniIconContainer>
  )
}

function MiniConnectedIndicator() {
  return (
    <MiniIconContainer isIndicator $side="right" size={10}>
      <Flex backgroundColor="$statusSuccess" borderRadius="$roundedFull" height={10} width={10} />
    </MiniIconContainer>
  )
}

export function StatusIcon({
  size = 16,
  showMiniIcons = true,
  showConnectedIndicator,
  address,
  transition,
}: {
  size?: number
  showMiniIcons?: boolean
  showConnectedIndicator?: boolean
  address?: string
  // Bare string until mycelium ships a typed transition prop.
  transition?: string
}) {
  const activeAddresses = useActiveAddresses()
  const hasSocks = useHasSocks()

  const addressToDisplay = address ?? activeAddresses.evmAddress ?? activeAddresses.svmAddress
  const platform = isEVMAddress(addressToDisplay) ? Platform.EVM : Platform.SVM

  return (
    <Flex
      centered
      height={size}
      width={size}
      ml="$spacing4"
      mr="$spacing4"
      $xl={{ mr: '$none' }}
      data-testid="StatusIconRoot"
    >
      <AccountIcon
        address={addressToDisplay}
        size={size}
        transition={transition}
        centered
        // Hairline ring so the avatar's edge stays legible when its unicon color is low-contrast against
        // surface1. Outline rather than border: a border shrinks the content box that the fixed-`size`
        // avatar then overflows, so the avatar would paint over the ring.
        outlineWidth="$spacing1"
        outlineStyle="solid"
        outlineColor="$surface3"
        outlineOffset={-1}
      />
      {showConnectedIndicator ? <MiniConnectedIndicator /> : showMiniIcons && <MiniWalletIcon platform={platform} />}
      {hasSocks && showMiniIcons && <Socks />}
    </Flex>
  )
}
