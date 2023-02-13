import { bindFetcherToStore, initializeDb } from './db';

export default {
	async fetch(request: Request, env: Env) {
		if (!env.DB_NAME) {
			return new Response(
				'It looks like your worker is not yet set up to connect to a RavenDB database. Follow the setup instructions in the README to get started!'
			);
		}

		const dbStore = initializeDb(env.DB_URLS.split(','), env.DB_NAME);

		if (env.DB_CERT?.fetch) {
			console.info('A bound cert was found and will be used for RavenDB requests.');
			bindFetcherToStore(env.DB_CERT.fetch.bind(env.DB_CERT), dbStore);
		}

		const dbSession = dbStore.openSession();
		const currentNode = await dbSession.advanced.getCurrentSessionNode();

		return new Response(
			`request method: ${request.method}, CF data center: ${request.cf?.colo} (${
				(request.cf as any)?.regionCode
			}), using closest db node tag: ${currentNode?.clusterTag}`
		);
	},
};
