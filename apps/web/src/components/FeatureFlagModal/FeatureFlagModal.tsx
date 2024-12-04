import { SmallButtonPrimary } from 'components/Button/buttons'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useQuickRouteChains } from 'featureFlags/dynamicConfig/quickRouteChains'
import styled from 'lib/styled-components'
import { PropsWithChildren } from 'react'
import { X } from 'react-feather'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { BREAKPOINTS } from 'theme'
import { AdaptiveWebModal } from 'ui/src'
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

const Wrapper = styled(Column)`
  padding: 20px 16px;
  width: 100%;
  gap: 8px;
`

const FlagsColumn = styled(Column)`
  max-height: 600px;
  padding-bottom: 8px;
  overflow-y: auto;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
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

const CloseButton = styled.button`
  cursor: pointer;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.neutral1};
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

const SaveButton = styled.button`
  border-radius: 12px;
  padding: 8px;
  margin: 0px 20px;
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
    <AdaptiveWebModal isOpen={open} onClose={closeModal} p={0}>
      <Wrapper>
        <Header>
          <Row width="100%" justify="space-between">
            <span>Feature Flag Settings</span>
            <SmallButtonPrimary
              onClick={() => {
                Statsig.removeGateOverride()
                Statsig.removeConfigOverride()
              }}
            >
              Clear Overrides
            </SmallButtonPrimary>
          </Row>
          <CloseButton onClick={() => closeModal()}>
            <X size={24} />
          </CloseButton>
        </Header>
        <FlagsColumn>
          <FeatureFlagOption flag={FeatureFlags.V4Swap} label="Enable v4 in the shared swap flow" />
          <FeatureFlagOption flag={FeatureFlags.UniversalSwap} label="Enable swap flow from the Uniswap Package" />
          <FeatureFlagOption flag={FeatureFlags.UniswapX} label="[Universal Swap Flow Only] Enable UniswapX" />
          <FeatureFlagOption
            flag={FeatureFlags.IndicativeSwapQuotes}
            label="[Universal Swap Flow Only] Enable Quick Routes"
          />
          <FeatureFlagOption
            flag={FeatureFlags.UniswapXPriorityOrders}
            label="UniswapX Priority Orders (on Base only)"
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
          <FeatureFlagOption flag={FeatureFlags.LPRedesign} label="Enable LP flow redesign" />
          <FeatureFlagOption flag={FeatureFlags.V4Data} label="Enable v4 data" />
          <FeatureFlagOption flag={FeatureFlags.PriceRangeInputV2} label="Enable Price Range Input V2" />
          <FeatureFlagOption flag={FeatureFlags.Realtime} label="Realtime activity updates" />
          <FeatureFlagOption flag={FeatureFlags.MultipleRoutingOptions} label="Enable Multiple Routing Options" />
          <FeatureFlagOption flag={FeatureFlags.NavigationHotkeys} label="Navigation hotkeys" />
          <FeatureFlagOption flag={FeatureFlags.TokenProtection} label="Warning UX for scam/dangerous tokens" />
          <FeatureFlagGroup name="New Chains">
            <FeatureFlagOption flag={FeatureFlags.Zora} label="Enable Zora" />
            <FeatureFlagOption flag={FeatureFlags.UnichainPromo} label="Unichain In App Promotion" />
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
          <FeatureFlagGroup name="Outage Banners">
            <FeatureFlagOption flag={FeatureFlags.OutageBannerArbitrum} label="Outage Banner for Arbitrum" />
            <FeatureFlagOption flag={FeatureFlags.OutageBannerOptimism} label="Outage Banner for Optimism" />
            <FeatureFlagOption flag={FeatureFlags.OutageBannerPolygon} label="Outage Banner for Polygon" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Debug">
            <FeatureFlagOption flag={FeatureFlags.TraceJsonRpc} label="Enables JSON-RPC tracing" />
            <FeatureFlagOption flag={FeatureFlags.AATestWeb} label="A/A Test for Web" />
          </FeatureFlagGroup>
        </FlagsColumn>
        <SaveButton onClick={() => window.location.reload()}>Reload</SaveButton>
      </Wrapper>
    </AdaptiveWebModal>
  )
}
