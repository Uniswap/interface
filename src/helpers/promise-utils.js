export function retry(func, retryCount = 5) {
  return new Promise((resolve, reject) => {
    func().then(
      (...args) => {
        resolve(...args)
      },
      () => {
        if (retryCount === 0) {
          return reject()
        }
        setTimeout(() => retry(func, retryCount - 1).then(resolve, reject), 50)
      }
    )
  })
}
