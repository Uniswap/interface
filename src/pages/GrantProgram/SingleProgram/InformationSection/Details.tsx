import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import oembed2iframe from 'utils/oembed2iframe'

import { Props } from '.'

const HTMLWrapper = styled.div`
  word-break: break-word;

  font-size: 16px;
  line-height: 20px;

  p,
  li,
  span,
  div {
    font-size: 16px;
    line-height: 20px;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 12px;
    line-height: 16px;

    p,
    li,
    span,
    div {
      font-size: 12px;
      line-height: 16px;
    }
  `}
`

const Title = styled.span`
  font-weight: 500;
  font-size: 20px;
  line-height: 24px;
  color: ${({ theme }) => theme.text};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-weight: 500;
    font-size: 16px;
    line-height: 20px;
  `}
`

enum Panel {
  Rules = 'Rules',
  TermsAndConditions = 'TermsAndConditions',
  FAQ = 'FAQ',
}

type PanelProps = {
  isExpanded: boolean
  toggleExpand: () => void
  title: string
  content?: string
}

const DetailPanel: React.FC<PanelProps> = ({ isExpanded, title, content, toggleExpand }) => {
  const theme = useTheme()

  return (
    <>
      <Flex
        role="button"
        onClick={() => {
          if (!content) {
            return
          }

          toggleExpand()
        }}
        sx={{
          height: '56px',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <Title>{title}</Title>

        {content ? (
          <Flex
            role="button"
            onClick={toggleExpand}
            sx={{
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              transition: 'all 150ms linear',
              transform: isExpanded ? 'rotate(180deg)' : undefined,
            }}
          >
            <ChevronDown size="20" color={theme.text} />
          </Flex>
        ) : null}
      </Flex>

      {isExpanded && content && (
        <Text marginBottom="16px">
          <HTMLWrapper dangerouslySetInnerHTML={{ __html: oembed2iframe(content) }} />
        </Text>
      )}
    </>
  )
}

const DetailsContainer = styled.div`
  padding: 16px 24px;
  width: 600px;
  height: fit-content;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100%;
  `}

  display: flex;
  flex-direction: column;
  background: ${({ theme }) => rgba(theme.background, 0.8)};
  border-radius: 20px;
`

const Separator = styled.div`
  width: 100%;
  height: 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  margin: 8px 0;
`

const Details: React.FC<Props> = ({ rules, terms, faq }) => {
  const [expandedPanel, setExpandedPanel] = useState<Panel | undefined>()

  const handleToggleExpand = (panel?: Panel) => {
    if (expandedPanel === panel) {
      setExpandedPanel(undefined)
    } else {
      setExpandedPanel(panel)
    }
  }

  return (
    <DetailsContainer>
      <DetailPanel
        toggleExpand={() => {
          handleToggleExpand(Panel.Rules)
        }}
        isExpanded={expandedPanel === Panel.Rules}
        title={t`Rules`}
        content={rules}
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => {
          handleToggleExpand(Panel.TermsAndConditions)
        }}
        isExpanded={expandedPanel === Panel.TermsAndConditions}
        title={t`Terms and Conditions`}
        content={terms}
      />
      <Separator />
      <DetailPanel
        toggleExpand={() => {
          handleToggleExpand(Panel.FAQ)
        }}
        isExpanded={expandedPanel === Panel.FAQ}
        title={t`FAQ`}
        content={faq}
      />
    </DetailsContainer>
  )
}

export default Details
