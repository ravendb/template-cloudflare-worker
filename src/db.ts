import {
	CreateDatabaseOperation,
	GetDatabaseRecordOperation,
	DatabaseRecord,
	IDocumentStore,
	SessionOptions,
} from 'ravendb';
import { DocumentStore } from 'ravendb';

let store: DocumentStore;
let initialized = false;

export function initializeDb(urls: string[], dbName: string) {
	if (initialized) return store;

	store = new DocumentStore(urls, dbName);
	store.initialize();

	initialized = true;

	return store;
}

export function bindFetcherToStore(fetcher: typeof fetch, store: IDocumentStore) {
	store.getRequestExecutor().customHttpRequestOptions = {
		fetcher: fetcher as any,
	};
}

export function openDbSession(opts?: SessionOptions) {
	if (!initialized)
		throw new Error(
			'DocumentStore is not initialized yet. Must `initializeDb()` before calling `openDbSession()`.'
		);
	if (opts) {
		return store.openSession(opts);
	}
	return store.openSession();
}
