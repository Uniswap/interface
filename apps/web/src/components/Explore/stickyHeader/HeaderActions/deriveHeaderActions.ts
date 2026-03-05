import {
  type HeaderAction,
  type HeaderActionDropdownItem,
  type HeaderActionSection,
  isHeaderActionWithDropdown,
} from '~/components/Explore/stickyHeader/HeaderActions/types'
import { openExternalLink } from '~/utils/openExternalLink'

function dropdownItemToSimpleAction(item: HeaderActionDropdownItem): HeaderAction {
  return {
    title: item.title,
    textColor: item.textColor,
    icon: item.icon,
    show: item.show !== false,
    subtitle: item.subtitle,
    trailingIcon: item.trailingIcon,
    href: item.href,
    onPress: item.href ? () => openExternalLink(item.href!) : item.onPress,
  }
}

/**
 * Derives desktop (flat list) and mobile (sectioned with dropdowns expanded) from a single section-based source.
 */
export function deriveFromSections(sections: HeaderActionSection[]): {
  desktopHeaderActions: HeaderAction[]
  mobileHeaderActionSections: HeaderActionSection[]
} {
  const desktopHeaderActions = sections.flatMap((section) => section.actions)

  const mobileHeaderActionSections: HeaderActionSection[] = sections.map((section) => ({
    title: section.title,
    actions: section.actions.flatMap((action) =>
      isHeaderActionWithDropdown(action)
        ? action.dropdownItems.filter((item) => item.show !== false).map(dropdownItemToSimpleAction)
        : [action],
    ),
  }))

  return { desktopHeaderActions, mobileHeaderActionSections }
}
