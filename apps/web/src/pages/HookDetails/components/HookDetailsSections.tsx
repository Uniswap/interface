import { Flex, Text, TouchableArea, useMedia } from '@universe/mycelium'
import { type KeyboardEvent, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LIVE_POOL_VOLUME_PERIODS } from '~/features/Explore/timeLabels'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import type { HookDeployment, HookDeploymentAddress } from '~/features/Hooks/types'
import { HookPermissions } from '~/features/Liquidity/HookPermissions'
import { HookDetailsCreatePoolCard } from '~/pages/HookDetails/components/HookDetailsCreatePoolCard'
import { HookDetailsDeploymentAddressRows } from '~/pages/HookDetails/components/HookDetailsDeploymentAddressRows'
import { HookDetailsDescription } from '~/pages/HookDetails/components/HookDetailsDescription'
import { HookDetailsPoolsTable } from '~/pages/HookDetails/components/HookDetailsPoolsTable'

enum HookDetailsTab {
  Info = 'info',
  Pools = 'pools',
}

export function HookDetailsSections({
  description,
  descriptionGeneratedByAi,
  deployments,
  deployment,
  isFixture,
}: {
  description: string
  descriptionGeneratedByAi: boolean
  deployments: readonly HookDeploymentAddress[]
  deployment: Pick<HookDeployment, 'chainId' | 'address'>
  isFixture: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const id = useId()
  const [selectedTab, setSelectedTab] = useState(HookDetailsTab.Info)
  const tabRefs = useRef<Record<HookDetailsTab, HTMLElement | null>>({ info: null, pools: null })
  const tabs = [
    { key: HookDetailsTab.Info, label: t('hooks.details.info') },
    { key: HookDetailsTab.Pools, label: t('hooks.details.pools') },
  ]

  function selectTab(tab: HookDetailsTab): void {
    setSelectedTab(tab)
    tabRefs.current[tab]?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>): void {
    switch (event.key) {
      case 'Home':
        selectTab(HookDetailsTab.Info)
        break
      case 'End':
        selectTab(HookDetailsTab.Pools)
        break
      case 'ArrowLeft':
      case 'ArrowRight':
        selectTab(selectedTab === HookDetailsTab.Info ? HookDetailsTab.Pools : HookDetailsTab.Info)
        break
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <Flex width="100%" minWidth={0}>
      {media.md && (
        <Flex row alignItems="center" justifyContent="space-between" gap="$spacing16">
          <Flex row role="tablist" aria-label={t('hooks.details.sections')} gap="$spacing16">
            {tabs.map(({ key, label }) => (
              <TouchableArea
                key={key}
                ref={(node) => {
                  tabRefs.current[key] = node
                }}
                tag="button"
                role="tab"
                id={`${id}-${key}-tab`}
                aria-controls={`${id}-${key}-panel`}
                aria-selected={selectedTab === key}
                tabIndex={selectedTab === key ? 0 : -1}
                minHeight={44}
                onPress={() => selectTab(key)}
                onKeyDown={handleKeyDown}
              >
                <Text variant="subheading1" color={selectedTab === key ? '$neutral1' : '$neutral2'}>
                  {label}
                </Text>
              </TouchableArea>
            ))}
          </Flex>
          {selectedTab === HookDetailsTab.Pools && (
            <VolumeTimeFrameSelector supportedPeriods={LIVE_POOL_VOLUME_PERIODS} />
          )}
        </Flex>
      )}
      <Flex row gap="$spacing48" width="100%" minWidth={0} $xl={{ flexDirection: 'column' }}>
        <Flex
          tag="section"
          role={media.md ? 'tabpanel' : undefined}
          id={`${id}-info-panel`}
          aria-labelledby={`${id}-info-${media.md ? 'tab' : 'heading'}`}
          aria-hidden={media.md && selectedTab !== HookDetailsTab.Info}
          tabIndex={media.md ? 0 : undefined}
          display={media.md && selectedTab !== HookDetailsTab.Info ? 'none' : 'flex'}
          width={340}
          flexShrink={0}
          gap="$spacing24"
          minWidth={0}
          $xl={{ width: '100%' }}
        >
          <Text id={`${id}-info-heading`} tag="h2" variant="subheading1" m={0} display={media.md ? 'none' : undefined}>
            {t('hooks.details.info')}
          </Text>
          <HookDetailsDescription description={description} descriptionGeneratedByAi={descriptionGeneratedByAi} />
          <HookDetailsDeploymentAddressRows deployments={deployments} />
          <HookPermissions hookAddress={deployment.address} />
          <HookDetailsCreatePoolCard deployment={deployment} />
        </Flex>
        <Flex
          tag="section"
          role={media.md ? 'tabpanel' : undefined}
          id={`${id}-pools-panel`}
          aria-labelledby={`${id}-pools-${media.md ? 'tab' : 'heading'}`}
          aria-hidden={media.md && selectedTab !== HookDetailsTab.Pools}
          tabIndex={media.md ? 0 : undefined}
          display={media.md && selectedTab !== HookDetailsTab.Pools ? 'none' : 'flex'}
          flex={1}
          gap="$spacing24"
          minWidth={0}
          $xl={{ width: '100%' }}
        >
          <HookDetailsPoolsTable deployment={deployment} isFixture={isFixture} headingId={`${id}-pools-heading`} />
        </Flex>
      </Flex>
    </Flex>
  )
}
