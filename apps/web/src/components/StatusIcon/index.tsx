import { Flex, FlexProps } from 'ui/src/components/layout'
import { CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import sockImg from '~/assets/svg/socks.svg'
import { CONNECTOR_ICON_OVERRIDE_MAP } from '~/connection/constants'
import { useActiveAddresses, useActiveWallet } from '~/features/accounts/store/hooks'
import { useHasSocks } from '~/hooks/useSocksBalance'
import { deprecatedStyled } from '~/lib/deprecated-styled'

const MINI_ICON_SIZE = 16

const MiniIconContainer = deprecatedStyled.div<{ $side: 'left' | 'right'; size?: number; isIndicator?: boolean }>`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${({ size }) => size ?? MINI_ICON_SIZE + 'px'};
  height: ${({ size }) => size ?? MINI_ICON_SIZE + 'px'};
  bottom: ${({ size, isIndicator }) => `-${isIndicator ? 0 : (size ?? MINI_ICON_SIZE) / 4}px`};
  ${({ $side, size, isIndicator }) => `${$side === 'left' ? 'left' : 'right'}: -${isIndicator ? 0 : (size ?? MINI_ICON_SIZE) / 4}px`};
  border-radius: 50%;
  outline: 2px solid ${({ theme }) => theme.surface1};
  outline-offset: -0.1px;
  background-color: ${({ theme }) => theme.surface1};
  overflow: hidden;
  @supports (overflow: clip) {
    overflow: clip;
  }
`

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
  transition?: FlexProps['transition']
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
      <AccountIcon address={addressToDisplay} size={size} transition={transition} centered />
      {showConnectedIndicator ? <MiniConnectedIndicator /> : showMiniIcons && <MiniWalletIcon platform={platform} />}
      {hasSocks && showMiniIcons && <Socks />}
    </Flex>
  )
}
