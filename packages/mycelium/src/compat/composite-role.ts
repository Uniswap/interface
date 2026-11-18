/**
 * Whether an ARIA role marks an item of a composite widget (Base UI's text-navigation roles), where Space
 * activates on keydown. Base UI's menu, select and grid items get `composite: true` explicitly rather than
 * from a composite-root context, so an emulated button they render has to read it off the role they inject.
 */
export function isCompositeItemRole(role: string | undefined): boolean {
  return role !== undefined && (role.startsWith('menuitem') || role === 'option' || role === 'gridcell')
}
