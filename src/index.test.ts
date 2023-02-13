import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

describe('Worker', () => {
	let worker: UnstableDevWorker;

	beforeAll(async () => {
		worker = await unstable_dev('src/index.ts', {
			experimental: { disableExperimentalWarning: true },
		});
	});

	afterAll(async () => {
		await worker.stop();
	});

	it('should return 200 response', async () => {
		const resp = await worker.fetch('http://falcon', { method: 'GET' });
		expect(resp.status).toBe(200);

		const text = await resp.text();
		expect(text).toBe(
			'It looks like your worker is not yet set up to connect to a RavenDB database. Follow the setup instructions in the README to get started!'
		);
	});
});
