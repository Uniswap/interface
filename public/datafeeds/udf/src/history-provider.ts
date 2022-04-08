import {
	Bar,
	HistoryMetadata,
	LibrarySymbolInfo,
	PeriodParams,
} from '../../../charting_library/datafeed-api';

import {
	getErrorMessage,
	RequestParams,
	UdfErrorResponse,
	UdfOkResponse,
	UdfResponse,
} from './helpers';

import { Requester } from './requester';
// tslint:disable: no-any
interface HistoryPartialDataResponse extends UdfOkResponse {
	t: any;
	c: any;
	o?: never;
	h?: never;
	l?: never;
	v?: never;
}

interface HistoryFullDataResponse extends UdfOkResponse {
	t: any;
	c: any;
	o: any;
	h: any;
	l: any;
	v: any;
}
// tslint:enable: no-any
interface HistoryNoDataResponse extends UdfResponse {
	s: 'no_data';
	nextTime?: number;
}

type HistoryResponse = HistoryFullDataResponse | HistoryPartialDataResponse | HistoryNoDataResponse;

export type PeriodParamsWithOptionalCountback = Omit<PeriodParams, 'countBack'> & { countBack?: number };

export interface GetBarsResult {
	bars: Bar[];
	meta: HistoryMetadata;
}

export class HistoryProvider {
	private _datafeedUrl: string;
	private readonly _requester: Requester;

	public constructor(datafeedUrl: string, requester: Requester) {
		this._datafeedUrl = datafeedUrl;
		this._requester = requester;
	}

	public getBars(symbolInfo: LibrarySymbolInfo, resolution: string, periodParams: PeriodParamsWithOptionalCountback): Promise<GetBarsResult> {
		const requestParams: RequestParams = {
			symbol: symbolInfo.ticker || '',
			resolution: resolution,
			from: periodParams.from,
			to: periodParams.to,
		};
		if (periodParams.countBack !== undefined) {
			requestParams.countback = periodParams.countBack;
		}

		if (symbolInfo.currency_code !== undefined) {
			requestParams.currencyCode = symbolInfo.currency_code;
		}

		if (symbolInfo.unit_id !== undefined) {
			requestParams.unitId = symbolInfo.unit_id;
		}

		return new Promise((resolve: (result: GetBarsResult) => void, reject: (reason: string) => void) => {
			this._requester.sendRequest<HistoryResponse>(this._datafeedUrl, 'history', requestParams)
				.then((response: HistoryResponse | UdfErrorResponse) => {
					if (response.s !== 'ok' && response.s !== 'no_data') {
						reject(response.errmsg);
						return;
					}

					const bars: Bar[] = [];
					const meta: HistoryMetadata = {
						noData: false,
					};

					if (response.s === 'no_data') {
						meta.noData = true;
						meta.nextTime = response.nextTime;
					} else {
						const volumePresent = response.v !== undefined;
						const ohlPresent = response.o !== undefined;

						for (let i = 0; i < response.t.length; ++i) {
							const barValue: Bar = {
								time: response.t[i] * 1000,
								close: parseFloat(response.c[i]),
								open: parseFloat(response.c[i]),
								high: parseFloat(response.c[i]),
								low: parseFloat(response.c[i]),
							};

							if (ohlPresent) {
								barValue.open = parseFloat((response as HistoryFullDataResponse).o[i]);
								barValue.high = parseFloat((response as HistoryFullDataResponse).h[i]);
								barValue.low = parseFloat((response as HistoryFullDataResponse).l[i]);
							}

							if (volumePresent) {
								barValue.volume = parseFloat((response as HistoryFullDataResponse).v[i]);
							}

							bars.push(barValue);
						}
					}

					resolve({
						bars: bars,
						meta: meta,
					});
				})
				.catch((reason?: string | Error) => {
					const reasonString = getErrorMessage(reason);
					// tslint:disable-next-line:no-console
					console.warn(`HistoryProvider: getBars() failed, error=${reasonString}`);
					reject(reasonString);
				});
		});
	}
}
