export const putCommas = (value: number) => {
  try {
    if (!value) return value
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  } catch (err) {
    return value
  }
}
