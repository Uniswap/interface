import { iconSizes, TextVariantTokens } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useENSName } from 'uniswap/src/features/ens/api'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { LinkButton } from 'wallet/src/components/buttons/LinkButton'

type AddressButtonProps = {
  address: string
  chainId: number
  textVariant?: TextVariantTokens
}

export function AddressButton({ address, chainId, ...rest }: AddressButtonProps): JSX.Element {
  const { data: name } = useENSName(address)
  const { defaultChainId } = useEnabledChains()
  const supportedChainId = toSupportedChainId(chainId) ?? defaultChainId

  return (
    <LinkButton
      iconColor="$neutral3"
      label={name || shortenAddress({ address })}
      size={iconSizes.icon16}
      textVariant="body3"
      url={getExplorerLink({ chainId: supportedChainId, data: address, type: ExplorerDataType.ADDRESS })}
      {...rest}
    />
  )
}
