# Avalanche C Chain Indexer

## Running the application the first time

- docker compose run --rm app npm install
- docker compose run -e POSTGRES_HOST_AUTH_METHOD=trust --rm postgres
- docker compose run --rm app npx prisma db push
- docker compose up
