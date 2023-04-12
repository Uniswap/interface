import { BaseVariant, FeatureFlag, featureFlagSettings, useUpdateFlag } from 'featureFlags'
import { MgtmVariant, useMgtmFlag } from 'featureFlags/flags/mgtm'
import { useMiniPortfolioFlag } from 'featureFlags/flags/miniPortfolio'
import { NftGraphqlVariant, useNftGraphqlFlag } from 'featureFlags/flags/nftlGraphql'
import { PayWithAnyTokenVariant, usePayWithAnyTokenFlag } from 'featureFlags/flags/payWithAnyToken'
import { SwapWidgetVariant, useSwapWidgetFlag } from 'featureFlags/flags/swapWidget'
import { TraceJsonRpcVariant, useTraceJsonRpcFlag } from 'featureFlags/flags/traceJsonRpc'
import { useUpdateAtom } from 'jotai/utils'
import { Children, PropsWithChildren, ReactElement, ReactNode, useCallback, useState } from 'react'
import { X } from 'react-feather'
import { useModalIsOpen, useToggleFeatureFlags } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components/macro'

const StyledModal = styled.div`
  position: fixed;
  display: flex;
  left: 50%;
  top: 50vh;
  transform: translate(-50%, -50%);
  width: 400px;
  height: fit-content;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 18px;
  padding: 20px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  z-index: 100;
  flex-direction: column;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`

function Modal({ open, children }: { open: boolean; children: ReactNode }) {
  return open ? <StyledModal>{children}</StyledModal> : null
}

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
  color: ${({ theme }) => theme.textPrimary};
`

const ToggleButton = styled.button`
  cursor: pointer;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.textPrimary};
`

const Header = styled(Row)`
  font-weight: 600;
  font-size: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin-bottom: 8px;
`
const FlagName = styled.span`
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.textPrimary};
`
const FlagGroupName = styled.span`
  font-size: 20px;
  line-height: 24px;
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 600;
`
const FlagDescription = styled.span`
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  align-items: center;
`
const FlagVariantSelection = styled.select`
  border-radius: 12px;
  padding: 8px;
  background: ${({ theme }) => theme.backgroundInteractive};
  font-weight: 600;
  font-size: 16px;
  border: none;
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;

  :hover {
    background: ${({ theme }) => theme.backgroundOutline};
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
  background: ${({ theme }) => theme.backgroundInteractive};
  font-weight: 600;
  font-size: 16px;
  border: none;
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;

  :hover {
    background: ${({ theme }) => theme.backgroundOutline};
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

export default function FeatureFlagModal() {
  const open = useModalIsOpen(ApplicationModal.FEATURE_FLAGS)
  const toggle = useToggleFeatureFlags()

  return (
    <Modal open={open}>
      <Header>
        Feature Flag Settings
        <CloseButton onClick={toggle}>
          <X size={24} />
        </CloseButton>
      </Header>
      <FeatureFlagOption
        variant={MgtmVariant}
        value={useMgtmFlag()}
        featureFlag={FeatureFlag.mgtm}
        label="Mobile Wallet go-to-market assets"
      />
      <FeatureFlagOption
        variant={BaseVariant}
        value={useMiniPortfolioFlag()}
        featureFlag={FeatureFlag.miniPortfolio}
        label="MiniPortfolio"
      />
      <FeatureFlagOption
        variant={PayWithAnyTokenVariant}
        value={usePayWithAnyTokenFlag()}
        featureFlag={FeatureFlag.payWithAnyToken}
        label="Pay With Any Token"
      />
      <FeatureFlagOption
        variant={SwapWidgetVariant}
        value={useSwapWidgetFlag()}
        featureFlag={FeatureFlag.swapWidget}
        label="Swap Widget"
      />
      <FeatureFlagOption
        variant={NftGraphqlVariant}
        value={useNftGraphqlFlag()}
        featureFlag={FeatureFlag.nftGraphql}
        label="Migrate NFT read endpoints to GQL"
      />
      <FeatureFlagGroup name="Debug">
        <FeatureFlagOption
          variant={TraceJsonRpcVariant}
          value={useTraceJsonRpcFlag()}
          featureFlag={FeatureFlag.traceJsonRpc}
          label="Enables JSON-RPC tracing"
        />
      </FeatureFlagGroup>
      <SaveButton onClick={() => window.location.reload()}>Reload</SaveButton>
    </Modal>
  )
}
