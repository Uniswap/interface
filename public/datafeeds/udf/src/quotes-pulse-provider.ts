import {
	QuoteData,
	QuotesCallback,
} from '../../../charting_library/datafeed-api';

import {
	getErrorMessage,
	logMessage,
} from './helpers';

import { IQuotesProvider } from './iquotes-provider';

interface QuoteSubscriber {
	symbols: string[];
	fastSymbols: string[];
	listener: QuotesCallback;
}

interface QuoteSubscribers {
	[listenerId: string]: QuoteSubscriber;
}

const enum SymbolsType {
	General,
	Fast,
}

const enum UpdateTimeouts {
	Fast = 10 * 1000,
	General = 60 * 1000,
}

export class QuotesPulseProvider {
	private readonly _quotesProvider: IQuotesProvider;
	private readonly _subscribers: QuoteSubscribers = {};
	private _requestsPending: number = 0;

	public constructor(quotesProvider: IQuotesProvider) {
		this._quotesProvider = quotesProvider;

		setInterval(this._updateQuotes.bind(this, SymbolsType.Fast), UpdateTimeouts.Fast);
		setInterval(this._updateQuotes.bind(this, SymbolsType.General), UpdateTimeouts.General);
	}

	public subscribeQuotes(symbols: string[], fastSymbols: string[], onRealtimeCallback: QuotesCallback, listenerGuid: string): void {
		this._subscribers[listenerGuid] = {
			symbols: symbols,
			fastSymbols: fastSymbols,
			listener: onRealtimeCallback,
		};

		logMessage(`QuotesPulseProvider: subscribed quotes with #${listenerGuid}`);
	}

	public unsubscribeQuotes(listenerGuid: string): void {
		delete this._subscribers[listenerGuid];
		logMessage(`QuotesPulseProvider: unsubscribed quotes with #${listenerGuid}`);
	}

	private _updateQuotes(updateType: SymbolsType): void {
		if (this._requestsPending > 0) {
			return;
		}

		for (const listenerGuid in this._subscribers) { // tslint:disable-line:forin
			this._requestsPending++;

			const subscriptionRecord = this._subscribers[listenerGuid];
			this._quotesProvider.getQuotes(updateType === SymbolsType.Fast ? subscriptionRecord.fastSymbols : subscriptionRecord.symbols)
				.then((data: QuoteData[]) => {
					this._requestsPending--;
					if (!this._subscribers.hasOwnProperty(listenerGuid)) {
						return;
					}

					subscriptionRecord.listener(data);
					logMessage(`QuotesPulseProvider: data for #${listenerGuid} (${updateType}) updated successfully, pending=${this._requestsPending}`);
				})
				.catch((reason?: string | Error) => {
					this._requestsPending--;
					logMessage(`QuotesPulseProvider: data for #${listenerGuid} (${updateType}) updated with error=${getErrorMessage(reason)}, pending=${this._requestsPending}`);
				});
		}
	}
}
