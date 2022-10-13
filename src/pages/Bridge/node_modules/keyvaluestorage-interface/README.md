# keyvaluestorage-interface [![npm version](https://badge.fury.io/js/keyvaluestorage-interface.svg)](https://badge.fury.io/js/keyvaluestorage-interface)

Isomorphic Key-Value Storage Interface

## Example

```typescript
import KeyValueStorage from "keyvaluestorage-interface";

const options = {
  // required for React-Native platform
  // package from @react-native-async-storage/async-storage
  asyncStorage: AsyncStorage
  // required for NodeJS platform
  // sqlite database connection (in-memory supported)
  database: 'foobar.db'
  // optional for NodeJS platform
  // sqlite table name (default: 'keyvaluestorage-interface')
  tableName: 'keyvaluestorage-interface'
}

const storage = new KeyValueStorage(options)

// setItem
await storage.setItem('user1', { name: 'John Doe', age: 21 })

// getItem
const item = await storage.getItem('user1')

// removeItem
await storage.removeItem('user1')
```

## API

```typescript
export class IKeyValueStorage {
  public getKeys(): Promise<string[]>;
  public getEntries<T = any>(): Promise<[string, T][]>;
  public getItem<T = any>(key: string): Promise<T | undefined>;
  public setItem<T = any>(key: string, value: T): Promise<void>;
  public removeItem(key: string): Promise<void>;
}
```
