import { ReactComponent as SearchIcon } from 'assets/svg/search.svg'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import useDebounce from 'hooks/useDebounce'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { ExploreTab } from 'pages/Explore/constants'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { transitions } from 'theme/styles'
import { Flex, IconButton, Input, useSporeColors } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme'
import { ElementName, InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export default function SearchBar({ tab }: { tab?: string }) {
  const { t } = useTranslation()
  const currentString = useAtomValue(exploreSearchStringAtom)
  const [localFilterString, setLocalFilterString] = useState(currentString)
  const setFilterString = useUpdateAtom(exploreSearchStringAtom)
  const debouncedLocalFilterString = useDebounce(localFilterString, 300)
  const [isOpen, setIsOpen] = useState(false)
  const colors = useSporeColors()

  useEffect(() => {
    setLocalFilterString(currentString)
    if (currentString) {
      setIsOpen(true)
    }
  }, [currentString])

  useEffect(() => {
    setFilterString(debouncedLocalFilterString)
  }, [debouncedLocalFilterString, setFilterString])

  const handleFocus = () => setIsOpen(true)

  const handleBlur = () => {
    if (localFilterString === '') {
      setIsOpen(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setLocalFilterString('')
  }

  const placeholdersText: Record<string, string> = {
    [ExploreTab.Tokens]: t('tokens.table.search.placeholder.tokens'),
    [ExploreTab.Pools]: t('tokens.table.search.placeholder.pools'),
    [ExploreTab.Transactions]: t('tokens.table.search.placeholder.transactions'),
  }

  return (
    <Trace logFocus eventOnTrigger={InterfaceEventName.ExploreSearchSelected} element={ElementName.ExploreSearchInput}>
      <Flex
        $md={{
          position: isOpen ? 'absolute' : 'relative',
          width: isOpen ? '100%' : 'auto',
          left: 0,
          right: 0,
          zIndex: zIndexes.mask,
          height: 40,
        }}
        centered
      >
        <SearchIcon
          fill={colors.neutral1.val}
          style={{ position: 'absolute', left: '12px' }}
          width={20}
          height={20}
          pointerEvents="none"
        />
        <Input
          data-testid="explore-tokens-search-input"
          placeholder={placeholdersText[tab ?? ExploreTab.Tokens]}
          placeholderTextColor="$neutral3"
          id="searchBar"
          autoComplete="off"
          value={localFilterString}
          onChangeText={(value) => setLocalFilterString(value)}
          backgroundColor="$surface1"
          borderRadius={12}
          borderWidth={1}
          borderColor={isOpen ? '$accent1' : '$surface3'}
          height="100%"
          width={isOpen ? 200 : 0}
          pl={34}
          pr={isOpen ? 30 : undefined}
          color="$neutral2"
          textOverflow="ellipsis"
          onFocus={handleFocus}
          onBlur={handleBlur}
          $platform-web={{
            transitionDuration: transitions.duration.fast,
          }}
          focusStyle={{
            backgroundColor: '$surface1',
            borderColor: '$accent1',
            color: '$neutral1',
          }}
          hoverStyle={{
            borderColor: '$surface3Hovered',
            cursor: 'pointer',
          }}
          $md={{
            '$platform-web': {
              transitionDuration: 'initial',
            },
            width: isOpen ? '100%' : 0,
          }}
        />
        {isOpen && (
          <Flex row centered position="absolute" right={6} zIndex={zIndexes.mask}>
            <IconButton size="xxsmall" emphasis="secondary" onPress={handleClose} icon={<X />} p={3} scale={0.8} />
          </Flex>
        )}
      </Flex>
    </Trace>
  )
}
