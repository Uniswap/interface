import { Passkey, PasskeyCreateRequest, PasskeyGetRequest } from 'react-native-passkey'

export async function registerPasskey(_options: string): Promise<string> {
  return JSON.stringify(await Passkey.create(JSON.parse(_options) as PasskeyCreateRequest))
}

export async function authenticatePasskey(_options: string): Promise<string> {
  return JSON.stringify(await Passkey.get(JSON.parse(_options) as PasskeyGetRequest))
}
