import React, { CSSProperties, useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import Search from 'components/Search'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { X } from 'react-feather'
import { ButtonEmpty } from 'components/Button'
import { OptionsContainer } from 'pages/TrueSight/styled'
import { Trans } from '@lingui/macro'
import Divider from 'components/Divider'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TruncatedText } from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'

interface TrueSightSearchBoxProps {
  minWidth?: string
  style?: CSSProperties
  placeholder: string
  foundTags: string[]
  foundTokens: TrueSightTokenData[]
  searchText: string
  setSearchText: React.Dispatch<React.SetStateAction<string>>
  selectedTag: string | undefined
  setSelectedTag: (tag: string | undefined) => void
  selectedTokenData: TrueSightTokenData | undefined
  setSelectedTokenData: (tokenData: TrueSightTokenData | undefined) => void
}

const Option = ({ option, onClick }: { option: string | TrueSightTokenData; onClick?: () => void }) => {
  const theme = useTheme()

  return (
    <Flex alignItems="center" style={{ gap: '4px', maxWidth: '100%' }} onClick={onClick}>
      {typeof option !== 'string' ? (
        <>
          <img src={option.logo_url} width="16px" style={{ minWidth: '16px' }} alt="logo_url" />
          <TruncatedText fontSize="12px" color={theme.subText}>
            {option.name}
          </TruncatedText>
          <Text fontSize="12px" color={theme.disableText} marginLeft="4px" style={{ minWidth: 'fit-content' }}>
            {option.symbol}
          </Text>
        </>
      ) : (
        <>
          {!onClick && (
            <Text fontSize="12px" color={theme.disableText}>
              <Trans>Tag:</Trans>
            </Text>
          )}
          <Text fontSize="12px" color={theme.subText} marginLeft="4px">
            {option}
          </Text>
        </>
      )}
    </Flex>
  )
}

export default function TrueSightSearchBox({
  minWidth,
  style,
  placeholder,
  foundTags,
  foundTokens,
  searchText,
  setSearchText,
  selectedTag,
  setSelectedTag,
  selectedTokenData,
  setSelectedTokenData,
}: TrueSightSearchBoxProps) {
  const theme = useTheme()
  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchText === '' || selectedTag !== undefined || selectedTokenData !== undefined) {
      setIsShowOptions(false)
    } else if (foundTags.length || foundTokens.length) {
      setIsShowOptions(true)
    }
  }, [foundTokens.length, foundTags.length, searchText, selectedTokenData, selectedTag])

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  return (
    <Box ref={containerRef} style={{ position: 'relative', height: '100%', ...style }}>
      {selectedTag || selectedTokenData ? (
        <SelectedOption>
          <Option option={(selectedTag || selectedTokenData) as string | TrueSightTokenData} />
          <ButtonEmpty
            style={{ padding: '2px 4px', width: 'max-content' }}
            onClick={() => {
              setSearchText('')
              setSelectedTag(undefined)
              setSelectedTokenData(undefined)
            }}
          >
            <X color={theme.disableText} size={14} style={{ minWidth: '14px' }} />
          </ButtonEmpty>
        </SelectedOption>
      ) : (
        <Search
          searchValue={searchText}
          onSearch={(newSearchText: string) => setSearchText(newSearchText)}
          placeholder={placeholder}
          minWidth={minWidth}
        />
      )}
      {isShowOptions && (
        <OptionsContainer>
          <>
            <Text fontSize="12px" fontWeight={500} color={theme.disableText} className="no-hover-effect">
              <Trans>Tokens</Trans>
            </Text>
            {foundTokens.map((tokenData, index) => {
              return (
                <Option
                  key={index}
                  option={tokenData}
                  onClick={() => {
                    setSelectedTokenData(tokenData)
                  }}
                />
              )
            })}
            <Divider padding="0" margin="12px 0" className="no-hover-effect no-hover-effect-divider" />
            <Text fontSize="12px" fontWeight={500} color={theme.disableText} className="no-hover-effect">
              <Trans>Tags</Trans>
            </Text>
            {foundTags.map((tag, index) => {
              return (
                <Option
                  key={index}
                  option={tag}
                  onClick={() => {
                    setSelectedTag(tag)
                  }}
                />
              )
            })}
          </>
        </OptionsContainer>
      )}
    </Box>
  )
}

const SelectedOption = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  height: 100%;
  min-height: 36px;
  border-radius: 4px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`
