import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Switch, Text, Tooltip, TouchableArea } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { Rocket } from 'ui/src/components/icons/Rocket'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AdvancedSettingsSeparator } from '~/pages/Liquidity/CreateAuction/components/AdvancedSettingsSeparator'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useIsQuickLaunchMode } from '~/pages/Liquidity/CreateAuction/hooks/useIsQuickLaunchMode'
import { useIsStepValid } from '~/pages/Liquidity/CreateAuction/hooks/useIsStepValid'
import { useStableRaiseUsdPrice } from '~/pages/Liquidity/CreateAuction/hooks/useStableRaiseUsdPrice'
import {
  applyQuickLaunchAuctionWindow,
  applyQuickLaunchPoolPreset,
  getQuickLaunchFloorPricePerToken,
  QUICK_LAUNCH_FLOOR_FDV_USD,
} from '~/pages/Liquidity/CreateAuction/quickLaunch/quickLaunchPreset'
import {
  CreateAuctionStep,
  QuickLaunchDuration,
  TimeLockPreset,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'

/** "30-minute" etc., interpolated into the launch story. Static t() calls so the extractor sees the keys. */
function useDurationStoryLabel(duration: QuickLaunchDuration): string {
  const { t } = useTranslation()
  switch (duration) {
    case QuickLaunchDuration.ThirtyMinutes:
      return t('toucan.createAuction.quickLaunch.story.duration.thirtyMinutes')
    case QuickLaunchDuration.OneHour:
      return t('toucan.createAuction.quickLaunch.story.duration.oneHour')
    case QuickLaunchDuration.FourHours:
      return t('toucan.createAuction.quickLaunch.story.duration.fourHours')
    default:
      return t('toucan.createAuction.quickLaunch.story.duration.thirtyMinutes')
  }
}

/** Emphasis inside story copy is color-only (neutral1 on a neutral2 line), per the design spec. */
const STORY_HIGHLIGHT = <Text variant="body3" color="$neutral1" />

/** The full locked-preset table behind "View all parameters". */
function useLaunchParams(duration: QuickLaunchDuration): { label: string; value: string; hint?: string }[] {
  const { t } = useTranslation()

  const durationTableLabel: Record<QuickLaunchDuration, string> = {
    [QuickLaunchDuration.ThirtyMinutes]: t('toucan.createAuction.quickLaunch.duration.thirtyMinutes'),
    [QuickLaunchDuration.OneHour]: t('toucan.createAuction.quickLaunch.duration.oneHour'),
    [QuickLaunchDuration.FourHours]: t('toucan.createAuction.quickLaunch.duration.fourHours'),
  }

  return [
    {
      label: t('toucan.createAuction.quickLaunch.params.totalSupply'),
      value: t('toucan.createAuction.quickLaunch.params.totalSupply.value'),
      hint: t('toucan.createAuction.quickLaunch.params.totalSupply.hint'),
    },
    {
      label: t('toucan.createAuction.quickLaunch.params.startTime'),
      value: t('toucan.createAuction.quickLaunch.params.startTime.value'),
      hint: t('toucan.createAuction.quickLaunch.params.startTime.hint'),
    },
    { label: t('toucan.createAuction.quickLaunch.params.duration'), value: durationTableLabel[duration] },
    {
      label: t('toucan.createAuction.quickLaunch.params.raiseDenomination'),
      value: t('toucan.createAuction.quickLaunch.params.raiseDenomination.value'),
    },
    {
      label: t('toucan.createAuction.quickLaunch.params.bidPricing'),
      value: t('toucan.createAuction.quickLaunch.params.bidPricing.value'),
      hint: t('toucan.createAuction.quickLaunch.params.bidPricing.hint'),
    },
    {
      label: t('toucan.createAuction.quickLaunch.params.floor'),
      value: t('toucan.createAuction.quickLaunch.params.floor.value', {
        floorFdv: `$${QUICK_LAUNCH_FLOOR_FDV_USD / 1000}k`,
      }),
      hint: t('toucan.createAuction.quickLaunch.params.floor.hint'),
    },
    {
      label: t('toucan.createAuction.quickLaunch.params.proceeds'),
      value: t('toucan.createAuction.quickLaunch.params.proceeds.value'),
      hint: t('toucan.createAuction.quickLaunch.params.proceeds.hint'),
    },
    {
      label: t('toucan.createAuction.quickLaunch.params.lpFeeHandling'),
      value: t('toucan.createAuction.quickLaunch.params.lpFeeHandling.value'),
    },
  ]
}

function LaunchParameterRow({ param }: { param: { label: string; value: string; hint?: string } }): JSX.Element {
  const row = (
    <Flex
      row
      justifyContent="space-between"
      alignItems="center"
      py="$spacing8"
      cursor={param.hint ? 'help' : undefined}
    >
      <Text variant="body3" color="$neutral2">
        {param.label}
      </Text>
      <Text variant="body3" color="$neutral1" textAlign="right">
        {param.value}
      </Text>
    </Flex>
  )

  if (!param.hint) {
    return (
      <Flex>
        {row}
        <Separator />
      </Flex>
    )
  }

  return (
    <Flex>
      <Tooltip placement="top">
        <Tooltip.Trigger asChild>{row}</Tooltip.Trigger>
        <Tooltip.Content>
          <Tooltip.Arrow />
          <Text variant="body4" color="$neutral1" maxWidth={280}>
            {param.hint}
          </Text>
        </Tooltip.Content>
      </Tooltip>
      <Separator />
    </Flex>
  )
}

/**
 * The accent-tinted quick-launch switch row, rendered above the token-info card. Turning the switch
 * off returns the wizard to the standard 3-step flow (and restores the pool defaults the preset
 * overwrites at handoff). Renders nothing when the flag is off or for existing tokens — the preset
 * assumes a factory mint.
 */
export function QuickLaunchToggleCard(): JSX.Element | null {
  const { t } = useTranslation()
  const isQuickLaunchFlagEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)
  const quickLaunch = useCreateAuctionStore((state) => state.quickLaunch)
  const tokenMode = useCreateAuctionStore((state) => state.tokenForm.mode)
  const actions = useCreateAuctionStoreActions()

  // Visible whenever quick launch is available — even toggled off, so it can be re-enabled.
  if (!isQuickLaunchFlagEnabled || tokenMode !== TokenMode.CREATE_NEW) {
    return null
  }

  const handleToggle = (enabled: boolean): void => {
    actions.setQuickLaunch(enabled)
    if (!enabled) {
      // Restore the wizard defaults the quick-launch preset overwrites at review handoff.
      actions.setTimeLockEnabled(false)
      actions.setBuybackAndBurnEnabled(false)
      actions.setTimeLockPreset(TimeLockPreset.OneYear)
    }
  }

  return (
    <Flex
      row
      alignItems="flex-start"
      gap="$spacing8"
      p="$spacing12"
      borderRadius="$rounded12"
      backgroundColor="$accent2"
    >
      <Flex centered width={36} height={36} borderRadius="$rounded12" backgroundColor="$accent2" flexShrink={0}>
        <Rocket size="$icon.20" color="$accent1" />
      </Flex>
      <Flex shrink flex={1}>
        <Text variant="buttonLabel3" color="$neutral1">
          {t('toucan.createAuction.quickLaunch.title')}
        </Text>
        <Text variant="body4" color="$neutral2">
          {t('toucan.createAuction.quickLaunch.toggle.description')}
        </Text>
      </Flex>
      <Switch checked={quickLaunch} onCheckedChange={handleToggle} variant="branded" />
    </Flex>
  )
}

