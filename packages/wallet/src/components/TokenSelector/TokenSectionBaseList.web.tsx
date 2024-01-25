import { useRef } from 'react'
import { ListItem, TamaguiElement, YGroup } from 'tamagui'
import { TokenSectionBaseListProps } from 'wallet/src/components/TokenSelector/TokenSectionBaseList'

export function TokenSectionBaseList({
  ListEmptyComponent,
  keyExtractor,
  renderItem,
  renderSectionHeader,
  sections,
}: TokenSectionBaseListProps): JSX.Element {
  const ref = useRef<TamaguiElement>(null)
  // TODO replace YGroup with real list and implement scroll to functionality

  return (
    <YGroup ref={ref}>
      {!sections.length && ListEmptyComponent}
      {sections.map((section) => (
        <>
          <YGroup.Item>
            <ListItem>
              {renderSectionHeader &&
                renderSectionHeader({
                  section: { title: section.title, rightElement: section.rightElement },
                })}
            </ListItem>
          </YGroup.Item>
          {section.data.map((item, index) => (
            <YGroup.Item key={keyExtractor?.(item, index)}>
              <ListItem>{renderItem({ item, section, index })}</ListItem>
            </YGroup.Item>
          ))}
        </>
      ))}
    </YGroup>
  )
}
