/**
 * Make a promise cancellable by @istarkov
 * @see https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
 */
export function makeCancelable<T extends Promise<any>>(
  promise: T
): [T, () => void] {
  let hasCanceled: boolean = false;

  const wrappedPromise: any = new Promise((resolve, reject) => {
    promise.then(
      val => (hasCanceled ? reject({ isCanceled: true }) : resolve(val)),
      error => (hasCanceled ? reject({ isCanceled: true }) : reject(error))
    );
  });

  return [
    wrappedPromise,
    function cancel() {
      hasCanceled = true;
    },
  ];
}
