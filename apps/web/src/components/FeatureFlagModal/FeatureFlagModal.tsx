import type { DynamicConfigKeys } from '@universe/gating'
import {
  DynamicConfigs,
  Experiments,
  ExternallyConnectableExtensionConfigKey,
  FeatureFlags,
  getFeatureFlagName,
  getOverrideAdapter,
  Layers,
  NetworkRequestsConfigKey,
  useDynamicConfigValue,
  useFeatureFlagWithExposureLoggingDisabled,
} from '@universe/gating'
import { useModalState } from 'hooks/useModalState'
import { deprecatedStyled } from 'lib/styled-components'
import { useExternallyConnectableExtensionId } from 'pages/ExtensionPasskeyAuthPopUp/useExternallyConnectableExtensionId'
import type { ChangeEvent, PropsWithChildren } from 'react'
import { memo } from 'react'
import { Button, Flex, ModalCloseIcon, styled, Text } from 'ui/src'
import { ExperimentRow, LayerRow } from 'uniswap/src/components/gating/Rows'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { TRUSTED_CHROME_EXTENSION_IDS } from 'utilities/src/environment/extensionId'
import { useEvent } from 'utilities/src/react/hooks'

const FLAG_VARIANTS = ['Enabled', 'Disabled'] as const

const CenteredRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '$gap8',
  maxWidth: '100%',
  gap: '$gap4',
})

const FlagInfo = styled(Flex, {
  pl: '$padding8',
  flexShrink: 1,
})

interface FeatureFlagProps {
  label: string
  flag: FeatureFlags
}

const FeatureFlagGroup = memo(function FeatureFlagGroup({
  name,
  children,
}: PropsWithChildren<{ name: string }>): JSX.Element {
  return (
    <>
      <CenteredRow key={name}>
        <Text variant="body1">{name}</Text>
      </CenteredRow>
      {children}
    </>
  )
})

const FlagVariantSelection = deprecatedStyled.select`
  border-radius: 12px;
  padding: 8px;
  background: ${({ theme }) => theme.surface3};
  font-weight: 535;
  font-size: 16px;
  border: none;
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  :hover {
    background: ${({ theme }) => theme.surface3};
  }
`

const Variant = memo(function Variant({ option }: { option: string }): JSX.Element {
  return <option value={option}>{option}</option>
})

const FeatureFlagOption = memo(function FeatureFlagOption({ flag, label }: FeatureFlagProps): JSX.Element {
  const enabled = useFeatureFlagWithExposureLoggingDisabled(flag)
  const name = getFeatureFlagName(flag)

  const onFlagVariantChange = useEvent((e: ChangeEvent<HTMLSelectElement>) => {
    getOverrideAdapter().overrideGate(name, e.target.value === 'Enabled' ? true : false)
  })

  return (
    <CenteredRow key={flag}>
      <FlagInfo>
        <Text variant="body2">{name}</Text>
        <Text variant="body4" color="$neutral2">
          {label}
        </Text>
      </FlagInfo>
      <FlagVariantSelection id={name} onChange={onFlagVariantChange} value={enabled ? 'Enabled' : 'Disabled'}>
        {FLAG_VARIANTS.map((variant) => (
          <Variant key={variant} option={variant} />
        ))}
      </FlagVariantSelection>
    </CenteredRow>
  )
})

const DynamicConfigDropdown = memo(function DynamicConfigDropdown<
  Conf extends Exclude<DynamicConfigs, DynamicConfigs.GasStrategies>,
  Key extends DynamicConfigKeys[Conf],
>({
  config,
  configKey,
  label,
  options,
  selected,
  parser,
  allowMultiple = true,
}: {
  config: Conf
  configKey: Key
  label: string
  options: Array<string | number> | Record<string, string | number>
  selected: unknown[]
  parser: (opt: string) => unknown
  allowMultiple?: boolean
}): JSX.Element {
  const handleSelectChange = useEvent((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(e.target.selectedOptions, (opt) => parser(opt.value))
    getOverrideAdapter().overrideDynamicConfig(config, {
      [configKey]: allowMultiple ? selectedValues : selectedValues[0],
    })
  })

  return (
    <CenteredRow key={config}>
      <FlagInfo>
        <Text variant="body2">{config}</Text>
        <Text variant="body4" color="$neutral2">
          {label}
        </Text>
      </FlagInfo>
      <select
        multiple={allowMultiple}
        onChange={handleSelectChange}
        value={allowMultiple ? selected.map(String) : String(selected[0] ?? '')}
      >
        {Array.isArray(options)
          ? options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))
          : Object.entries(options).map(([key, value]) => (
              <option key={key} value={value}>
                {key}
              </option>
            ))}
      </select>
    </CenteredRow>
  )
})

