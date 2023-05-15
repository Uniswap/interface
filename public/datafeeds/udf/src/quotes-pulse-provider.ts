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

interface Timers {
	fastTimer: number;
	generalTimer: number;
}

export class QuotesPulseProvider {
	private readonly _quotesProvider: IQuotesProvider;
	private readonly _subscribers: QuoteSubscribers = {};
	private _requestsPending: number = 0;

	private _timers: Timers | null = null;

	public constructor(quotesProvider: IQuotesProvider) {
		this._quotesProvider = quotesProvider;
	}

	public subscribeQuotes(symbols: string[], fastSymbols: string[], onRealtimeCallback: QuotesCallback, listenerGuid: string): void {
		this._subscribers[listenerGuid] = {
			symbols: symbols,
			fastSymbols: fastSymbols,
			listener: onRealtimeCallback,
		};
		this._createTimersIfRequired();
		logMessage(`QuotesPulseProvider: subscribed quotes with #${listenerGuid}`);
	}

	public unsubscribeQuotes(listenerGuid: string): void {
		delete this._subscribers[listenerGuid];
		if (Object.keys(this._subscribers).length === 0) {
			this._destroyTimers();
		}
		logMessage(`QuotesPulseProvider: unsubscribed quotes with #${listenerGuid}`);
	}

	private _createTimersIfRequired(): void {
		if (this._timers === null) {
			const fastTimer = setInterval(this._updateQuotes.bind(this, SymbolsType.Fast), UpdateTimeouts.Fast);
			const generalTimer = setInterval(this._updateQuotes.bind(this, SymbolsType.General), UpdateTimeouts.General);
			this._timers = { fastTimer, generalTimer };
		}
	}

	private _destroyTimers(): void {
		if (this._timers !== null) {
			clearInterval(this._timers.fastTimer);
			clearInterval(this._timers.generalTimer);
			this._timers = null;
		}
	}

	private _updateQuotes(updateType: SymbolsType): void {
		if (this._requestsPending > 0) {
			return;
		}

		// eslint-disable-next-line guard-for-in
		for (const listenerGuid in this._subscribers) {
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
