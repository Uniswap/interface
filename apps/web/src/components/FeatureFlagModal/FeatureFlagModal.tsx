import { SmallButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { useQuickRouteChains } from 'featureFlags/dynamicConfig/quickRouteChains'
import styled from 'lib/styled-components'
import { PropsWithChildren } from 'react'
import { X } from 'react-feather'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { BREAKPOINTS } from 'theme'
import { DynamicConfigKeys, DynamicConfigs, QuickRouteChainsConfigKey } from 'uniswap/src/features/gating/configs'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithExposureLoggingDisabled } from 'uniswap/src/features/gating/hooks'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { WEB_SUPPORTED_CHAIN_IDS } from 'uniswap/src/types/chains'

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

function DynamicConfigDropdown<Conf extends DynamicConfigs, Key extends DynamicConfigKeys[Conf]>({
  config,
  key,
  label,
  options,
  selected,
  parser,
}: {
  config: Conf
  key: Key
  label: string
  options: any[]
  selected: any[]
  parser: (opt: string) => any
}) {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(e.target.selectedOptions, (opt) => parser(opt.value))
    Statsig.overrideConfig(config, { [key]: selectedValues })
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
    <Modal isOpen={open} onDismiss={closeModal}>
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
          <FeatureFlagOption
            flag={FeatureFlags.Eip6936Enabled}
            label="Enable EIP-6963: Multi Injected Provider Discovery"
          />
          <FeatureFlagOption flag={FeatureFlags.LimitsFees} label="Enable Limits fees" />
          <FeatureFlagOption flag={FeatureFlags.CurrencyConversion} label="Enable currency conversion" />
          <FeatureFlagOption flag={FeatureFlags.ExitAnimation} label="Landing page exit animation" />
          <FeatureFlagOption flag={FeatureFlags.V2Everywhere} label="Enable V2 Everywhere" />
          <FeatureFlagOption flag={FeatureFlags.Realtime} label="Realtime activity updates" />
          <FeatureFlagOption flag={FeatureFlags.MultipleRoutingOptions} label="Enable Multiple Routing Options" />
          <FeatureFlagOption flag={FeatureFlags.NavRefresh} label="Refreshed navigation features" />
          <FeatureFlagOption flag={FeatureFlags.NavigationHotkeys} label="Navigation hotkeys" />
          <FeatureFlagOption flag={FeatureFlags.ForAggregatorWeb} label="Enable FOR aggregator web" />
          <FeatureFlagGroup name="New Chains">
            <FeatureFlagOption flag={FeatureFlags.Zora} label="Enable Zora" />
          </FeatureFlagGroup>
          <FeatureFlagOption flag={FeatureFlags.L2NFTs} label="L2 NFTs" />
          <FeatureFlagGroup name="Multichain UX">
            <FeatureFlagOption flag={FeatureFlags.MultichainUX} label="Enable Multichain Swap/Send UX" />
            <FeatureFlagOption flag={FeatureFlags.MultichainExplore} label="Enable Multichain Explore Page" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Quick routes">
            <FeatureFlagOption flag={FeatureFlags.QuickRouteMainnet} label="Enable quick routes for Mainnet" />
            <DynamicConfigDropdown
              selected={useQuickRouteChains()}
              options={WEB_SUPPORTED_CHAIN_IDS}
              parser={Number.parseInt}
              config={DynamicConfigs.QuickRouteChains}
              key={QuickRouteChainsConfigKey.Chains}
              label="Enable quick routes for these chains"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="UniswapX Flags">
            <FeatureFlagOption flag={FeatureFlags.UniswapXSyntheticQuote} label="Force synthetic quotes for UniswapX" />
            <FeatureFlagOption flag={FeatureFlags.UniswapXv2} label="UniswapX v2" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Extension">
            <FeatureFlagOption flag={FeatureFlags.ExtensionLaunch} label="General phase of go-to-market campaign" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Outage Banners">
            <FeatureFlagOption flag={FeatureFlags.OutageBannerArbitrum} label="Outage Banner for Arbitrum" />
            <FeatureFlagOption flag={FeatureFlags.OutageBannerOptimism} label="Outage Banner for Optimism" />
            <FeatureFlagOption flag={FeatureFlags.OutageBannerPolygon} label="Outage Banner for Polygon" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Debug">
            <FeatureFlagOption flag={FeatureFlags.TraceJsonRpc} label="Enables JSON-RPC tracing" />
          </FeatureFlagGroup>
        </FlagsColumn>
        <SaveButton onClick={() => window.location.reload()}>Reload</SaveButton>
      </Wrapper>
    </Modal>
  )
}
