// Static Chrome storage wrapper
export class PersistedStorage {
  /**
   * Items in the local storage area are local to each machine.
   **/

  public static async getLocalStorage(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (result) => {
        try {
          resolve(result[key])
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  public static async setLocalStorage(
    key: string,
    value: unknown
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        try {
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  public static async clearLocalStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        try {
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  /**
   * Items in the sync storage area are synced using Chrome Sync.
   **/

  public static async getSyncStorage(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(key, (result) => {
        try {
          resolve(result[key])
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  public static async setSyncStorage(
    key: string,
    value: unknown
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [key]: value }, () => {
        try {
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  public static async clearSyncStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.clear(() => {
        try {
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  /**
   * Items in the session storage area are stored in-memory and will not be persisted to disk.
   **/
  public static async getSessionStorage(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (result) => {
        try {
          resolve(result[key])
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  public static async setSessionStorage(
    key: string,
    value: unknown
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        try {
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  public static async clearSessionStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        try {
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  /** Items in the managed storage area are set by the domain administrator, and are read-only for the extension;
   * Trying to modify this namespace results in an error.
   **/

  //no-op
}
