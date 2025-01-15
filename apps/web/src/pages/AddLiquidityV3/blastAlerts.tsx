import { Dialog, DialogButtonType } from 'components/Dialog/Dialog'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { useCallback, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
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
          <Trans i18nKey="v3.rebase.unavailable" />
        </ThemedText.HeadlineMedium>
      }
      description={<Trans i18nKey="v3.blast.yield.usdbAndWeth" />}
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
          title: <Trans i18nKey="v3.continue" />,
          onClick: onContinue,
        },
        right: {
          title: <Trans i18nKey="v2.switchTo" />,
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
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const handleSetExpanded = useCallback(() => setExpanded(!expanded), [expanded])

  return (
    <AlertContainer>
      <AlertIconContainer>
        <StyledAlertIcon size="20px" />
      </AlertIconContainer>
      <Column gap="xs">
        <ThemedText.SubHeader lineHeight="24px">
          <Trans i18nKey="v3.rebase.unavailable" />
        </ThemedText.SubHeader>
        <TextWrapper lineHeight="20px" $expanded={expanded}>
          <Trans i18nKey="v3.blast.yield.usdbAndWeth" />{' '}
          <StyledLearnMore href="https://support.uniswap.org/hc/en-us/articles/25351747812109-Blast-Rebase-Tokens">
            <ThemedText.SubHeaderSmall fontWeight={535} lineHeight="20px" color="neutral1">
              <Trans i18nKey="common.button.learn" />
            </ThemedText.SubHeaderSmall>
          </StyledLearnMore>
        </TextWrapper>
        <ReadMore onClick={handleSetExpanded}>
          <ThemedText.SubHeaderSmall lineHeight="20px" fontWeight={535}>
            {expanded ? t('common.longText.button.less') : t('common.longText.button.more')}
          </ThemedText.SubHeaderSmall>
          <StyledChevronDown $expanded={expanded} size={16} />
        </ReadMore>
      </Column>
    </AlertContainer>
  )
}
