import { FeatureFlag, useUpdateFlag } from 'featureFlags'
import { Phase0Variant, usePhase0Flag } from 'featureFlags/flags/phase0'
import { ReactNode } from 'react'
import { X } from 'react-feather'
import { useModalIsOpen, useToggleFeatureFlags } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components/macro'

const StyledModal = styled.div`
  position: fixed;
  display: flex;
  left: 50%;
  top: 50%;
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
  background: ${({ theme }) => theme.none};
  border: none;
  color: ${({ theme }) => theme.textPrimary};
`

const Header = styled(Row)`
  font-weight: 600;
  font-size: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin-bottom: 8px;
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
  return (
    <Row key={featureFlag}>
      {featureFlag}: {label}
      <select
        id={featureFlag}
        value={value}
        onChange={(e) => {
          updateFlag(featureFlag, e.target.value)
          window.location.reload()
        }}
      >
        {variants.map((variant) => (
          <Variant key={variant} option={variant} />
        ))}
      </select>
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
        variants={Object.values(Phase0Variant)}
        value={usePhase0Flag()}
        featureFlag={FeatureFlag.phase0}
        label="All Phase 0 changes (redesign, explore, header)."
      />
    </Modal>
  )
}
