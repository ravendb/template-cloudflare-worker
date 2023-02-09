import { bindDbFetcherPerRequest, initializeDb } from './db';

export default {
	async fetch(request: Request, env: Env) {
		const dbStore = initializeDb(env.DB_URLS.split(','), env.DB_NAME);

		if (env.DB_CERT?.fetch) {
			bindDbFetcherPerRequest(env.DB_CERT.fetch.bind(env.DB_CERT), dbStore);
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
