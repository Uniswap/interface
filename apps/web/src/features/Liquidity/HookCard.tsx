import type { ReactNode } from 'react'
import { Flex, Text } from 'ui/src'
import { Code } from 'ui/src/components/icons/Code'
import { Verified } from 'ui/src/components/icons/Verified'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { shortenAddress } from 'utilities/src/addresses'

interface HookCardProps {
  address: string
  name?: string
  chain?: string
  chainId?: UniverseChainId
  icon?: ReactNode
  verified?: boolean
  copyableAddress?: boolean
  addressEndAdornment?: ReactNode
}

export function HookCard({
  address,
  name,
  chain,
  chainId,
  icon,
  verified,
  copyableAddress,
  addressEndAdornment,
}: HookCardProps) {
  // Registry entries carry a lowercase chain slug (e.g. "ethereum") — prefer the canonical display label
  const networkLabel = chainId ? getChainLabel(chainId) : chain
  return (
    <Flex row alignItems="center" gap="$gap12">
      <Flex width={36} height={36}>
        <Flex
          width={36}
          height={36}
          backgroundColor="$surface3"
          borderRadius="$rounded8"
          alignItems="center"
          justifyContent="center"
        >
          {icon ?? <Code size={20} color="$neutral1" />}
        </Flex>
        {chainId ? (
          <Flex position="absolute" bottom={-2} right={-3}>
            <NetworkLogo chainId={chainId} size={14} borderWidth={1.5} />
          </Flex>
        ) : null}
      </Flex>
      <Flex flex={1}>
        <Flex row alignItems="center" gap="$gap8">
          <Text variant="body2" color="$neutral1">
            {name || shortenAddress({ address })}
          </Text>
          {verified ? <Verified size="$icon.16" color="$accent1" /> : null}
        </Flex>
        <Flex row alignItems="center" gap="$gap4">
          {networkLabel ? (
            <Text variant="body3" color="$neutral2">
              {networkLabel}
            </Text>
          ) : null}
          {name ? (
            <Text variant="body3" color="$neutral3">
              {shortenAddress({ address })}
            </Text>
          ) : null}
          {copyableAddress ? (
            <Flex display="none" $group-item-hover={{ display: 'flex' }} onPress={(e) => e.stopPropagation()}>
              <CopyHelper toCopy={address} iconSize={14} iconColor="$neutral3" />
            </Flex>
          ) : null}
          {addressEndAdornment}
        </Flex>
      </Flex>
    </Flex>
  )
}
