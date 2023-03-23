import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

describe('Worker', () => {
	let worker: UnstableDevWorker;

	beforeAll(async () => {
		worker = await unstable_dev('src/index.ts', {
			// Use the local Wrangler config
			config: 'wrangler.toml',
			// Disable local mode to enable an e2e test
			// since the presence of an mTLS certificate
			// binding will result in accessing RavenDB
			local: false,
			experimental: { disableExperimentalWarning: true },
		});
	});

	afterAll(async () => {
		try {
			await worker.stop();
		} catch (err) {
			expect(err).toBeNull();
		}
	});

	it('should return 200 response', async () => {
		try {
			const resp = await worker.fetch('http://falcon', { method: 'GET' });
			expect(resp.status).toBe(200);
		} catch (err) {
			expect(err).toBeNull();
		}
	});
});
