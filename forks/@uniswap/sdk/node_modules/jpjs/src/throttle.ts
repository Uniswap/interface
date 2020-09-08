/**
 * Throttling enforces a maximum number of times a function
 * can be called over time.
 *
 * @param func a function
 * @param wait time
 */
export function throttle(this: any, func: Function, wait: number) {
  let timeout: NodeJS.Timer | number | null = null;
  let callbackArgs: IArguments | null = null;
  const context = this;

  const later = () => {
    func.apply(context, callbackArgs);
    timeout = null;
  };

  return function() {
    if (!timeout) {
      callbackArgs = arguments;
      timeout = setTimeout(later, wait);
    }
  };
}
