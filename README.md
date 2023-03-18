# RavenDB Cloudflare Worker Template (TypeScript)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ravendb/template-cloudflare-worker) [![Open on StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)][stackblitz]

A batteries included template for kick starting a TypeScript Cloudflare worker project that connects with a RavenDB Cloud database backend.

[RavenDB][cloud-signup] is a business continuity database for distributed applications offering industry-leading security with sub-100ms query performance.

> The easiest way to get started with RavenDB is by creating [a free RavenDB Cloud account](cloud-signup).
>
> If you are _brand new_ to RavenDB, we recommend starting with the [Getting Started guide](docs-get-started), the [RavenDB bootcamp](learn-bootcamp), or the [Try RavenDB](learn-demo) experience.

## How to Use This Template

To create a `my-project` directory using this template, run:

```sh
$ npm init cloudflare my-project https://github.com/ravendb/template-cloudflare-worker
# or
$ yarn create cloudflare my-project https://github.com/ravendb/template-cloudflare-worker
# or
$ pnpm create cloudflare my-project https://github.com/ravendb/template-cloudflare-worker
```

> **Note:** Each command invokes [`create-cloudflare`](https://www.npmjs.com/package/create-cloudflare) for project creation.

To start the worker:

```sh
$ npm start
```

### Configure the Template

Watch the [video tutorial][docs-howto-video] or read through [the step-by-step guide in the RavenDB docs][docs-howto] that covers how to get up and running successfully with this template by configuring the worker to use mTLS certificates.

### Wrangler Environment Variables

In `wrangler.toml`:

- `DB_URLS`: Comma-separated values for your RavenDB cluster node URLs
- `DB_NAME`: Database to connect to. **Warning:** Ensure the database exists otherwise you will receive a `DatabaseNotFoundException`.

### mTLS Certificates

Obtain your RavenDB client certificate from the Cloud dashboard, Manage Server > Certificates in the Studio, or the Raven Admin CLI.

> **IMPORTANT:** The `.pem` file in the RavenDB client certificate package contains the RSA private key and that may need to be removed in earlier versions of Wrangler to successfully parse the file.

Follow the [Cloudflare mTLS for Workers][cf-workers-mtls] documentation to upload and specify the `<CERTIFICATE_ID`> in the `wrangler.toml` for the `DB_CERT` binding.

```sh
$ npx wrangler mtls-certificate upload --cert cert.pem --key key.pem --name cert_name
```

[stackblitz]: https://stackblitz.com/github/ravendb/template-cloudflare-worker
[cloud-signup]: https://cloud.ravendb.net?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=cloud_signup
[docs-get-started]: https://ravendb.net/docs/article-page/csharp/start/getting-started?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=docs_get_started
[docs-create-db]: https://ravendb.net/docs/article-page/csharp/studio/database/create-new-database/general-flow?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=docs_new_db
[learn-bootcamp]: https://ravendb.net/learn/bootcamp?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=learn_bootcamp
[learn-demo]: https://demo.ravendb.net/?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=learn_demo
[docs-howto]: https://ravendb.net/docs/article-page/nodejs/getting-started/platform-guides/cloudflare-workers/overview?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=docs_howto
[docs-howto-video]: https://tbd
[cf-workers-mtls]: https://developers.cloudflare.com/workers/runtime-apis/mtls/
