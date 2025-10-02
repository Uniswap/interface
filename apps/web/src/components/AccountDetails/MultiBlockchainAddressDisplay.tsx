import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyHelper } from 'theme/components/CopyHelper'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { MAINNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { SOLANA_CHAIN_INFO } from 'uniswap/src/features/chains/svm/info/solana'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useENSName } from 'uniswap/src/features/ens/api'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'

function AddressDisplay({
  unitag,
  ensName,
  shortenedAddress,
}: {
  unitag?: string
  ensName?: string
  shortenedAddress?: string
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
        {unitag ?? ensName ?? shortenedAddress}
      </Text>
      {unitag && <Unitag size={18} />}
    </Flex>
  )
}

function PrimaryAddressDisplay({
  unitag,
  ensName,
  primaryAddress,
  isMultipleAddresses,
}: {
  unitag?: string
  ensName?: string
  primaryAddress: string
  isMultipleAddresses: boolean
}) {
  const { t } = useTranslation()
  const shortenedPrimaryAddress = shortenAddress({ address: primaryAddress })

  if (ensName ?? unitag) {
    return (
      <Flex>
        <AddressDisplay unitag={unitag} ensName={ensName ?? undefined} shortenedAddress={shortenedPrimaryAddress} />
        {isMultipleAddresses ? (
          <Text variant="body3" color="$neutral3">
            {shortenedPrimaryAddress} {t('common.plusMore', { number: 1 })}
          </Text>
        ) : (
          <CopyHelper iconSize={iconSizes.icon12} iconPosition="right" toCopy={primaryAddress}>
            <Text variant="body3" color="$neutral3">
              {shortenedPrimaryAddress}
            </Text>
          </CopyHelper>
        )}
      </Flex>
    )
  }

  return isMultipleAddresses ? (
    <Flex>
      <AddressDisplay shortenedAddress={shortenedPrimaryAddress} />
      <Text variant="body3" color="$neutral3">
        {t('common.plusMore', { number: 1 })}
      </Text>
    </Flex>
  ) : (
    <CopyHelper iconSize={iconSizes.icon12} iconPosition="right" toCopy={primaryAddress}>
      <AddressDisplay shortenedAddress={shortenedPrimaryAddress} />
    </CopyHelper>
  )
}

type AccountItem = {
  platform: Platform
  address: string
  label: string
}

function TooltipAccountRow({ account }: { account: AccountItem }) {
  const { t } = useTranslation()

  const { chains: evmChains } = useEnabledChains({ platform: Platform.EVM })
  const numberOfSupportedEVMChains = evmChains.length

  return (
    <Flex row alignItems="center" justifyContent="space-between" gap="$spacing24">
      <Flex row gap="$spacing8">
        <AccountIcon address={account.address} size={28} />
        <Flex>
          <Flex row gap="$spacing4">
            <Text variant="body4" color="$neutral1">
              {shortenAddress({ address: account.address })}
            </Text>
            <NetworkLogo
              chainId={account.platform === Platform.SVM ? UniverseChainId.Solana : UniverseChainId.Mainnet}
              size={16}
            />
          </Flex>
          <Text variant="body4" color="$neutral2">
            {account.platform === Platform.SVM
              ? SOLANA_CHAIN_INFO.name
              : MAINNET_CHAIN_INFO.name +
                ` +${numberOfSupportedEVMChains - 1} ${t('extension.connection.networks').toLowerCase()}`}
          </Text>
        </Flex>
      </Flex>
      <CopyHelper alwaysShowIcon iconSize={iconSizes.icon16} iconPosition="right" toCopy={account.address}>
        <></>
      </CopyHelper>
    </Flex>
  )
}

export function MultiBlockchainAddressDisplay() {
  const activeAddresses = useActiveAddresses()
  const evmAddress = activeAddresses.evmAddress
  const { data: ensName } = useENSName(evmAddress)
  const { data: unitagData } = useUnitagsAddressQuery({
    params: evmAddress ? { address: evmAddress } : undefined,
  })
  const unitag = unitagData?.username

  const svmAddress = activeAddresses.svmAddress

  const primaryAddress = evmAddress ?? svmAddress

  const accounts: AccountItem[] = useMemo(() => {
    const accountsList: AccountItem[] = []
    if (evmAddress) {
      accountsList.push({
        address: evmAddress,
        label: MAINNET_CHAIN_INFO.name,
        platform: Platform.EVM,
      })
    }
    if (svmAddress) {
      accountsList.push({
        address: svmAddress,
        label: SOLANA_CHAIN_INFO.name,
        platform: Platform.SVM,
      })
    }
    return accountsList
  }, [evmAddress, svmAddress])

  if (!primaryAddress) {
    return null
  }

  const isMultipleAddresses = accounts.length > 1

  return (
    <InfoTooltip
      enabled={isMultipleAddresses}
      maxWidth={400}
      text={
        <Flex gap="$spacing16">
          {accounts.map((account, i) => (
            <TooltipAccountRow key={i} account={account} />
          ))}
        </Flex>
      }
      trigger={
        <PrimaryAddressDisplay
          unitag={unitag}
          ensName={ensName ?? undefined}
          primaryAddress={primaryAddress}
          isMultipleAddresses={isMultipleAddresses}
        />
      }
    />
  )
}
