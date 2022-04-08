import { logMessage } from './helpers';
export class Requester {
    constructor(headers) {
        if (headers) {
            this._headers = headers;
        }
    }
    sendRequest(datafeedUrl, urlPath, params) {
        if (params !== undefined) {
            const paramKeys = Object.keys(params);
            if (paramKeys.length !== 0) {
                urlPath += '?';
            }
            urlPath += paramKeys.map((key) => {
                return `${encodeURIComponent(key)}=${encodeURIComponent(params[key].toString())}`;
            }).join('&');
        }
        logMessage('New request: ' + urlPath);
        // Send user cookies if the URL is on the same origin as the calling script.
        const options = { credentials: 'same-origin' };
        if (this._headers !== undefined) {
            options.headers = this._headers;
        }
        return fetch(`${datafeedUrl}/${urlPath}`, options)
            .then((response) => response.text())
            .then((responseTest) => JSON.parse(responseTest));
    }
}
