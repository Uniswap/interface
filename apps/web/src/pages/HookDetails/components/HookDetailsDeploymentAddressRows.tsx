import {
  AddressStringFormat,
  getValidAddress,
  normalizeAddress,
  Platform,
  type UniverseChainId,
} from '@universe/chains'
import { Flex, iconSizes, Text, zIndexes } from '@universe/mycelium'
import { Popover, PopoverContent, PopoverTrigger } from '@universe/mycelium/components'
import { ArrowUpRight } from '@universe/mycelium/icons/ArrowUpRight'
import { File } from '@universe/mycelium/icons/File'
import { Person } from '@universe/mycelium/icons/Person'
import type { TFunction } from 'i18next'
import { type ReactNode, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import type { HookDeploymentAddress } from '~/features/Hooks/types'
import { ExternalLink } from '~/theme/components/Links'

enum HookAddressKind {
  Deployer = 'deployer',
  Contract = 'contract',
}

interface AddressGroup {
  address: string | null
  chainIds: UniverseChainId[]
}

interface AddressConfig {
  getAddress: (deployment: HookDeploymentAddress) => string | null
  label: (t: TFunction) => string
  title: (t: TFunction) => string
  copyLabel: (t: TFunction, address: string) => string
  triggerLabel: (t: TFunction, count: number) => string
  icon: ReactNode
}

const ADDRESS_POPOVER_WIDTH = 304

const ADDRESS_CONFIG: Record<HookAddressKind, AddressConfig> = {
  [HookAddressKind.Deployer]: {
    getAddress: (deployment) => deployment.deployerAddress,
    label: (t) => t('hooks.details.deployer'),
    title: (t) => t('hooks.details.deployers'),
    copyLabel: (t, address) => t('hooks.details.copyDeployerAddress', { address }),
    triggerLabel: (t, count) => t('hooks.details.viewDeployers', { count }),
    icon: <Person size="$icon.16" color="$neutral2" />,
  },
  [HookAddressKind.Contract]: {
    getAddress: (deployment) => deployment.address,
    label: (t) => t('common.text.contract'),
    title: (t) => t('hooks.details.contracts'),
    copyLabel: (t, address) => t('hooks.details.copyContractAddress', { address }),
    triggerLabel: (t, count) => t('hooks.details.viewContracts', { count }),
    icon: <File size="$icon.16" color="$neutral1" />,
  },
}

function groupAddresses(deployments: readonly HookDeploymentAddress[], kind: HookAddressKind): AddressGroup[] {
  const groups = new Map<string | null, AddressGroup>()
  for (const deployment of deployments) {
    const rawAddress = ADDRESS_CONFIG[kind].getAddress(deployment)
    const address = rawAddress ? normalizeAddress(rawAddress, AddressStringFormat.Lowercase) : null
    const group = groups.get(address)
    if (!group) {
      groups.set(address, { address, chainIds: [deployment.chainId] })
    } else if (!group.chainIds.includes(deployment.chainId)) {
      group.chainIds.push(deployment.chainId)
    }
  }
  return [...groups.values()]
}

function CopyableAddress({ address, config }: { address: string; config: AddressConfig }): JSX.Element {
  const { t } = useTranslation()

  return (
    <CopyHelper
      toCopy={getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: true }) ?? address}
      iconSize={14}
      iconPosition="right"
    >
      <Text variant="body3" color="$neutral1" aria-hidden>
        {shortenAddress({ address })}
      </Text>
      <Text tag="span" className="sr-only">
        {config.copyLabel(t, address)}
      </Text>
    </CopyHelper>
  )
}

