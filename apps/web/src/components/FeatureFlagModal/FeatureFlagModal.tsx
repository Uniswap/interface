import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useQuickRouteChains } from 'featureFlags/dynamicConfig/quickRouteChains'
import styled from 'lib/styled-components'
import { PropsWithChildren } from 'react'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { Button, ModalCloseIcon } from 'ui/src'
import { breakpoints } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/chains/types'
import {
  DynamicConfigKeys,
  DynamicConfigs,
  NetworkRequestsConfigKey,
  QuickRouteChainsConfigKey,
} from 'uniswap/src/features/gating/configs'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithExposureLoggingDisabled } from 'uniswap/src/features/gating/hooks'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const Wrapper = styled(Column)`
  padding: 20px 16px;
  width: 100%;
  gap: 8px;
`

const FlagsColumn = styled(Column)`
  max-height: 600px;
  padding-bottom: 8px;
  overflow-y: auto;

  @media screen and (max-width: ${breakpoints.md}px) {
    max-height: unset;
  }
`

const CenteredRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0px;
  max-width: 100%;
  gap: 4px;
`

const Header = styled(CenteredRow)`
  font-weight: 535;
  font-size: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
  justify-content: space-between;
`
const FlagName = styled.span`
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.neutral1};
`
const FlagGroupName = styled.span`
  font-size: 20px;
  line-height: 24px;
  color: ${({ theme }) => theme.neutral1};
  font-weight: 535;
`
const FlagDescription = styled.span`
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.neutral2};
  display: flex;
  align-items: center;
`

const FlagInfo = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 8px;
  flex-shrink: 1;
  overflow: hidden;
`

interface FeatureFlagProps {
  label: string
  flag: FeatureFlags
}

function FeatureFlagGroup({ name, children }: PropsWithChildren<{ name: string }>) {
  return (
    <>
      <CenteredRow key={name}>
        <FlagGroupName>{name}</FlagGroupName>
      </CenteredRow>
      {children}
    </>
  )
}

const FlagVariantSelection = styled.select`
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
        <FlagName>{name}</FlagName>
        <FlagDescription>{label}</FlagDescription>
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
        <FlagName>{config}</FlagName>
        <FlagDescription>{label}</FlagDescription>
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
      <Wrapper>
        <Header>
          <Row width="100%" justify="space-between">
            <span>Feature Flag Settings</span>
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
          </Row>
          <ModalCloseIcon onClose={closeModal} />
        </Header>
        <FlagsColumn>
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
          <FeatureFlagOption flag={FeatureFlags.SwapPresets} label="Enable swap presets" />
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
        </FlagsColumn>
        <Button onPress={() => window.location.reload()} variant="default" emphasis="secondary" size="small">
          Reload
        </Button>
      </Wrapper>
    </Modal>
  )
}
