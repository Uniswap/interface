import type { UniverseChainId } from '@universe/chains'
import { Flex, Text, useMedia } from '@universe/mycelium'
import { Code } from '@universe/mycelium/icons/Code'
import type { ReactNode } from 'react'
import { shortenAddress } from 'utilities/src/addresses'
import type { HookDeploymentAddress } from '~/features/Hooks/types'
import { HookDetailsNetworkSelector } from '~/pages/HookDetails/components/HookDetailsNetworkSelector'

interface HookDetailsHeaderProps {
  name?: string | null
  address: string
  chainId: UniverseChainId
  deployments: readonly HookDeploymentAddress[]
  compact?: boolean
  badges?: ReactNode
}

export function HookDetailsHeader({
  name,
  address,
  chainId,
  deployments,
  compact = false,
  badges,
}: HookDetailsHeaderProps): JSX.Element {
  const media = useMedia()
  const displayName = name?.trim()

  return (
    <Flex row alignItems="center" gap="$gap12" minWidth={0}>
      <Flex
        centered
        width={48}
        height={48}
        flexShrink={0}
        borderRadius="$rounded16"
        backgroundColor={displayName ? '$accent2' : '$surface3'}
      >
        <Code size={30} color={displayName ? '$accent1' : '$neutral2'} />
      </Flex>
      <Flex flex={1} flexBasis={0} gap="$gap4" minWidth={0}>
        <Flex
          row
          alignItems="center"
          flexWrap="wrap"
          gap="$gap8"
          minWidth={0}
          $md={{ flexDirection: 'column', alignItems: 'flex-start', gap: '$gap4' }}
        >
          <Text
            tag="span"
            m={0}
            variant="heading3"
            fontSize={compact ? 16 : 24}
            lineHeight={compact ? 20 : 29}
            $md={{ fontSize: compact ? 16 : 18, lineHeight: compact ? 20 : 23 }}
            wordBreak="break-word"
            minWidth={0}
            maxWidth="100%"
          >
            {displayName || shortenAddress({ address })}
          </Text>
          {badges}
        </Flex>
        {!media.md && (
          <Flex row alignSelf="flex-start">
            <HookDetailsNetworkSelector chainId={chainId} address={address} deployments={deployments} />
          </Flex>
        )}
      </Flex>
      {media.md && <HookDetailsNetworkSelector chainId={chainId} address={address} deployments={deployments} />}
    </Flex>
  )
}
