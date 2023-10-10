import { ChainId } from '@uniswap/sdk-core'
import Column from 'components/Column'
import { BaseVariant, FeatureFlag, featureFlagSettings, useUpdateConfig, useUpdateFlag } from 'featureFlags'
import { DynamicConfigName } from 'featureFlags/dynamicConfig'
import { useQuickRouteChains } from 'featureFlags/dynamicConfig/quickRouteChains'
import { useCurrencyConversionFlag } from 'featureFlags/flags/currencyConversion'
import { useFallbackProviderEnabledFlag } from 'featureFlags/flags/fallbackProvider'
import { useFotAdjustmentsFlag } from 'featureFlags/flags/fotAdjustments'
import { useInfoExploreFlag } from 'featureFlags/flags/infoExplore'
import { useInfoLiveViewsFlag } from 'featureFlags/flags/infoLiveViews'
import { useInfoPoolPageFlag } from 'featureFlags/flags/infoPoolPage'
import { useInfoTDPFlag } from 'featureFlags/flags/infoTDP'
import { useMultichainUXFlag } from 'featureFlags/flags/multichainUx'
import { useQuickRouteMainnetFlag } from 'featureFlags/flags/quickRouteMainnet'
import { TraceJsonRpcVariant, useTraceJsonRpcFlag } from 'featureFlags/flags/traceJsonRpc'
import { useUniswapXDefaultEnabledFlag } from 'featureFlags/flags/uniswapXDefault'
import { useUniswapXEthOutputFlag } from 'featureFlags/flags/uniswapXEthOutput'
import { useUniswapXExactOutputFlag } from 'featureFlags/flags/uniswapXExactOutput'
import { useUniswapXSyntheticQuoteFlag } from 'featureFlags/flags/uniswapXUseSyntheticQuote'
import { useUpdateAtom } from 'jotai/utils'
import { Children, PropsWithChildren, ReactElement, ReactNode, useCallback, useState } from 'react'
import { X } from 'react-feather'
import { useModalIsOpen, useToggleFeatureFlags } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'

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
  z-index: 100;
  flex-direction: column;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.surface3};

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    max-height: 100vh;
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

const ToggleButton = styled.button`
  cursor: pointer;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.neutral1};
`

