import { IDocumentSession } from 'ravendb';

/**
 * Environment variables configured via wrangler.toml
 */
export interface Env {
	/**
	 * RavenDB: Database name to connect to
	 */
	DB_NAME: string;

	/**
	 * RavenDB: The cluster node URLs to connect to, comma-separated
	 */
	DB_URLS: string;

	/**
	 * RavenDB: Cloudflare mTLS certificate binding
	 */
	DB_CERT: { fetch: typeof fetch };

	/**
	 * RavenDB: Runtime session-per-request, setup in middleware
	 */
	db: IDocumentSession;
}
