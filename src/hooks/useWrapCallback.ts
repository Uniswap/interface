export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE }
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
  // inputCurrency: Token | undefined,
  // outputCurrency: Token | undefined,
  // typedValue: string | undefined
): { wrapType: WrapType; execute?: undefined | (() => Promise<void>); error?: string } {
  // const { chainId, account } = useActiveWeb3React()
  // const balance = useCurrencyBalance(account ?? undefined, inputCurrency)
  // // we can always parse the amount typed as the input currency, since wrapping is 1:1
  // const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency), [inputCurrency, typedValue])
  // const addTransaction = useTransactionAdder()

  // return useMemo(() => {
  //   return NOT_APPLICABLE
  // }, [chainId, inputCurrency, outputCurrency, inputAmount, balance, addTransaction])
  return NOT_APPLICABLE
}
