import { Flex, Text, useMedia } from '@universe/mycelium'
import { Code } from '@universe/mycelium/icons/Code'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { shortenAddress } from 'utilities/src/addresses'
import { Cell } from '~/components/Table/Cell'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { HookProvenanceBadge } from '~/features/Hooks/components/HookProvenanceBadge'
import { HookStatusBadges } from '~/features/Hooks/components/HookStatusBadges'
import { HookSourceVerification } from '~/features/Hooks/types'
import type { HookTableRow } from '~/pages/Explore/tables/Hooks/hooksTableTypes'
import { HookTableLink } from '~/pages/Explore/tables/Hooks/HookTableLink'

export function HookTableIdentity({ row }: { row: HookTableRow }): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const statusId = useId()
  const hasStatusDescription = row.customAccounting || row.partialIndexing
  const address = shortenAddress({ address: row.address })
  const chainNames = row.chainIds.map(getChainLabel).join(', ')
  const multipleNetworks = row.chainIds.length > 1
  const iconColor =
    row.provenance !== undefined ? '$accent1' : row.sourceVerified ? 'var(--color-cyan-base)' : '$neutral2'
  const iconBackground = row.provenance !== undefined ? '$accent2' : row.sourceVerified ? undefined : '$surface3'
  const icon = (
    <Flex
      centered
      position="relative"
      width={32}
      height={32}
      flexShrink={0}
      borderRadius="$rounded8"
      backgroundColor={iconBackground}
      className={row.provenance === undefined && row.sourceVerified ? 'bg-cyan-light dark:bg-cyan-dark' : undefined}
    >
      <Code size={20} color={iconColor} />
      {!multipleNetworks && (
        <Flex position="absolute" bottom={-4} right={-4}>
          <NetworkLogo chainId={row.chainIds[0]} size={16} />
        </Flex>
      )}
    </Flex>
  )

  return (
    <Flex position="relative" width="100%" height="100%" minWidth={0}>
      <HookTableLink
        to={row.href}
        aria-label={t('hooks.list.openHook', { hookName: row.name ?? row.address, networks: chainNames })}
        aria-describedby={hasStatusDescription ? statusId : undefined}
        className="absolute inset-0 min-h-11"
      />
      <Cell
        justifyContent="flex-start"
        px={media.md ? '$spacing8' : '$spacing12'}
        py="$none"
        height="100%"
        width="100%"
        pointerEvents="none"
        gap="$gap12"
      >
        {media.md && row.provenance !== undefined ? (
          <Flex flexShrink={0} pointerEvents="auto">
            <HookProvenanceBadge
              provenance={row.provenance}
              builderName={row.builderName}
              configurerName={row.configurerName}
              trigger={icon}
              isolateInteraction
            />
          </Flex>
        ) : (
          icon
        )}
        <Flex flex={1} flexBasis={0} flexShrink={1} minWidth={0} gap="$gap2">
          <Flex row alignItems="center" gap="$gap4" minWidth={0}>
            <EllipsisText flexShrink={1} minWidth={0} variant={media.md ? 'body3' : 'body2'}>
              {row.name ?? address}
            </EllipsisText>
            <Flex flexShrink={0} pointerEvents="auto">
              <HookStatusBadges
                sourceVerification={
                  row.sourceVerified ? HookSourceVerification.Verified : HookSourceVerification.Unverified
                }
                routingStatus={row.routingStatus}
                provenance={media.md ? undefined : row.provenance}
                builderName={row.builderName}
                configurerName={row.configurerName}
                positiveOnly
                isolateInteraction
              />
            </Flex>
          </Flex>
          {(row.name !== undefined || multipleNetworks || row.customAccounting) && (
            <Flex row alignItems="center" gap="$gap4" minWidth={0}>
              <Text flexShrink={1} variant={media.md ? 'body4' : 'body3'} color="$neutral2" numberOfLines={1}>
                {row.customAccounting
                  ? t('hooks.details.customAccounting')
                  : multipleNetworks
                    ? t('explore.tokens.table.networks', { count: row.chainIds.length })
                    : address}
              </Text>
              {multipleNetworks && <NetworkIconList chainIds={row.chainIds} size={12} iconOverlap={0.45} />}
            </Flex>
          )}
        </Flex>
      </Cell>
      {hasStatusDescription && (
        <Text id={statusId} className="sr-only">
          {row.customAccounting && t('hooks.details.customAccounting.description')}
          {row.customAccounting && row.partialIndexing && ' '}
          {row.partialIndexing && t('hooks.details.incompleteIndexing')}
        </Text>
      )}
    </Flex>
  )
}