function DurationTile({
  eyebrow,
  title,
  description,
  selected,
  onPress,
}: {
  eyebrow: string
  title: string
  description: string
  selected: boolean
  onPress: () => void
}): JSX.Element {
  return (
    <TouchableArea
      flex={1}
      flexBasis={0}
      p="$spacing12"
      gap="$spacing8"
      borderRadius="$rounded12"
      borderWidth={1}
      borderColor="$surface3Hovered"
      backgroundColor={selected ? '$surface2' : '$surface1'}
      minHeight={100}
      onPress={onPress}
    >
      <Flex row gap="$spacing8" alignItems="flex-start">
        <Flex flex={1} minWidth={0}>
          <Text variant="buttonLabel4" color="$neutral2">
            {eyebrow}
          </Text>
          <Text variant="buttonLabel3" color="$neutral1">
            {title}
          </Text>
        </Flex>
        {selected && <CheckCircleFilled size="$icon.20" color="$neutral1" />}
      </Flex>
      <Flex flex={1} justifyContent="flex-end">
        <Text variant="body4" color="$neutral2">
          {description}
        </Text>
      </Flex>
    </TouchableArea>
  )
}

/** The one decision quick launch exposes: how long the auction runs (30 minutes pre-selected). */
function DurationSection({
  selected,
  onSelect,
}: {
  selected: QuickLaunchDuration
  onSelect: (duration: QuickLaunchDuration) => void
}): JSX.Element {
  const { t } = useTranslation()

  const options: { value: QuickLaunchDuration; eyebrow: string; title: string; description: string }[] = [
    {
      value: QuickLaunchDuration.ThirtyMinutes,
      eyebrow: t('toucan.createAuction.quickLaunch.duration.fast'),
      title: t('toucan.createAuction.quickLaunch.duration.thirtyMinutes'),
      description: t('toucan.createAuction.quickLaunch.duration.thirtyMinutes.description'),
    },
    {
      value: QuickLaunchDuration.OneHour,
      eyebrow: t('toucan.createAuction.quickLaunch.duration.standard'),
      title: t('toucan.createAuction.quickLaunch.duration.oneHour'),
      description: t('toucan.createAuction.quickLaunch.duration.oneHour.description'),
    },
    {
      value: QuickLaunchDuration.FourHours,
      eyebrow: t('toucan.createAuction.quickLaunch.duration.extended'),
      title: t('toucan.createAuction.quickLaunch.duration.fourHours'),
      description: t('toucan.createAuction.quickLaunch.duration.fourHours.description'),
    },
  ]

  return (
    <Flex gap="$spacing12">
      <Flex gap="$spacing4">
        <Text variant="subheading1">{t('toucan.createAuction.quickLaunch.duration.title')}</Text>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.configureAuction.duration.description')}
        </Text>
      </Flex>
      <Flex row gap="$gap8">
        {options.map((option) => (
          <DurationTile
            key={option.value}
            eyebrow={option.eyebrow}
            title={option.title}
            description={option.description}
            selected={selected === option.value}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </Flex>
    </Flex>
  )
}

function StoryBeat({
  index,
  title,
  children,
}: {
  index: number
  title: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <Flex row gap="$spacing12" alignItems="flex-start">
      <Flex centered width={20} height={20} borderRadius="$roundedFull" backgroundColor="$surface3" flexShrink={0}>
        <Text variant="buttonLabel4" color="$neutral1">
          {index}
        </Text>
      </Flex>
      <Flex shrink flex={1} gap="$spacing2">
        <Text variant="body3" color="$neutral1">
          {title}
        </Text>
        <Text variant="body3" color="$neutral2">
          {children}
        </Text>
      </Flex>
    </Flex>
  )
}

/**
 * The preset narrated as three numbered beats (auction → locked pool → buyback & burn) behind a
 * center expando, expanded by default per the design spec; the exact parameter table stays one
 * "View all parameters" disclosure away.
 */
function HowQuickLaunchesWork({ duration }: { duration: QuickLaunchDuration }): JSX.Element {
  const { t } = useTranslation()
  const durationStoryLabel = useDurationStoryLabel(duration)
  const launchParams = useLaunchParams(duration)
  const [expanded, setExpanded] = useState(true)
  const [showAllParams, setShowAllParams] = useState(false)

  const handleToggleExpanded = (): void => {
    setExpanded((prev) => !prev)
  }

  const handleToggleAllParams = (): void => {
    setShowAllParams((prev) => !prev)
  }

  return (
    <Flex gap="$spacing8" width="100%">
      <AdvancedSettingsSeparator
        isExpanded={expanded}
        onToggle={handleToggleExpanded}
        collapsedLabel={t('toucan.createAuction.quickLaunch.howItWorks')}
        expandedLabel={t('toucan.createAuction.quickLaunch.howItWorks')}
      />
      {expanded ? (
        <Flex width="100%" gap="$spacing16" pt="$spacing4">
          <StoryBeat index={1} title={t('toucan.createAuction.quickLaunch.story.auction.title')}>
            <Trans
              i18nKey="toucan.createAuction.quickLaunch.story.auction.description"
              values={{ duration: durationStoryLabel }}
              components={{ highlight: STORY_HIGHLIGHT }}
            />
          </StoryBeat>

          <StoryBeat index={2} title={t('toucan.createAuction.quickLaunch.story.pool.title')}>
            <Trans
              i18nKey="toucan.createAuction.quickLaunch.story.pool.description"
              components={{ highlight: STORY_HIGHLIGHT }}
            />
          </StoryBeat>

          <StoryBeat index={3} title={t('toucan.createAuction.quickLaunch.story.postLaunch.title')}>
            <Trans
              i18nKey="toucan.createAuction.quickLaunch.story.postLaunch.description"
              components={{ highlight: STORY_HIGHLIGHT }}
            />
          </StoryBeat>

          <Flex gap="$spacing4">
            <TouchableArea
              flexDirection="row"
              alignItems="center"
              gap="$spacing2"
              width="fit-content"
              onPress={handleToggleAllParams}
            >
              <Text variant="buttonLabel4" color="$neutral2">
                {showAllParams
                  ? t('toucan.createAuction.quickLaunch.hideAllParameters')
                  : t('toucan.createAuction.quickLaunch.viewAllParameters')}
              </Text>
              <ArrowRight size="$icon.16" color="$neutral2" />
            </TouchableArea>
            {showAllParams ? (
              <Flex width="100%">
                {launchParams.map((param) => (
                  <LaunchParameterRow key={param.label} param={param} />
                ))}
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}

/**
 * QuickLaunch (flag-gated): the in-card quick-launch content on the Token info step — the auction
 * duration tiles, the "How quick launches work" story, and the Review-and-launch CTA that jumps
 * straight to Review with everything else locked to the preset. Renders nothing when quick-launch
 * mode is off (flag off, existing token, or the switch toggled off).
 */
export function QuickLaunchSection(): JSX.Element | null {
  const { t } = useTranslation()
  const isQuickLaunchMode = useIsQuickLaunchMode()
  const quickLaunchDuration = useCreateAuctionStore((state) => state.quickLaunchDuration)
  const tokenForm = useCreateAuctionStore((state) => state.tokenForm)
  const actions = useCreateAuctionStoreActions()
  const isTokenInfoValid = useIsStepValid(CreateAuctionStep.ADD_TOKEN_INFO)

  const chainId = tokenForm.mode === TokenMode.CREATE_NEW ? tokenForm.network : UniverseChainId.Mainnet
  const raiseCurrency = useCreateAuctionStore((state) => state.configureAuction.raiseCurrency)
  const stableRaiseUsdPrice = useStableRaiseUsdPrice({ raiseCurrency, chainId })

  if (!isQuickLaunchMode) {
    return null
  }

  const handleReviewAndLaunch = (): void => {
    if (!isTokenInfoValid) {
      return
    }
    actions.commitTokenFormAndAdvance()
    // Quick launch defaults to on, so the pool preset is applied at handoff rather than on toggle.
    applyQuickLaunchPoolPreset(actions)
    actions.setFloorPrice(getQuickLaunchFloorPricePerToken(stableRaiseUsdPrice))
    applyQuickLaunchAuctionWindow(actions, quickLaunchDuration)
    actions.setStep(CreateAuctionStep.REVIEW_LAUNCH)
  }

  return (
    <>
      <DurationSection selected={quickLaunchDuration} onSelect={actions.setQuickLaunchDuration} />
      <HowQuickLaunchesWork duration={quickLaunchDuration} />
      <Flex row>
        <Button size="large" emphasis="primary" fill isDisabled={!isTokenInfoValid} onPress={handleReviewAndLaunch}>
          {t('toucan.createAuction.quickLaunch.reviewAndLaunch')}
        </Button>
      </Flex>
    </>
  )
}
