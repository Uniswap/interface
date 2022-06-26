/**
 * ex:  nguyen hoai danh => nguyen-hoai-danh
 * @param text
 * @returns
 */
export function convertToSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-.]+/g, '')
}
