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
  useFeatureFlagWithExposureLoggingDisabled,
} from '@universe/gating'
import { useModalState } from 'hooks/useModalState'
import styledDep from 'lib/styled-components'
import { useExternallyConnectableExtensionId } from 'pages/ExtensionPasskeyAuthPopUp/useExternallyConnectableExtensionId'
import type { ChangeEvent, PropsWithChildren } from 'react'
import { useCallback } from 'react'
import { Button, Flex, ModalCloseIcon, styled, Text } from 'ui/src'
import { ExperimentRow, LayerRow } from 'uniswap/src/components/gating/Rows'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { TRUSTED_CHROME_EXTENSION_IDS } from 'utilities/src/environment/extensionId'

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

function FeatureFlagGroup({ name, children }: PropsWithChildren<{ name: string }>) {
  return (
    <>
      <CenteredRow key={name}>
        <Text variant="body1">{name}</Text>
      </CenteredRow>
      {children}
    </>
  )
}

const FlagVariantSelection = styledDep.select`
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

function Variant({ option }: { option: string }) {
  return <option value={option}>{option}</option>
}

function FeatureFlagOption({ flag, label }: FeatureFlagProps) {
  const enabled = useFeatureFlagWithExposureLoggingDisabled(flag)
  const name = getFeatureFlagName(flag)

  const onFlagVariantChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      getOverrideAdapter().overrideGate(name, e.target.value === 'Enabled' ? true : false)
    },
    [name],
  )

  return (
    <CenteredRow key={flag}>
      <FlagInfo>
        <Text variant="body2">{name}</Text>
        <Text variant="body4" color="$neutral2">
          {label}
        </Text>
      </FlagInfo>
      <FlagVariantSelection id={name} onChange={onFlagVariantChange} value={enabled ? 'Enabled' : 'Disabled'}>
        {['Enabled', 'Disabled'].map((variant) => (
          <Variant key={variant} option={variant} />
        ))}
      </FlagVariantSelection>
    </CenteredRow>
  )
}

function DynamicConfigDropdown<
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
  parser: (opt: string) => any
  allowMultiple?: boolean
}) {
  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValues = Array.from(e.target.selectedOptions, (opt) => parser(opt.value))
      getOverrideAdapter().overrideDynamicConfig(config, {
        [configKey]: allowMultiple ? selectedValues : selectedValues[0],
      })
    },
    [allowMultiple, config, configKey, parser],
  )
  return (
    <CenteredRow key={config}>
      <FlagInfo>
        <Text variant="body2">{config}</Text>
        <Text variant="body4" color="$neutral2">
          {label}
        </Text>
      </FlagInfo>
      <select multiple={allowMultiple} onChange={handleSelectChange}>
        {Array.isArray(options)
          ? options.map((opt) => (
              <option key={opt} value={opt} selected={selected.includes(opt)}>
                {opt}
              </option>
            ))
          : Object.entries(options).map(([key, value]) => (
              <option key={key} value={value} selected={selected.includes(value)}>
                {key}
              </option>
            ))}
      </select>
    </CenteredRow>
  )
}

export default function FeatureFlagModal() {
  const { isOpen, closeModal } = useModalState(ModalName.FeatureFlags)
  const removeAllOverrides = () => {
    getOverrideAdapter().removeAllOverrides()
  }
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
            <FeatureFlagOption flag={FeatureFlags.ChainedActions} label="Enable Chained Actions" />
            <FeatureFlagOption flag={FeatureFlags.BatchedSwaps} label="Enable Batched Swaps" />
            <FeatureFlagOption flag={FeatureFlags.EthAsErc20UniswapX} label="Enable Eth as ERC20 for UniswapX " />
            <FeatureFlagOption flag={FeatureFlags.UnichainFlashblocks} label="Enable Unichain Flashblocks" />
            <FeatureFlagOption flag={FeatureFlags.UniquoteEnabled} label="Enable Uniquote" />
            <FeatureFlagOption flag={FeatureFlags.ViemProviderEnabled} label="Enable Viem Provider" />
            <FeatureFlagOption flag={FeatureFlags.InstantTokenBalanceUpdate} label="Instant token balance update" />
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
          <FeatureFlagGroup name="Toucan">
            <FeatureFlagOption flag={FeatureFlags.Toucan} label="Enable Toucan" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="FOR">
            <FeatureFlagOption flag={FeatureFlags.FiatOffRamp} label="Enable Fiat OffRamp" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Embedded Wallet">
            <FeatureFlagOption flag={FeatureFlags.EmbeddedWallet} label="Add internal embedded wallet functionality" />
            <DynamicConfigDropdown
              selected={[useExternallyConnectableExtensionId()]}
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
          <FeatureFlagGroup name="Data Reporting">
            <FeatureFlagOption flag={FeatureFlags.DataReportingAbilities} label="Enable Data Reporting Abilities" />
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
            <DynamicConfigDropdown
              selected={[30]}
              options={[1, 10, 20, 30]}
              parser={Number.parseInt}
              config={DynamicConfigs.NetworkRequests}
              configKey={NetworkRequestsConfigKey.BalanceMaxRefetchAttempts}
              label="Max refetch attempts"
            />
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
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Misc">
            <FeatureFlagOption flag={FeatureFlags.BridgedAssetsBannerV2} label="Enable V2 Bridged Assets Banner" />
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
        <Button onPress={window.location.reload} variant="default" emphasis="secondary" size="small" fill={false}>
          Reload
        </Button>
      </Flex>
    </Modal>
  )
}
