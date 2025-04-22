import { useQuickRouteChains } from 'featureFlags/dynamicConfig/quickRouteChains'
import styledDep from 'lib/styled-components'
import { PropsWithChildren } from 'react'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { Button, Flex, ModalCloseIcon, Text, styled } from 'ui/src'
import { ExperimentRow } from 'uniswap/src/components/gating/GatingOverrides'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/chains/types'
import {
  DynamicConfigKeys,
  DynamicConfigs,
  NetworkRequestsConfigKey,
  QuickRouteChainsConfigKey,
} from 'uniswap/src/features/gating/configs'
import { Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithExposureLoggingDisabled } from 'uniswap/src/features/gating/hooks'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

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
  return (
    <CenteredRow key={flag}>
      <FlagInfo>
        <Text variant="body2">{name}</Text>
        <Text variant="body4" color="$neutral2">
          {label}
        </Text>
      </FlagInfo>
      <FlagVariantSelection
        id={name}
        onChange={(e) => {
          Statsig.overrideGate(name, e.target.value === 'Enabled' ? true : false)
        }}
        value={enabled ? 'Enabled' : 'Disabled'}
      >
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
}: {
  config: Conf
  configKey: Key
  label: string
  options: any[]
  selected: any[]
  parser: (opt: string) => any
}) {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(e.target.selectedOptions, (opt) => parser(opt.value))
    Statsig.overrideConfig(config, { [configKey]: selectedValues })
  }
  return (
    <CenteredRow key={config}>
      <FlagInfo>
        <Text variant="body2">{config}</Text>
        <Text variant="body4" color="$neutral2">
          {label}
        </Text>
      </FlagInfo>
      <select multiple onChange={handleSelectChange}>
        {options.map((opt) => (
          <option key={opt} value={opt} selected={selected.includes(opt)}>
            {opt}
          </option>
        ))}
      </select>
    </CenteredRow>
  )
}

export default function FeatureFlagModal() {
  const open = useModalIsOpen(ApplicationModal.FEATURE_FLAGS)
  const closeModal = useCloseModal()

  return (
    <Modal name={ModalName.FeatureFlags} isModalOpen={open} onClose={closeModal} padding={0}>
      <Flex py="$gap20" px="$gap16" gap="$gap8">
        <CenteredRow borderBottomColor="$surface3" borderBottomWidth={1}>
          <Flex row grow alignItems="center" justifyContent="space-between">
            <Text variant="subheading2">Feature Flag Settings</Text>
            <Button
              onPress={() => {
                Statsig.removeGateOverride()
                Statsig.removeConfigOverride()
              }}
              variant="branded"
              size="small"
              fill={false}
            >
              Clear Overrides
            </Button>
          </Flex>
          <ModalCloseIcon onClose={closeModal} />
        </CenteredRow>
        <Flex maxHeight="600px" pb="$gap8" overflow="scroll" $md={{ maxHeight: 'unset' }}>
          <FeatureFlagOption flag={FeatureFlags.EmbeddedWallet} label="Add internal embedded wallet functionality" />
          <FeatureFlagOption flag={FeatureFlags.V4Swap} label="Enable v4 in the shared swap flow" />
          <FeatureFlagOption flag={FeatureFlags.UniswapX} label="[Universal Swap Flow Only] Enable UniswapX" />
          <FeatureFlagOption
            flag={FeatureFlags.IndicativeSwapQuotes}
            label="[Universal Swap Flow Only] Enable Quick Routes"
          />
          <FeatureFlagOption flag={FeatureFlags.InstantTokenBalanceUpdate} label="Instant token balance update" />
          <FeatureFlagOption
            flag={FeatureFlags.UniswapXPriorityOrdersBase}
            label="UniswapX Priority Orders (on Base)"
          />
          <FeatureFlagOption
            flag={FeatureFlags.UniswapXPriorityOrdersUnichain}
            label="UniswapX Priority Orders (on Unichain)"
          />
          <FeatureFlagOption
            flag={FeatureFlags.SharedSwapArbitrumUniswapXExperiment}
            label="[Universal Swap Flow Only] Enables receiving UniswapX orders on Arbitrum in the shared swap flow"
          />
          <FeatureFlagOption
            flag={FeatureFlags.Eip6936Enabled}
            label="Enable EIP-6963: Multi Injected Provider Discovery"
          />
          <FeatureFlagOption flag={FeatureFlags.LimitsFees} label="Enable Limits fees" />
          <FeatureFlagOption flag={FeatureFlags.V4Data} label="Enable v4 data" />
          <FeatureFlagOption flag={FeatureFlags.MigrateV3ToV4} label="Enable migrate flow from v3 -> v4" />
          <FeatureFlagOption flag={FeatureFlags.PositionPageV2} label="Enable Position Page V2" />
          <FeatureFlagOption flag={FeatureFlags.MultipleRoutingOptions} label="Enable Multiple Routing Options" />
          <FeatureFlagOption flag={FeatureFlags.NavigationHotkeys} label="Navigation hotkeys" />
          <FeatureFlagOption
            flag={FeatureFlags.TokenSelectorTrendingTokens}
            label="Enable 24h volume trending tokens in Token Selector"
          />
          <FeatureFlagOption flag={FeatureFlags.SearchRevamp} label="Enable search revamp" />
          <FeatureFlagGroup name="New Chains">
            <FeatureFlagOption flag={FeatureFlags.MonadTestnet} label="Enable Monad Testnet" />
            <FeatureFlagOption flag={FeatureFlags.Soneium} label="Enable Soneium" />
            <FeatureFlagOption flag={FeatureFlags.MonadTestnetDown} label="Enable Monad Testnet Down Banner" />
          </FeatureFlagGroup>
          <FeatureFlagOption flag={FeatureFlags.L2NFTs} label="L2 NFTs" />
          <FeatureFlagGroup name="Quick routes">
            <FeatureFlagOption flag={FeatureFlags.QuickRouteMainnet} label="Enable quick routes for Mainnet" />
            <DynamicConfigDropdown
              selected={useQuickRouteChains()}
              options={SUPPORTED_CHAIN_IDS}
              parser={Number.parseInt}
              config={DynamicConfigs.QuickRouteChains}
              configKey={QuickRouteChainsConfigKey.Chains}
              label="Enable quick routes for these chains"
            />
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
          <FeatureFlagGroup name="UniswapX Flags">
            <FeatureFlagOption flag={FeatureFlags.UniswapXSyntheticQuote} label="Force synthetic quotes for UniswapX" />
            <FeatureFlagOption flag={FeatureFlags.UniswapXv2} label="UniswapX v2" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Debug">
            <FeatureFlagOption flag={FeatureFlags.TraceJsonRpc} label="Enables JSON-RPC tracing" />
            <FeatureFlagOption flag={FeatureFlags.AATestWeb} label="A/A Test for Web" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Experiments">
            <Flex ml="$padding8">
              <ExperimentRow experiment={Experiments.SwapPresets} />
            </Flex>
          </FeatureFlagGroup>
        </Flex>
        <Button
          onPress={() => window.location.reload()}
          variant="default"
          emphasis="secondary"
          size="small"
          fill={false}
        >
          Reload
        </Button>
      </Flex>
    </Modal>
  )
}
