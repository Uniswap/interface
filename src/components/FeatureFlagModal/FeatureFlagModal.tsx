import { FeatureFlag, featureFlagSettings, useUpdateFlag } from 'featureFlags'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import { NftVariant, useNftFlag } from 'featureFlags/flags/nft'
import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import { TokensVariant, useTokensFlag } from 'featureFlags/flags/tokens'
import { TokenSafetyVariant, useTokenSafetyFlag } from 'featureFlags/flags/tokenSafety'
import { useWalletFlag, WalletVariant } from 'featureFlags/flags/wallet'
import { useAtomValue } from 'jotai/utils'
import { ReactNode, useState } from 'react'
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
  background: 'transparent';
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
  padding-left: 8px;
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

function FeatureFlagOption({
  variants,
  featureFlag,
  value,
  label,
}: {
  variants: string[]
  featureFlag: FeatureFlag
  value: string
  label: string
}) {
  const updateFlag = useUpdateFlag()
  const [count, setCount] = useState(0)
  const featureFlags = useAtomValue(featureFlagSettings)

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
        value={featureFlags[featureFlag]}
      >
        {variants.map((variant) => (
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
      <FlagGroupName>Phase 1</FlagGroupName>
      <FeatureFlagOption
        variants={Object.values(NftVariant)}
        value={useNftFlag()}
        featureFlag={FeatureFlag.nft}
        label="NFTs"
      />
      <FlagGroupName>Phase 0</FlagGroupName>
      <FeatureFlagOption
        variants={Object.values(RedesignVariant)}
        value={useRedesignFlag()}
        featureFlag={FeatureFlag.redesign}
        label="Redesign"
      />
      <FeatureFlagOption
        variants={Object.values(NavBarVariant)}
        value={useNavBarFlag()}
        featureFlag={FeatureFlag.navBar}
        label="NavBar"
      />
      <FeatureFlagOption
        variants={Object.values(TokensVariant)}
        value={useTokensFlag()}
        featureFlag={FeatureFlag.tokens}
        label="Tokens"
      />
      <FeatureFlagOption
        variants={Object.values(TokenSafetyVariant)}
        value={useTokenSafetyFlag()}
        featureFlag={FeatureFlag.tokenSafety}
        label="Token Safety"
      />
      <FeatureFlagOption
        variants={Object.values(WalletVariant)}
        value={useWalletFlag()}
        featureFlag={FeatureFlag.wallet}
        label="Wallet Flag"
      />
      <SaveButton onClick={() => window.location.reload()}>Save Settings</SaveButton>
    </Modal>
  )
}
