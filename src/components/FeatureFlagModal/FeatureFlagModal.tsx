import { useUpdateFlag } from 'featureFlags'
import { Phase0Variant, usePhase0Flag } from 'featureFlags/flags/phase0'
import { useRef } from 'react'
import { X } from 'react-feather'
import { useModalIsOpen, useToggleFeatureFlags } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components/macro'

const ModalCard = styled.div<{ open: boolean }>`
  position: fixed;
  display: ${({ open }) => (open ? 'flex' : 'none')};
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
const FeatureFlagRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0px;
`

const CloseWrapper = styled.span`
  cursor: pointer;
`
const HeaderRow = styled(FeatureFlagRow)`
  font-weight: 600;
  font-size: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin-bottom: 8px;
`

function FeatureFlagOption({ option }: { option: string }) {
  return <option value={option}>{option}</option>
}

export default function FeatureFlagModal() {
  const node = useRef<HTMLDivElement>()
  const open = useModalIsOpen(ApplicationModal.FEATURE_FLAGS)
  const toggle = useToggleFeatureFlags()

  const updateFlag = useUpdateFlag()

  const phase0Variant = usePhase0Flag()

  return (
    <ModalCard open={open} ref={node as any}>
      <HeaderRow>
        Feature Flag Settings
        <CloseWrapper onClick={toggle}>
          <X size={24} />
        </CloseWrapper>
      </HeaderRow>

      <FeatureFlagRow>
        {'Phase 0'}:
        <select
          id={'phase0'}
          value={phase0Variant}
          onChange={(e) => {
            updateFlag('phase0', e.target.value)
          }}
        >
          {Object.values(Phase0Variant).map((variant) => (
            <FeatureFlagOption key={variant} option={variant} />
          ))}
        </select>
      </FeatureFlagRow>
    </ModalCard>
  )
}
