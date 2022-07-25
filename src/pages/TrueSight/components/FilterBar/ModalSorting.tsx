import React, { Dispatch, SetStateAction } from 'react'
import Modal from 'components/Modal'
import { useModalOpen, useTrendingSoonSortingModalToggle } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import { Flex, Text } from 'rebass'
import { t, Trans } from '@lingui/macro'
import { ArrowDown, X } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { TrueSightSortSettings } from 'pages/TrueSight/index'
import { ArrowUpDown } from 'components/Icons'

const SortItem = ({
  text,
  active,
  sortDirection,
  onClick,
}: {
  text: string
  active: boolean
  sortDirection: 'asc' | 'desc'
  onClick: () => void
}) => {
  const theme = useTheme()
  const textColor = active ? '#3a3a3a' : theme.subText
  const bgColor = active ? theme.primary : theme.buttonBlack

  return (
    <Flex
      p="12.5px"
      alignItems="center"
      justifyContent="center"
      bg={bgColor}
      style={{ borderRadius: '999px', gap: '4px' }}
      onClick={onClick}
    >
      <Text color={textColor} fontSize="16px" fontWeight={500}>
        {text}
      </Text>
      {active ? (
        <ArrowDown
          size={16}
          color={textColor}
          style={{ transform: sortDirection === 'asc' ? 'unset' : 'rotate(180deg)' }}
        />
      ) : (
        <ArrowUpDown />
      )}
    </Flex>
  )
}

const ModalSorting = ({
  sortSettings,
  setSortSettings,
}: {
  sortSettings: TrueSightSortSettings
  setSortSettings: Dispatch<SetStateAction<TrueSightSortSettings>>
}) => {
  const isSortingModalOpen = useModalOpen(ApplicationModal.TRENDING_SOON_SORTING)
  const toggleSortingModal = useTrendingSoonSortingModalToggle()
  const theme = useTheme()

  return (
    <Modal isOpen={isSortingModalOpen} onDismiss={toggleSortingModal}>
      <Flex flexDirection="column" padding="24px 16px 40px" width="100%">
        <Flex justifyContent="space-between" alignItems="center">
          <Text color={theme.text} fontSize="16px" lineHeight="20px" fontWeight={500}>
            <Trans>Sort by</Trans>
          </Text>
          <X color={theme.subText} size={24} onClick={toggleSortingModal} />
        </Flex>
        <Flex mt="24px" flexDirection="column" style={{ gap: '16px' }}>
          <SortItem
            text={t`Ranking`}
            active={sortSettings.sortBy === 'rank'}
            sortDirection={sortSettings.sortDirection}
            onClick={() =>
              setSortSettings(prev => ({
                sortBy: 'rank',
                sortDirection: prev.sortBy === 'rank' ? (prev.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc',
              }))
            }
          />
          <SortItem
            text={t`Name`}
            active={sortSettings.sortBy === 'name'}
            sortDirection={sortSettings.sortDirection}
            onClick={() =>
              setSortSettings(prev => ({
                sortBy: 'name',
                sortDirection: prev.sortBy === 'name' ? (prev.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc',
              }))
            }
          />
          <SortItem
            text={t`Discovered On`}
            active={sortSettings.sortBy === 'discovered_on'}
            sortDirection={sortSettings.sortDirection}
            onClick={() =>
              setSortSettings(prev => ({
                sortBy: 'discovered_on',
                sortDirection:
                  prev.sortBy === 'discovered_on' ? (prev.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc',
              }))
            }
          />
        </Flex>
      </Flex>
    </Modal>
  )
}

export default ModalSorting
