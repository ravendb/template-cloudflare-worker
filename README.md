# Template: worker-ravendb

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ravendb/template-cloudflare-worker)

A batteries included template for kick starting a TypeScript Cloudflare worker project that connects with a RavenDB Cloud database backend.

[RavenDB][cloud-signup] is a business continuity database for distributed applications offering industry-leading security with sub-100ms query performance.

> The easiest way to get started with RavenDB is by creating [a free RavenDB Cloud account](cloud-signup).
>
> If you are _brand new_ to RavenDB, we recommend starting with the [Getting Started guide](docs-get-started), the [RavenDB bootcamp](learn-bootcamp), or the [Try RavenDB](learn-demo) experience.

## Use the Template

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

## Configuring the Template

Watch the video walkthrough tutorial or read through [the step-by-step guide in the RavenDB docs][docs-howto] that covers how to get up and running successfully with this template.

[cloud-signup]: https://cloud.ravendb.net?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=cloud_signup
[docs-get-started]: https://ravendb.net/docs/article-page/csharp/start/getting-started?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=docs_get_started
[docs-create-db]: https://ravendb.net/docs/article-page/csharp/studio/database/create-new-database/general-flow?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=docs_new_db
[learn-bootcamp]: https://ravendb.net/learn/bootcamp?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=learn_bootcamp
[learn-demo]: https://demo.ravendb.net/?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=learn_demo
[docs-howto]: https://ravendb.net/docs/article-page/nodejs/getting-started/platform-guides/cloudflare-workers/overview?utm_source=github&utm_medium=web&utm_campaign=github_template_cloudflare_worker&utm_content=docs_howto
