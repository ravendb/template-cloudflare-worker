import { IDocumentSession } from 'ravendb';

export interface Env {
	DB_NAME: string;
	DB_URLS: string;
	DB_CERT: { fetch: typeof fetch };
	db: IDocumentSession;
}
