export function isEmptyObject(obj?: object) {
  if (!obj) {
    return true
  }
  return Object.keys(obj).length === 0
}
