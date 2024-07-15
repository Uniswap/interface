import Loader from 'components/Icons/LoadingSpinner'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { getChain, useSupportedChainId } from 'constants/chains'
import { Trans } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { Check } from 'react-feather'
import { useSwapAndLimitContext } from 'state/swap/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { InterfaceChainId } from 'uniswap/src/types/chains'

const LOGO_SIZE = 20

const Container = styled.button<{ $disabled: boolean }>`
  align-items: center;
  background: none;
  border: none;
  border-radius: 12px;
  color: ${({ theme }) => theme.neutral1};
  cursor: ${({ $disabled }) => ($disabled ? 'auto' : 'pointer')};
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  justify-content: space-between;
  line-height: 20px;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  padding: 10px 8px;
  text-align: left;
  outline: none;
  transition: ${({ theme }) => theme.transition.duration.medium} ${({ theme }) => theme.transition.timing.ease}
    background-color;
  width: 100%;

  &:hover {
    background-color: ${({ $disabled, theme }) => ($disabled ? 'none' : theme.surface3)};
  }
`
const Label = styled.div`
  grid-column: 2;
  grid-row: 1;
  font-size: 16px;
  font-weight: 485;
`
const Status = styled.div`
  grid-column: 3;
  grid-row: 1;
  display: flex;
  align-items: center;
  width: ${LOGO_SIZE}px;
`
const CaptionText = styled.div`
  color: ${({ theme }) => theme.neutral2};
  font-size: 12px;
  grid-column: 2;
  grid-row: 2;
`

interface ChainSelectorRowProps {
  disabled?: boolean
  targetChain: InterfaceChainId
  onSelectChain: (targetChain: number) => void
  isPending: boolean
}
export default function ChainSelectorRow({ disabled, targetChain, onSelectChain, isPending }: ChainSelectorRowProps) {
  const theme = useTheme()
  const { chainId } = useSwapAndLimitContext()
  const supportedChain = useSupportedChainId(targetChain)
  const active = chainId === targetChain

  const chainInfo = getChain({ chainId: supportedChain })
  const label = chainInfo?.label

  return (
    <Trace logPress section={SectionName.ChainSelector} element={chainInfo?.elementName}>
      <Container
        data-testid={`${label}-selector`}
        $disabled={!!disabled}
        onClick={() => {
          if (!disabled) {
            onSelectChain(targetChain)
          }
        }}
      >
        <ChainLogo chainId={targetChain} size={LOGO_SIZE} style={{ marginRight: '12px' }} />
        {label && <Label>{label}</Label>}
        {disabled && (
          <CaptionText>
            <Trans i18nKey="common.wallet.unsupported" />
          </CaptionText>
        )}
        {isPending && (
          <CaptionText>
            <Trans i18nKey="common.wallet.approve" />
          </CaptionText>
        )}
        <Status>
          {active && <Check width={LOGO_SIZE} height={LOGO_SIZE} color={theme.accent1} />}
          {!active && isPending && <Loader width={LOGO_SIZE} height={LOGO_SIZE} />}
        </Status>
      </Container>
    </Trace>
  )
}