function AddressExplorerLink({
  address,
  chainId,
  showNetwork = false,
}: {
  address: string
  chainId: UniverseChainId
  showNetwork?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const network = getChainLabel(chainId)

  return (
    <ExternalLink
      href={getExplorerLink({ chainId, data: address, type: ExplorerDataType.ADDRESS })}
      aria-label={t('hooks.details.viewAddressOnExplorer', { address, network })}
      display="flex"
      alignItems="center"
      gap="$gap4"
      color="$neutral1"
      variant="body3"
    >
      {showNetwork && (
        <>
          <NetworkLogo chainId={chainId} size={iconSizes.icon16} />
          <Text variant="body3" color="$neutral1">
            {network}
          </Text>
        </>
      )}
      <ArrowUpRight size="$icon.16" color="$neutral2" />
    </ExternalLink>
  )
}

function SingleAddress({ group, config }: { group?: AddressGroup; config: AddressConfig }): JSX.Element {
  const { t } = useTranslation()
  const chainId = group?.chainIds[0]

  if (!group?.address || chainId === undefined) {
    return (
      <Text variant="body3" color="$neutral2">
        {t('common.unavailable')}
      </Text>
    )
  }

  return (
    <Flex row alignItems="center" gap="$gap4">
      <CopyableAddress address={group.address} config={config} />
      <AddressExplorerLink address={group.address} chainId={chainId} />
    </Flex>
  )
}

function AddressPopover({
  groups,
  config,
  count,
}: {
  groups: AddressGroup[]
  config: AddressConfig
  count: number
}): JSX.Element {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const titleId = useId()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={config.triggerLabel(t, count)}
        className="-my-1 inline-flex cursor-pointer items-center gap-1 rounded-6 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent1"
      >
        <NetworkLogo chainId={null} size={iconSizes.icon16} />
        <Flex
          centered
          minWidth={iconSizes.icon18}
          height={iconSizes.icon18}
          px="$spacing2"
          borderRadius="$roundedFull"
          backgroundColor="$surface3"
        >
          <Text variant="body4" color="$neutral1">
            {count}
          </Text>
        </Flex>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        collisionPadding={16}
        aria-labelledby={titleId}
        className="min-w-0 max-w-[calc(100vw-32px)] rounded-20 border-surface3 bg-surface1 px-4 py-3 shadow-medium backdrop-blur-none"
        style={{ zIndex: zIndexes.popover, width: ADDRESS_POPOVER_WIDTH }}
      >
        <Flex gap="$gap4">
          <Flex row alignItems="center" gap="$gap4" pb="$spacing8">
            {config.icon}
            <Text id={titleId} variant="body3" color="$neutral2">
              {config.title(t)}
            </Text>
          </Flex>
          {groups.map((group) => (
            <Flex
              key={group.address ?? 'unavailable'}
              row
              alignItems="flex-start"
              justifyContent="space-between"
              gap="$gap8"
              py="$spacing4"
            >
              {group.address ? (
                <CopyableAddress address={group.address} config={config} />
              ) : (
                <Text variant="body3" color="$neutral2">
                  {t('common.unavailable')}
                </Text>
              )}
              <Flex gap="$gap12" alignItems="flex-end">
                {group.chainIds.map((networkId) =>
                  group.address ? (
                    <AddressExplorerLink key={networkId} address={group.address} chainId={networkId} showNetwork />
                  ) : (
                    <Flex key={networkId} row alignItems="center" gap="$gap4">
                      <NetworkLogo chainId={networkId} size={iconSizes.icon16} />
                      <Text variant="body3" color="$neutral1">
                        {getChainLabel(networkId)}
                      </Text>
                    </Flex>
                  ),
                )}
              </Flex>
            </Flex>
          ))}
        </Flex>
      </PopoverContent>
    </Popover>
  )
}

function AddressRow({ kind, groups }: { kind: HookAddressKind; groups: AddressGroup[] }): JSX.Element {
  const { t } = useTranslation()
  const config = ADDRESS_CONFIG[kind]
  const count = groups.filter((group) => group.address !== null).length
  const multiple = groups.reduce((total, group) => total + group.chainIds.length, 0) > 1
  const label = config.label(t)

  return (
    <Flex row alignItems="center" justifyContent="space-between" gap="$gap12" role="group" aria-label={label}>
      <Flex row alignItems="center" gap="$gap4">
        {config.icon}
        <Text variant="body3" color="$neutral2">
          {label}
        </Text>
      </Flex>
      {multiple && count > 0 ? (
        <AddressPopover groups={groups} config={config} count={count} />
      ) : (
        <SingleAddress group={multiple ? undefined : groups[0]} config={config} />
      )}
    </Flex>
  )
}

export function HookDetailsDeploymentAddressRows({
  deployments,
}: {
  deployments: readonly HookDeploymentAddress[]
}): JSX.Element {
  const deployers = useMemo(() => groupAddresses(deployments, HookAddressKind.Deployer), [deployments])
  const contracts = useMemo(() => groupAddresses(deployments, HookAddressKind.Contract), [deployments])

  return (
    <Flex gap="$gap12">
      <AddressRow kind={HookAddressKind.Deployer} groups={deployers} />
      <AddressRow kind={HookAddressKind.Contract} groups={contracts} />
    </Flex>
  )
}
