import {
	LibrarySymbolInfo,
	SubscribeBarsCallback,
} from '../../../charting_library/datafeed-api';

import {
	GetBarsResult,
	HistoryProvider,
} from './history-provider';

import {
	getErrorMessage,
	logMessage,
} from './helpers';

interface DataSubscriber {
	symbolInfo: LibrarySymbolInfo;
	resolution: string;
	lastBarTime: number | null;
	listener: SubscribeBarsCallback;
}

interface DataSubscribers {
	[guid: string]: DataSubscriber;
}

export class DataPulseProvider {
	private readonly _subscribers: DataSubscribers = {};
	private _requestsPending: number = 0;
	private readonly _historyProvider: HistoryProvider;

	public constructor(historyProvider: HistoryProvider, updateFrequency: number) {
		this._historyProvider = historyProvider;
		setInterval(this._updateData.bind(this), updateFrequency);
	}

	public subscribeBars(symbolInfo: LibrarySymbolInfo, resolution: string, newDataCallback: SubscribeBarsCallback, listenerGuid: string): void {
		if (this._subscribers.hasOwnProperty(listenerGuid)) {
			logMessage(`DataPulseProvider: already has subscriber with id=${listenerGuid}`);
			return;
		}

		this._subscribers[listenerGuid] = {
			lastBarTime: null,
			listener: newDataCallback,
			resolution: resolution,
			symbolInfo: symbolInfo,
		};

		logMessage(`DataPulseProvider: subscribed for #${listenerGuid} - {${symbolInfo.name}, ${resolution}}`);
	}

	public unsubscribeBars(listenerGuid: string): void {
		delete this._subscribers[listenerGuid];
		logMessage(`DataPulseProvider: unsubscribed for #${listenerGuid}`);
	}

	private _updateData(): void {
		if (this._requestsPending > 0) {
			return;
		}

		this._requestsPending = 0;
		for (const listenerGuid in this._subscribers) { // tslint:disable-line:forin
			this._requestsPending += 1;
			this._updateDataForSubscriber(listenerGuid)
				.then(() => {
					this._requestsPending -= 1;
					logMessage(`DataPulseProvider: data for #${listenerGuid} updated successfully, pending=${this._requestsPending}`);
				})
				.catch((reason?: string | Error) => {
					this._requestsPending -= 1;
					logMessage(`DataPulseProvider: data for #${listenerGuid} updated with error=${getErrorMessage(reason)}, pending=${this._requestsPending}`);
				});
		}
	}

	private _updateDataForSubscriber(listenerGuid: string): Promise<void> {
		const subscriptionRecord = this._subscribers[listenerGuid];

		const rangeEndTime = parseInt((Date.now() / 1000).toString());

		// BEWARE: please note we really need 2 bars, not the only last one
		// see the explanation below. `10` is the `large enough` value to work around holidays
		const rangeStartTime = rangeEndTime - periodLengthSeconds(subscriptionRecord.resolution, 10);

		return this._historyProvider.getBars(
			subscriptionRecord.symbolInfo,
			subscriptionRecord.resolution,
			{
				from: rangeStartTime,
				to: rangeEndTime,
				countBack: 2,
				firstDataRequest: false,
			})
			.then((result: GetBarsResult) => {
				this._onSubscriberDataReceived(listenerGuid, result);
			});
	}

	private _onSubscriberDataReceived(listenerGuid: string, result: GetBarsResult): void {
		// means the subscription was cancelled while waiting for data
		if (!this._subscribers.hasOwnProperty(listenerGuid)) {
			logMessage(`DataPulseProvider: Data comes for already unsubscribed subscription #${listenerGuid}`);
			return;
		}

		const bars = result.bars;
		if (bars.length === 0) {
			return;
		}

		const lastBar = bars[bars.length - 1];
		const subscriptionRecord = this._subscribers[listenerGuid];

		if (subscriptionRecord.lastBarTime !== null && lastBar.time < subscriptionRecord.lastBarTime) {
			return;
		}

		const isNewBar = subscriptionRecord.lastBarTime !== null && lastBar.time > subscriptionRecord.lastBarTime;

		// Pulse updating may miss some trades data (ie, if pulse period = 10 secods and new bar is started 5 seconds later after the last update, the
		// old bar's last 5 seconds trades will be lost). Thus, at fist we should broadcast old bar updates when it's ready.
		if (isNewBar) {
			if (bars.length < 2) {
				throw new Error('Not enough bars in history for proper pulse update. Need at least 2.');
			}

			const previousBar = bars[bars.length - 2];
			subscriptionRecord.listener(previousBar);
		}

		subscriptionRecord.lastBarTime = lastBar.time;
		subscriptionRecord.listener(lastBar);
	}
}

function periodLengthSeconds(resolution: string, requiredPeriodsCount: number): number {
	let daysCount = 0;

	if (resolution === 'D' || resolution === '1D') {
		daysCount = requiredPeriodsCount;
	} else if (resolution === 'M' || resolution === '1M') {
		daysCount = 31 * requiredPeriodsCount;
	} else if (resolution === 'W' || resolution === '1W') {
		daysCount = 7 * requiredPeriodsCount;
	} else {
		daysCount = requiredPeriodsCount * parseInt(resolution) / (24 * 60);
	}

	return daysCount * 24 * 60 * 60;
}