const Header = styled(Row)`
  font-weight: 535;
  font-size: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
  margin-bottom: 8px;
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

function Variant({ option }: { option: string }) {
  return <option value={option}>{option}</option>
}

interface FeatureFlagProps {
  variant: Record<string, string>
  featureFlag: FeatureFlag
  value: string
  label: string
}

function FeatureFlagGroup({ name, children }: PropsWithChildren<{ name: string }>) {
  // type FeatureFlagOption = { props: FeatureFlagProps }
  const togglableOptions = Children.toArray(children)
    .filter<ReactElement<FeatureFlagProps>>(
      (child): child is ReactElement<FeatureFlagProps> =>
        child instanceof Object && 'type' in child && child.type === FeatureFlagOption
    )
    .map(({ props }) => props)
    .filter(({ variant }) => {
      const values = Object.values(variant)
      return values.includes(BaseVariant.Control) && values.includes(BaseVariant.Enabled)
    })

  const setFeatureFlags = useUpdateAtom(featureFlagSettings)
  const allEnabled = togglableOptions.every(({ value }) => value === BaseVariant.Enabled)
  const onToggle = useCallback(() => {
    setFeatureFlags((flags) => ({
      ...flags,
      ...togglableOptions.reduce(
        (flags, { featureFlag }) => ({
          ...flags,
          [featureFlag]: allEnabled ? BaseVariant.Control : BaseVariant.Enabled,
        }),
        {}
      ),
    }))
  }, [allEnabled, setFeatureFlags, togglableOptions])

  return (
    <>
      <Row key={name}>
        <FlagGroupName>{name}</FlagGroupName>
        <ToggleButton onClick={onToggle}>{allEnabled ? 'Disable' : 'Enable'} group</ToggleButton>
      </Row>
      {children}
    </>
  )
}

function FeatureFlagOption({ value, variant, featureFlag, label }: FeatureFlagProps) {
  const updateFlag = useUpdateFlag()
  const [count, setCount] = useState(0)

  return (
    <Row key={featureFlag}>
      <FlagInfo>
        <FlagName>{featureFlag}</FlagName>
        <FlagDescription>{label}</FlagDescription>
      </FlagInfo>
      <FlagVariantSelection
        id={featureFlag}
        onChange={(e) => {
          updateFlag(featureFlag, e.target.value)
          setCount(count + 1)
        }}
        value={value}
      >
        {Object.values(variant).map((variant) => (
          <Variant key={variant} option={variant} />
        ))}
      </FlagVariantSelection>
    </Row>
  )
}

interface DynamicConfigDropdownProps {
  configName: DynamicConfigName
  label: string
  options: any[]
  selected: any[]
  parser: (opt: string) => any
}

function DynamicConfigDropdown({ configName, label, options, selected, parser }: DynamicConfigDropdownProps) {
  const updateConfig = useUpdateConfig()
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(e.target.selectedOptions, (opt) => parser(opt.value))
    // Saved to atom as { [configName]: { [configName]: values } } to match Statsig return format
    updateConfig(configName, { [configName]: selectedValues })
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
      <FlagsColumn>
        <Header>
          Feature Flag Settings
          <CloseButton onClick={toggleModal}>
            <X size={24} />
          </CloseButton>
        </Header>
        <FeatureFlagOption
          variant={BaseVariant}
          value={useFallbackProviderEnabledFlag()}
          featureFlag={FeatureFlag.fallbackProvider}
          label="Enable fallback provider"
        />
        <FeatureFlagOption
          variant={BaseVariant}
          value={useCurrencyConversionFlag()}
          featureFlag={FeatureFlag.currencyConversion}
          label="Enable currency conversion"
        />
        <FeatureFlagOption
          variant={BaseVariant}
          value={useMultichainUXFlag()}
          featureFlag={FeatureFlag.multichainUX}
          label="Updated Multichain UX"
        />
        <FeatureFlagOption
          variant={BaseVariant}
          value={useFotAdjustmentsFlag()}
          featureFlag={FeatureFlag.fotAdjustedmentsEnabled}
          label="Enable fee-on-transfer UI and slippage adjustments"
        />
        <FeatureFlagGroup name="Quick routes">
          <FeatureFlagOption
            variant={BaseVariant}
            value={useQuickRouteMainnetFlag()}
            featureFlag={FeatureFlag.quickRouteMainnet}
            label="Enable quick routes for Mainnet"
          />
          <DynamicConfigDropdown
            selected={useQuickRouteChains()}
            options={Object.values(ChainId).filter((v) => !isNaN(Number(v))) as ChainId[]}
            parser={Number.parseInt}
            configName={DynamicConfigName.quickRouteChains}
            label="Enable quick routes for these chains"
          />
        </FeatureFlagGroup>
        <FeatureFlagGroup name="UniswapX Flags">
          <FeatureFlagOption
            variant={BaseVariant}
            value={useUniswapXSyntheticQuoteFlag()}
            featureFlag={FeatureFlag.uniswapXSyntheticQuote}
            label="Force synthetic quotes for UniswapX"
          />
          <FeatureFlagOption
            variant={BaseVariant}
            value={useUniswapXEthOutputFlag()}
            featureFlag={FeatureFlag.uniswapXEthOutputEnabled}
            label="Enable eth output for UniswapX orders"
          />
          <FeatureFlagOption
            variant={BaseVariant}
            value={useUniswapXExactOutputFlag()}
            featureFlag={FeatureFlag.uniswapXExactOutputEnabled}
            label="Enable exact output for UniswapX orders"
          />
          <FeatureFlagOption
            variant={BaseVariant}
            value={useUniswapXDefaultEnabledFlag()}
            featureFlag={FeatureFlag.uniswapXDefaultEnabled}
            label="Enable UniswapX by default"
          />
        </FeatureFlagGroup>
        <FeatureFlagGroup name="Info Site Migration">
          <FeatureFlagOption
            variant={BaseVariant}
            value={useInfoExploreFlag()}
            featureFlag={FeatureFlag.infoExplore}
            label="Info site migration - Updating Token Explore Page"
          />
          <FeatureFlagOption
            variant={BaseVariant}
            value={useInfoTDPFlag()}
            featureFlag={FeatureFlag.infoTDP}
            label="Info site migration - Updating Token Details Page"
          />
          <FeatureFlagOption
            variant={BaseVariant}
            value={useInfoPoolPageFlag()}
            featureFlag={FeatureFlag.infoPoolPage}
            label="Info site migration - Adding Pool Details Page"
          />
          <FeatureFlagOption
            variant={BaseVariant}
            value={useInfoLiveViewsFlag()}
            featureFlag={FeatureFlag.infoLiveViews}
            label="Info site migration - Support live view graphs"
          />
        </FeatureFlagGroup>
        <FeatureFlagGroup name="Debug">
          <FeatureFlagOption
            variant={TraceJsonRpcVariant}
            value={useTraceJsonRpcFlag()}
            featureFlag={FeatureFlag.traceJsonRpc}
            label="Enables JSON-RPC tracing"
          />
        </FeatureFlagGroup>
      </FlagsColumn>
      <SaveButton onClick={() => window.location.reload()}>Reload</SaveButton>
    </Modal>
  )
}
