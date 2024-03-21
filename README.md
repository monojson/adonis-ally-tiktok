# Adonis Ally TikTok Driver

A TikTok driver for [AdonisJS Ally](https://docs.adonisjs.com/guides/social-auth).

## Getting started

### 1. Install the package

Install the package from your command line.

```bash
npm install --save adonis-ally-tiktok
```

### 2. Configure the package

```bash
node ace configure adonis-ally-tiktok
```

### 3. Validate environment variables

```ts
TIKTOK_CLIENT_ID: Env.schema.string(),
TIKTOK_CLIENT_SECRET: Env.schema.string(),
TIKTOK_REDIRECT_CALLBACK: Env.schema.string(),
```

### 4. Add variables to your ally configuration

```ts
const allyConfig: AllyConfig = {
  // ... other drivers
  tiktok: TikTokService({
    clientId: env.get('TIKTOK_CLIENT_ID')!,
    clientSecret: env.get('TIKTOK_CLIENT_SECRET')!,
    callbackUrl: env.get('TIKTOK_REDIRECT_CALLBACK')!,
  }),
}
```

## Scopes

You can pass an array of scopes in your configuration, for example `['user.info.basic']`. You have a full list of scopes in the [TikTok Scopes Reference](https://developers.tiktok.com/doc/tiktok-api-scopes/)

## How it works

You can learn more about [AdonisJS Ally](https://docs.adonisjs.com/guides/social-auth) in the documentation. And learn about the implementation in the [ally-starter-kit](https://github.com/adonisjs-community/ally-starter-kit) repository.

## License

[MIT](LICENSE)
