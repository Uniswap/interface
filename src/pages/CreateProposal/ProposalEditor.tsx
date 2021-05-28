import React from 'react'
import styled from 'styled-components'
import { TextArea, TextInput } from 'components/TextInput'

const ProposalEditorHeader = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text2};
`

const ProposalTitle = styled(TextInput)`
  margin-top: 7.5px;
  margin-bottom: 7.5px;
`

const ProposalBody = styled(TextArea)`
  margin-top: 15px;
  margin-bottom: 7.5px;
`

const _ProposalEditor = ({
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
  
Lorem ipsum dolor sit amet
  
## Methodology
  
Lorem ipsum dolor sit amet

## Conclusion
  
Lorem ipsum dolor sit amet
  
  `

  return (
    <div className={className}>
      <ProposalEditorHeader>Proposal</ProposalEditorHeader>
      <ProposalTitle value={title} onUserInput={onTitleInput} placeholder="Proposal Title" fontSize="1.5rem" />
      <hr />
      <ProposalBody value={body} onUserInput={onBodyInput} placeholder={bodyPlaceholder} fontSize="1rem" />
    </div>
  )
}

export const ProposalEditor = styled(_ProposalEditor)`
  padding: 0.75rem 0.5rem 0.75rem 1rem;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`
