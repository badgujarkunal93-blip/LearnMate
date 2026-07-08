# Secret Management

To avoid accidentally committing secrets:

- Store local credentials in a `.env` file and never commit it.
- Keep `.env` and local variants listed in `.gitignore`.
- Use [`./.env.example`](./.env.example) as the template for required variables.
- If a secret is leaked, rotate/revoke it immediately with the provider and replace it in your local `.env`.