export default function FeatureFlagModal(): JSX.Element {
  const { isOpen, closeModal } = useModalState(ModalName.FeatureFlags)
  const externallyConnectableExtensionId = useExternallyConnectableExtensionId()

  const removeAllOverrides = useEvent(() => {
    getOverrideAdapter().removeAllOverrides()
  })

  const handleReload = useEvent(() => {
    window.location.reload()
  })

  return (
    <Modal name={ModalName.FeatureFlags} isModalOpen={isOpen} onClose={closeModal} padding={0}>
      <Flex py="$gap20" px="$gap16" gap="$gap8">
        <CenteredRow borderBottomColor="$surface3" borderBottomWidth={1}>
          <Flex row grow alignItems="center" justifyContent="space-between">
            <Text variant="subheading2">Feature Flag Settings</Text>
            <Button onPress={removeAllOverrides} variant="branded" size="small" fill={false}>
              Clear Overrides
            </Button>
          </Flex>
          <ModalCloseIcon onClose={closeModal} />
        </CenteredRow>
        <Flex maxHeight="600px" pb="$gap8" overflow="scroll" $md={{ maxHeight: 'unset' }}>
          <FeatureFlagGroup name="Sessions">
            <FeatureFlagOption flag={FeatureFlags.SessionsServiceEnabled} label="Enable Sessions Service" />
            <FeatureFlagOption flag={FeatureFlags.SessionsUpgradeAutoEnabled} label="Enable Sessions Upgrade Auto" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Monad">
            <FeatureFlagOption flag={FeatureFlags.Monad} label="Enable Monad UX" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Solana">
            <FeatureFlagOption flag={FeatureFlags.Solana} label="Enable Solana UX" />
            <FeatureFlagOption flag={FeatureFlags.SolanaPromo} label="Turn on Solana promo banners" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Swap Refactor">
            <FeatureFlagOption
              flag={FeatureFlags.ServiceBasedSwapTransactionInfo}
              label="Enable service-based swap transaction info"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Swap Features">
            <FeatureFlagOption flag={FeatureFlags.NoUniswapInterfaceFees} label="Turn off Uniswap interface fees" />
            <FeatureFlagOption flag={FeatureFlags.ChainedActions} label="Enable Chained Actions" />
            <FeatureFlagOption flag={FeatureFlags.BatchedSwaps} label="Enable Batched Swaps" />
            <FeatureFlagOption flag={FeatureFlags.EthAsErc20UniswapX} label="Enable Eth as ERC20 for UniswapX " />
            <FeatureFlagOption flag={FeatureFlags.UnichainFlashblocks} label="Enable Unichain Flashblocks" />
            <FeatureFlagOption flag={FeatureFlags.UniquoteEnabled} label="Enable Uniquote" />
            <FeatureFlagOption flag={FeatureFlags.ViemProviderEnabled} label="Enable Viem Provider" />
            <FeatureFlagOption flag={FeatureFlags.LimitsFees} label="Enable Limits fees" />
            <FeatureFlagOption flag={FeatureFlags.EnablePermitMismatchUX} label="Enable Permit2 mismatch detection" />
            <FeatureFlagOption
              flag={FeatureFlags.TradingApiSwapConfirmation}
              label="Enable Trading API Swap Confirmation"
            />
            <FeatureFlagOption
              flag={FeatureFlags.ForcePermitTransactions}
              label="Force Permit2 transaction instead of signatures, always"
            />
            <FeatureFlagOption
              flag={FeatureFlags.ForceDisableWalletGetCapabilities}
              label="Force disable wallet get capabilities result"
            />
            <FeatureFlagOption
              flag={FeatureFlags.AllowUniswapXOnlyRoutesInSwapSettings}
              label="Allow UniswapX-Only Routes in Swap Settings (for local testing only)"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="UniswapX">
            <FeatureFlagOption flag={FeatureFlags.UniswapX} label="Enable UniswapX" />
            <FeatureFlagOption
              flag={FeatureFlags.UniswapXPriorityOrdersBase}
              label="UniswapX Priority Orders (on Base)"
            />
            <FeatureFlagOption
              flag={FeatureFlags.UniswapXPriorityOrdersUnichain}
              label="UniswapX Priority Orders (on Unichain)"
            />
            <FeatureFlagOption flag={FeatureFlags.ArbitrumDutchV3} label="Enable Dutch V3 on Arbitrum" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="LP">
            <FeatureFlagOption flag={FeatureFlags.D3LiquidityRangeChart} label="Enable new D3 liquidity range chart" />
            <FeatureFlagOption flag={FeatureFlags.LpIncentives} label="Enable LP Incentives" />
            <FeatureFlagOption flag={FeatureFlags.MigrateV2} label="Enable new Migrate V2 flow" />
            <FeatureFlagOption
              flag={FeatureFlags.PoolInfoEndpoint}
              label="Enable create flow with new PoolInfo endpoint"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="ECS LP Migration">
            <FeatureFlagOption flag={FeatureFlags.MigrateLiquidityApi} label="Enable Migrate Liquidity API" />
            <FeatureFlagOption
              flag={FeatureFlags.ClaimRewardsLiquidityApi}
              label="Enable Claim Rewards Liquidity API"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Toucan">
            <FeatureFlagOption flag={FeatureFlags.Toucan} label="Enable Toucan" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="FOR">
            <FeatureFlagOption flag={FeatureFlags.FiatOffRamp} label="Enable Fiat OffRamp" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Embedded Wallet">
            <FeatureFlagOption flag={FeatureFlags.EmbeddedWallet} label="Add internal embedded wallet functionality" />
            <DynamicConfigDropdown
              selected={[externallyConnectableExtensionId]}
              options={TRUSTED_CHROME_EXTENSION_IDS}
              parser={(id) => id}
              config={DynamicConfigs.ExternallyConnectableExtension}
              configKey={ExternallyConnectableExtensionConfigKey.ExtensionId}
              label="Which Extension the web app will communicate with"
              allowMultiple={false}
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Mini Portfolio">
            <FeatureFlagOption flag={FeatureFlags.SelfReportSpamNFTs} label="Report spam NFTs" />
            <FeatureFlagOption
              flag={FeatureFlags.DisableExtensionDeeplinks}
              label="Disable extension deeplinks for testing mini portfolio UI on web"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Search">
            <FeatureFlagOption
              flag={FeatureFlags.PoolSearch}
              label="Enable pool search (turn on search_revamp as well to see)"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="New Chains">
            <FeatureFlagOption flag={FeatureFlags.Soneium} label="Enable Soneium" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Network Requests">
            <NetworkRequestsConfig />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Debug">
            <FeatureFlagOption flag={FeatureFlags.TraceJsonRpc} label="Enables JSON-RPC tracing" />
            <FeatureFlagOption flag={FeatureFlags.AATestWeb} label="A/A Test for Web" />
            {isPlaywrightEnv() && <FeatureFlagOption flag={FeatureFlags.DummyFlagTest} label="Dummy Flag Test" />}
          </FeatureFlagGroup>
          <FeatureFlagGroup name="New Wallet Connectors">
            <FeatureFlagOption flag={FeatureFlags.PortoWalletConnector} label="Enable Porto Wallet Connector" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Portfolio">
            <FeatureFlagOption flag={FeatureFlags.PortfolioPage} label="Enable Portfolio page" />
            <FeatureFlagOption flag={FeatureFlags.PortfolioDefiTab} label="Enable Portfolio DeFi Tab" />
            <FeatureFlagOption
              flag={FeatureFlags.PortfolioTokensAllocationChart}
              label="Enable Portfolio Tokens Allocation Chart"
            />
            <FeatureFlagOption flag={FeatureFlags.ViewExternalWalletsOnWeb} label="View external wallets on web" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Notifications">
            <FeatureFlagOption flag={FeatureFlags.NotificationService} label="Enable Notification Service" />
            <FeatureFlagOption
              flag={FeatureFlags.NotificationApiDataSource}
              label="Enable API Data Source for Notifications"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Misc">
            <FeatureFlagOption flag={FeatureFlags.BridgedAssetsBannerV2} label="Enable V2 Bridged Assets Banner" />
            <FeatureFlagOption flag={FeatureFlags.UniswapWrapped2025} label="Enable Uniswap Wrapped 2025" />
            <FeatureFlagOption flag={FeatureFlags.UnificationCopy} label="Enable Unification Copy" />
            <FeatureFlagOption flag={FeatureFlags.DisableAztecToken} label="Disable Aztec Token" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Experiments">
            <Flex ml="$padding8">
              <ExperimentRow value={Experiments.ForFilters} />
              <ExperimentRow value={Experiments.WebFORNudges} />
            </Flex>
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Layers">
            <Flex ml="$padding8">
              <LayerRow value={Layers.SwapPage} />
              <LayerRow value={Layers.PortfolioPage} />
            </Flex>
          </FeatureFlagGroup>
        </Flex>
        <Button onPress={handleReload} variant="default" emphasis="secondary" size="small" fill={false}>
          Reload
        </Button>
      </Flex>
    </Modal>
  )
}

function NetworkRequestsConfig() {
  const currentValue = useDynamicConfigValue({
    config: DynamicConfigs.NetworkRequests,
    key: NetworkRequestsConfigKey.BalanceMaxRefetchAttempts,
    defaultValue: 30,
  })

  return (
    <DynamicConfigDropdown
      selected={[currentValue]}
      options={[1, 10, 20, 30]}
      parser={Number.parseInt}
      config={DynamicConfigs.NetworkRequests}
      configKey={NetworkRequestsConfigKey.BalanceMaxRefetchAttempts}
      allowMultiple={false}
      label="Max refetch attempts"
    />
  )
}
