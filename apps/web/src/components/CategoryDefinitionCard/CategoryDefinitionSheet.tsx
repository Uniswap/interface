import { SharedEventName } from '@uniswap/analytics-events'
import { Button, Flex } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, InterfaceEventName, ModalName, type SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { CategoryDefinitionCard } from '~/components/CategoryDefinitionCard/CategoryDefinitionCard'
import { useFireOncePerOpen } from '~/components/HoverCard/useFireOncePerOpen'
import { getCategoryDetailsURL } from '~/pages/Explore/CategoryDetails/getCategoryDetailsURL'

interface CategoryDefinitionSheetProps {
  category: TokenCategory
  isOpen: boolean
  section: SectionName
  onClose: () => void
}

/** Mobile web bottom sheet with the category definition; pressing the definition opens Category Details. */
export function CategoryDefinitionSheet({
  category,
  isOpen,
  section,
  onClose,
}: CategoryDefinitionSheetProps): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const trace = useTrace()

  useFireOncePerOpen({
    isOpen,
    fire: () =>
      sendAnalyticsEvent(InterfaceEventName.CategoryDefinitionCardOpened, {
        ...trace,
        section,
        category_id: category.id,
        trigger: 'tap',
      }),
  })

  const onPressCard = useEvent((): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CategoryDefinitionSheet,
      section,
      category_id: category.id,
    })
    onClose()
    navigate(getCategoryDetailsURL(category.id))
  })

  return (
    <Modal
      name={ModalName.CategoryDefinition}
      isModalOpen={isOpen}
      padding={0}
      analyticsProperties={{ category_id: category.id }}
      onClose={onClose}
    >
      <Flex gap="$spacing24" px="$spacing24" pt="$spacing32" pb="$spacing24" testID={TestID.CategoryDefinitionSheet}>
        <CategoryDefinitionCard
          category={category}
          layout="sheet"
          testID={TestID.CategoryDefinitionCard}
          onPress={onPressCard}
        />
        <Flex row>
          <Button emphasis="secondary" size="medium" height="$spacing48" onPress={onClose}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
