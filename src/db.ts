import type { IDocumentStore, SessionOptions } from 'ravendb';
import { DocumentStore } from 'ravendb';

let store: DocumentStore;
let initialized = false;

export function initializeDb(urls: string[], dbName: string) {
	if (initialized) return store;

	store = new DocumentStore(urls, dbName);

  // Use "closest" node to Cloudflare edge server
  // This may not correspond directly geographically
  // but is the most likely read balance behavior that
  // will work, without custom code.
  store.conventions.readBalanceBehavior = 'FastestNode';
	store.initialize();

	initialized = true;

	return store;
}

export function bindDbFetcherPerRequest(fetcher: typeof fetch, dbStore: IDocumentStore) {
	dbStore.getRequestExecutor().customHttpRequestOptions = {
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
