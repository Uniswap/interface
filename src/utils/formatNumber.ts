export default function formatNumber(num: string | number) {
  return (+num).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 8 })
}
