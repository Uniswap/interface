//const { Harmony } = require('@harmony-js/core');

import { Hmy } from '../blockchain';

export abstract class AbstractWallet {
  public network: string;
  public client: Hmy;
  public isAuthorized: boolean;
  public redirectUrl!: string;
  public extension: any;
  public sessionType: 'onewallet' | 'mathwallet' | 'ledger' | 'wallet' | '';
  public address: string | null;
  public base16Address: string | null;

  constructor(network: string, client: Hmy) {
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
