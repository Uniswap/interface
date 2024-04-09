import Column from 'components/Column'
import { Dialog, DialogButtonType } from 'components/Dialog/Dialog'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import Row from 'components/Row'
import { Trans, t } from 'i18n'
import { useCallback, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { ButtonText, ExternalLink, ThemedText } from 'theme/components'

const StyledAlertIcon = styled(AlertTriangleFilled)`
  path {
    fill: ${({ theme }) => theme.neutral2};
  }
`

const AlertContainer = styled(Row)`
  background-color: ${({ theme }) => theme.surface2};
  padding: 12px;
  border-radius: 20px;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
`

const AlertIconContainer = styled.div`
  display: flex;
  flex-shrink: 0;
  background-color: ${({ theme }) => theme.surface3};
  width: 40px;
  height: 40px;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
`

const StyledLearnMore = styled(ExternalLink)`
  display: inline-block;
`

interface BlastRebasingModalProps {
  currencyIdA?: string
  currencyIdB?: string
  onContinue: () => void
}

export function BlastRebasingModal({ currencyIdA, currencyIdB, onContinue }: BlastRebasingModalProps) {
  const navigate = useNavigate()

  return (
    <Dialog
      isVisible={true}
      icon={<StyledAlertIcon size="28px" />}
      title={
        <ThemedText.HeadlineMedium fontSize="24px">
          <Trans>Rebasing is unavailable on v3</Trans>
        </ThemedText.HeadlineMedium>
      }
      description={
        <Trans>
          On Blast, USDB and WETH are rebasing tokens that automatically earn yield. Due to incompatibility with Uniswap
          v3, LP positions with USDB or WETH won&apos;t earn rebasing yield, but will in Uniswap v2.
        </Trans>
      }
      body={
        <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/25351747812109-Blast-Rebase-Tokens">
          <ThemedText.BodyPrimary fontWeight={535} lineHeight="24px">
            Learn more
          </ThemedText.BodyPrimary>
        </ExternalLink>
      }
      onCancel={onContinue}
      buttonsConfig={{
        left: {
          title: <Trans>Continue on v3</Trans>,
          onClick: onContinue,
        },
        right: {
          title: <Trans>Switch to v2</Trans>,
          onClick: () => navigate(`/add/v2/${currencyIdA ?? 'ETH'}/${currencyIdB ?? ''}`),
          type: DialogButtonType.Accent,
        },
        gap: 'sm',
      }}
    />
  )
}

const TextWrapper = styled(ThemedText.SubHeaderSmall)<{ $expanded: boolean }>`
  display: -webkit-box;
  -webkit-line-clamp: ${({ $expanded }) => ($expanded ? 'none' : 2)};
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const ReadMore = styled(ButtonText)`
  display: flex;
  color: ${({ theme }) => theme.neutral2};
  justify-content: flex-start;
  gap: 4px;
  align-items: center;

  :focus {
    text-decoration: none;
  }
`

const StyledChevronDown = styled(ChevronDown)<{ $expanded: boolean }>`
  transform: ${({ $expanded }) => $expanded && 'rotate(-180deg)'};
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `transform ${duration.fast} ${timing.inOut}`};
`

export function BlastRebasingAlert() {
  const [expanded, setExpanded] = useState(false)
  const handleSetExpanded = useCallback(() => setExpanded(!expanded), [expanded])

  return (
    <AlertContainer>
      <AlertIconContainer>
        <StyledAlertIcon size="20px" />
      </AlertIconContainer>
      <Column gap="xs">
        <ThemedText.SubHeader lineHeight="24px">
          <Trans>Rebasing unavailable on v3</Trans>
        </ThemedText.SubHeader>
        <TextWrapper lineHeight="20px" $expanded={expanded}>
          <Trans>
            On Blast, USDB and WETH are rebasing tokens that automatically earn yield. Due to incompatibility with
            Uniswap v3, LP positions with USDB or WETH won&apos;t earn rebasing yield, but will in Uniswap v2.
          </Trans>{' '}
          <StyledLearnMore href="https://support.uniswap.org/hc/en-us/articles/25351747812109-Blast-Rebase-Tokens">
            <ThemedText.SubHeaderSmall fontWeight={535} lineHeight="20px" color="neutral1">
              <Trans>Learn more</Trans>
            </ThemedText.SubHeaderSmall>
          </StyledLearnMore>
        </TextWrapper>
        <ReadMore onClick={handleSetExpanded}>
          <ThemedText.SubHeaderSmall lineHeight="20px" fontWeight={535}>
            {expanded ? t('Read less') : t('Read more')}
          </ThemedText.SubHeaderSmall>
          <StyledChevronDown $expanded={expanded} size={16} />
        </ReadMore>
      </Column>
    </AlertContainer>
  )
}
