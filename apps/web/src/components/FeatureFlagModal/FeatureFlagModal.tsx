import { ChainId } from '@uniswap/sdk-core'
import { SmallButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import { QUICK_ROUTE_CONFIG_KEY, useQuickRouteChains } from 'featureFlags/dynamicConfig/quickRouteChains'
import { PropsWithChildren, ReactNode } from 'react'
import { X } from 'react-feather'
import { useModalIsOpen, useToggleFeatureFlags } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import { DynamicConfigs, getConfigName } from 'uniswap/src/features/gating/configs'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithExposureLoggingDisabled } from 'uniswap/src/features/gating/hooks'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'

const StyledModal = styled.div`
  position: fixed;
  display: flex;
  left: 50%;
  top: 50vh;
  transform: translate(-50%, -50%);
  width: 400px;
  height: fit-content;
  color: ${({ theme }) => theme.neutral1};
  font-size: 18px;
  padding: 20px 0px;
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  z-index: ${Z_INDEX.modal};
  flex-direction: column;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.surface3};

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    max-height: 80vh;
  }
`

function Modal({ open, children }: { open: boolean; children: ReactNode }) {
  return open ? <StyledModal>{children}</StyledModal> : null
}

const FlagsColumn = styled(Column)`
  max-height: 600px;
  overflow-y: auto;
  padding: 0px 20px;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    max-height: unset;
  }
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0px;
`

const CloseButton = styled.button`
  cursor: pointer;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.neutral1};
`

const Header = styled(Row)`
  padding: 0px 16px 8px;
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
      <Row key={name}>
        <FlagGroupName>{name}</FlagGroupName>
      </Row>
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
    <Row key={flag}>
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
    </Row>
  )
}

interface DynamicConfigDropdownProps {
  config: DynamicConfigs
  label: string
  options: any[]
  selected: any[]
  parser: (opt: string) => any
}

function DynamicConfigDropdown({ config, label, options, selected, parser }: DynamicConfigDropdownProps) {
  const configName = getConfigName(config)
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(e.target.selectedOptions, (opt) => parser(opt.value))
    Statsig.overrideConfig(configName, { [QUICK_ROUTE_CONFIG_KEY]: selectedValues })
  }
  return (
    <Row key={configName}>
      <FlagInfo>
        <FlagName>{configName}</FlagName>
        <FlagDescription>{label}</FlagDescription>
      </FlagInfo>
      <select multiple onChange={handleSelectChange}>
        {options.map((opt) => (
          <option key={opt} value={opt} selected={selected.includes(opt)}>
            {opt}
          </option>
        ))}
      </select>
    </Row>
  )
}

export default function FeatureFlagModal() {
  const open = useModalIsOpen(ApplicationModal.FEATURE_FLAGS)
  const toggleModal = useToggleFeatureFlags()

  return (
    <Modal open={open}>
      <Header>
        <span>Feature Flag Settings</span>
        <SmallButtonPrimary
          onClick={() => {
            Statsig.removeGateOverride()
            Statsig.removeConfigOverride()
          }}
        >
          Clear Overrides
        </SmallButtonPrimary>
        <CloseButton onClick={toggleModal}>
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
        <FeatureFlagOption flag={FeatureFlags.UniconsV2} label="Unicon V2" />
        <FeatureFlagOption flag={FeatureFlags.ExitAnimation} label="Landing page exit animation" />
        <FeatureFlagOption flag={FeatureFlags.V2Everywhere} label="Enable V2 Everywhere" />
        <FeatureFlagOption flag={FeatureFlags.V2Explore} label="Enable V2 Explore Data" />
        <FeatureFlagOption flag={FeatureFlags.Realtime} label="Realtime activity updates" />
        <FeatureFlagOption flag={FeatureFlags.MultipleRoutingOptions} label="Enable Multiple Routing Options" />
        <FeatureFlagOption flag={FeatureFlags.MultichainUX} label="Enable Multichain Swap/Send UX" />
        <FeatureFlagGroup name="Quick routes">
          <FeatureFlagOption flag={FeatureFlags.QuickRouteMainnet} label="Enable quick routes for Mainnet" />
          <DynamicConfigDropdown
            selected={useQuickRouteChains()}
            options={Object.values(ChainId).filter((v) => !isNaN(Number(v))) as ChainId[]}
            parser={Number.parseInt}
            config={DynamicConfigs.QuickRouteChains}
            label="Enable quick routes for these chains"
          />
        </FeatureFlagGroup>
        <FeatureFlagGroup name="UniswapX Flags">
          <FeatureFlagOption flag={FeatureFlags.UniswapXSyntheticQuote} label="Force synthetic quotes for UniswapX" />
          <FeatureFlagOption flag={FeatureFlags.UniswapXv2} label="UniswapX v2" />
        </FeatureFlagGroup>
        <FeatureFlagGroup name="Extension">
          <FeatureFlagOption flag={FeatureFlags.ExtensionBetaLaunch} label="Beta phase of go-to-market campaign" />
          <FeatureFlagOption
            flag={FeatureFlags.ExtensionGeneralLaunch}
            label="General phase of go-to-market campaign"
          />
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
    </Modal>
  )
}
