export const groupBy = <T>(xs: T[], key: string) => {
  return xs.reduce((rv: any, x: any) => {
    ;(rv[x[key]] = rv[x[key]] || []).push(x)
    return rv
  }, {})
}
