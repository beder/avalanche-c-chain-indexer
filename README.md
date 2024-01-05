# Avalanche C-Chain Indexer

This project indexes the C-Chain of Avalanche and provides endpoints for accessing information related to blockchain transactions and addresses.

## How to setup

1. Install dependencies

```bash
docker compose run --rm api npm install
```

2. Initialize the database

💡 Please note that this command will not exit automatically. You will need to end it manually. Use Ctrl+C in MacOS.

```bash
docker compose run -e POSTGRES_HOST_AUTH_METHOD=trust --rm postgres
```

3. Setup the database

```bash
docker compose run --rm indexer npx prisma db push
```

## How to run

```bash
docker compose up
```

## Resetting the database

If you need to start fresh by erasing all indexed data, execute the following command.

```bash
docker compose run --rm indexer npx prisma db push --force-reset
```

## Endpoints

Below are instructions on how to call the endpoints of the API along with examples of requests and responses.

### List Transactions for a Specific Address

#### Endpoint:

```http
GET /addresses/:address/transactions
```

#### Example Request:

```http
GET http://localhost:3000/addresses/0x123abc/transactions
```

#### Example Response:

```json
[
    {
        "hash": "0x5aea6d0e7f8d910260ec0bddeeb75504aacf274a00322b01d15828b60df16839",
        "to": "0x123abc",
        "from": "0x9f8c163cba728e99993abe7495f06c0a3c8ac8b9",
        "blockNumber": "0x2400f8d",
        "transactionIndex": "0x2",
        "value": "0x1b1ac86aedc91c0000"
    },
    // ... additional transactions for the address
]
```

### Get Transaction Count for a Specific Address

#### Endpoint:

```http
GET /addresses/:address/transaction-count
```

#### Example Request:

```http
GET http://localhost:3000/addresses/0x123abc/transaction-count
```

#### Example Response:

```json
{
  "count": 42
}
```

### List Blocks Sorted by Number

#### Endpoint:

```http
GET /blocks
```

#### Example Request:

```http
GET http://localhost:3000/blocks
```

#### Example Response:

```json
[
    {
        "hash": "0x85230025f1b0ffc35b0289d15b58d957772a89e04e1d9de57393822eb48fcbb7",
        "miner": "0x0100000000000000000000000000000000000000",
        "number": "0x261aae0",
        "size": "0x8fc",
        "timestamp": "0x65979a13"
    },
    // ... additional blocks sorted by number
]
```

### List Transactions Sorted by Value

#### Endpoint:

```http
GET /transactions
```

#### Example Request:

```http
GET http://localhost:3000/transactions
```

#### Example Response:

```json
[
    {
        "hash": "0x5aea6d0e7f8d910260ec0bddeeb75504aacf274a00322b01d15828b60df16839",
        "to": "0xffb02c56bb2843b794016ddc08ab11a8be7d73ca",
        "from": "0x9f8c163cba728e99993abe7495f06c0a3c8ac8b9",
        "blockNumber": "0x2400f8d",
        "transactionIndex": "0x2",
        "value": "0x1b1ac86aedc91c0000"
    },
    // ... additional transactions sorted by value
]
```

### Get Top Addresses by Balance

#### Endpoint:

```http
GET /addresses/top-by-balance
```

#### Example Request:

```http
GET http://localhost:3000/addresses/top-by-balance
```

#### Example Response:

```json
[
    {
        "address": "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
        "balance": "0x50d2701ab4082e190466f"
    },
    // ... additional top addresses
]
```
