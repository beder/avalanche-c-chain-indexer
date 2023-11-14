# Avalanche C-Chain Indexer

## Running the application the first time

- docker compose run --rm app npm install
- docker compose run -e POSTGRES_HOST_AUTH_METHOD=trust --rm postgres
  - Please note that this command will not exit automatically. You will need to end it manually. Use Ctrl+C in MacOS.
- docker compose run --rm app npx prisma db push
- docker compose up

## Resetting the database

- docker compose run --rm app npx prisma db push --force-reset
