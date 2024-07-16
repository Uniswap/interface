// eslint-disable-next-line no-restricted-imports
import { ResizingTextArea, TextInput } from 'components/TextInput'
import { Trans, t } from 'i18n'
import styled from 'lib/styled-components'
import { memo } from 'react'
import { Text } from 'rebass'

const ProposalEditorHeader = styled(Text)`
  font-size: 14px;
  font-weight: 535;
  color: ${({ theme }) => theme.neutral2};
`

const ProposalTitle = memo(styled(TextInput)`
  margin-top: 10.5px;
  margin-bottom: 7.5px;
`)

const ProposalEditorContainer = styled.div`
  margin-top: 10px;
  padding: 0.75rem 1rem 0.75rem 1rem;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
  background-color: ${({ theme }) => theme.surface1};
`

export const ProposalEditor = ({
  className,
  title,
  body,
  onTitleInput,
  onBodyInput,
}: {
  className?: string
  title: string
  body: string
  onTitleInput: (title: string) => void
  onBodyInput: (body: string) => void
}) => {
  const bodyPlaceholder = `## Summary

Insert your summary here

## Methodology
  
Insert your methodology here

## Conclusion
  
Insert your conclusion here
  
  `

  return (
    <ProposalEditorContainer className={className}>
      <ProposalEditorHeader>
        <Trans i18nKey="vote.proposal.title" />
      </ProposalEditorHeader>
      <ProposalTitle value={title} onUserInput={onTitleInput} placeholder={t('proposal.title')} fontSize="1.25rem" />
      <hr />
      <ResizingTextArea value={body} onUserInput={onBodyInput} placeholder={bodyPlaceholder} fontSize="1rem" />
    </ProposalEditorContainer>
  )
}
