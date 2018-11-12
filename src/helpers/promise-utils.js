export function retry(func, retryCount=5) {
  return new Promise((resolve, reject) => {
    func().then((...args) => {
      resolve(...args);
    }, () => {
      if (retryCount === 0) {
        return reject();
      }
      setTimeout(() => retry(func, retryCount - 1).then(resolve, reject), 50);
    });
  });
}

export function waitForValue(func, retryCount=10) {
  return new Promise((resolve, reject) => {
    const val = func();
    if (val) {
      resolve(val);
    } else {
      if (retryCount === 0) {
        return reject();
      }
      setTimeout(() => waitForValue(func, retryCount - 1).then(resolve, reject), 500);
    }
  });
}
