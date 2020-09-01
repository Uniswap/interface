const { Harmony } = require('@harmony-js/core');
export abstract class AbstractWallet {
  public network: string;
  public client: typeof Harmony;
  public isAuthorized: boolean;
  public redirectUrl!: string;
  public extension: any;
  public sessionType: 'onewallet' | 'mathwallet' | 'ledger' | 'wallet' | '';
  public address: string | null;
  public base16Address: string | null;

  constructor(network: string, client: typeof Harmony) {
    this.network = network;
    this.client = client;

    this.isAuthorized = false;
    this.sessionType = '';
    this.address = null;
    this.base16Address = null;
  }

  abstract signIn(): Promise<any>;
  abstract signOut(): Promise<any>;
  abstract signTransaction(txn: any): Promise<any>;
  abstract saveRedirectUrl(url: string): void;
  abstract reset(): void;
  abstract attachToContract(contract: any): any;
}
