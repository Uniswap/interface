import { useMemo } from 'react'
import { CopyHelper } from 'theme/components/CopyHelper'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { MAINNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { SOLANA_CHAIN_INFO } from 'uniswap/src/features/chains/svm/info/solana'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useENSName } from 'uniswap/src/features/ens/api'
import { Wallet } from 'uniswap/src/features/wallet/types/Wallet'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ellipseMiddle, shortenAddress } from 'utilities/src/addresses'

function AddressDisplay({
  unitag,
  ensName,
  shortenedEvmAddress,
  shortenedSvmAddress,
}: {
  unitag?: string
  ensName?: string
  shortenedEvmAddress?: string
  shortenedSvmAddress?: string
}) {
  return (
    <Flex row gap="$spacing2" alignItems="center" data-testid={TestID.AddressDisplay}>
      <Text
        variant="subheading1"
        color="$neutral1"
        maxWidth="120px"
        $xxl={{ maxWidth: '180px' }}
        {...EllipsisTamaguiStyle}
      >
        {unitag ?? ensName ?? (shortenedEvmAddress || shortenedSvmAddress)}
      </Text>
      {unitag && <Unitag size={18} />}
    </Flex>
  )
}

type AddressItem = {
  image: JSX.Element | null
  address: string
  fullAddress: string
  label: string
}

function TooltipAddressRow({ address }: { address: AddressItem }) {
  return (
    <Flex row alignItems="center" justifyContent="space-between" gap="$spacing20">
      <Flex row gap="$spacing8" alignItems="flex-start">
        {address.image}
        <Text variant="body3">{address.label}</Text>
      </Flex>
      <CopyHelper alwaysShowIcon iconSize={iconSizes.icon12} iconPosition="right" toCopy={address.fullAddress}>
        <Text variant="body4">{address.address}</Text>
      </CopyHelper>
    </Flex>
  )
}

export function MultiBlockchainAddressDisplay({
  wallet,
  enableCopyAddress,
}: {
  wallet: Wallet
  enableCopyAddress?: boolean
}) {
  const evmAddress = wallet.evmAccount?.address
  const { data: ENSName } = useENSName(evmAddress)
  const { data: unitagData } = useUnitagsAddressQuery({
    params: evmAddress ? { address: evmAddress } : undefined,
  })
  const unitag = unitagData?.username
  const shortenedEvmAddress = shortenAddress(evmAddress)

  const svmAddress = wallet.svmAccount?.address
  // TODO(WEB-8155): update shortenAddress to also take Solana addresses
  const shortenedSvmAddress = ellipseMiddle({ str: svmAddress ?? '', charsStart: 6, charsEnd: 6 })

  const primaryAddress = evmAddress ?? svmAddress
  if (!primaryAddress) {
    throw new Error('No addresses to display')
  }

  const addresses: AddressItem[] = useMemo(() => {
    const addressList: AddressItem[] = []
    if (evmAddress) {
      addressList.push({
        image: <NetworkLogo chainId={null} size={20} />,
        address: shortenedEvmAddress,
        fullAddress: evmAddress,
        label: MAINNET_CHAIN_INFO.name,
      })
    }
    if (svmAddress) {
      addressList.push({
        image: <NetworkLogo chainId={UniverseChainId.Solana} size={20} />,
        address: shortenedSvmAddress,
        fullAddress: svmAddress,
        label: SOLANA_CHAIN_INFO.name,
      })
    }
    return addressList
  }, [evmAddress, svmAddress, shortenedEvmAddress, shortenedSvmAddress])

  return (
    <InfoTooltip
      enabled={addresses.length > 1}
      maxWidth={400}
      text={
        <Flex flexDirection="column" gap="$spacing12">
          {addresses.map((address, i) => (
            <TooltipAddressRow key={i} address={address} />
          ))}
        </Flex>
      }
      trigger={
        enableCopyAddress ? (
          <CopyHelper iconSize={iconSizes.icon12} iconPosition="right" toCopy={primaryAddress}>
            <AddressDisplay
              unitag={unitag}
              ensName={ENSName ?? undefined}
              shortenedEvmAddress={shortenedEvmAddress}
              shortenedSvmAddress={shortenedSvmAddress}
            />
          </CopyHelper>
        ) : (
          <AddressDisplay
            unitag={unitag}
            ensName={ENSName ?? undefined}
            shortenedEvmAddress={shortenedEvmAddress}
            shortenedSvmAddress={shortenedSvmAddress}
          />
        )
      }
    />
  )
}
