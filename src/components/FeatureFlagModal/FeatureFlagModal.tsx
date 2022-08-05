import styled from 'styled-components/macro'

const ModalCard = styled.div<{ open: boolean }>`
  position: fixed;
  display: ${({ open }) => (open ? 'flex' : 'none')};
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: fit-content;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 16px;
  padding: 20px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  z-index: 100;
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  width: 100vw;
  height: 100vh;
  background-color: ${({ theme }) => theme.backgroundScrim};
  display: none;
`
const FeatureFlagRow = styled.div`
  display: flex;
`

export default function FeatureFlagModal() {
  return <ModalCard>Feature Flag Settings</ModalCard>
}
