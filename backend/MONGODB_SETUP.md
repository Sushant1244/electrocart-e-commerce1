# MongoDB setup

The repository currently supports the existing PostgreSQL routes and an opt-in Mongoose data layer under `/api/mongo/*`. Set `MONGODB_URI` to enable the MongoDB connection and run the seed command.

## MongoDB Atlas

1. Create a free account at https://www.mongodb.com/atlas/database.
2. Create an `M0` free cluster and choose a region close to your users.
3. In **Database Access**, create a database user with only the permissions needed for this application. Do not use your Atlas account password.
4. In **Network Access**, add your development IP address. For production, allow only the application server's fixed egress IPs.
5. Select **Connect > Drivers**, choose Node.js, and copy the SRV connection string.
6. URL-encode special characters in the database password (`@`, `:`, `/`, `?`, `#`, and `%`).
7. Copy `backend/.env.example` to `backend/.env`, then set `MONGODB_URI`, `JWT_SECRET`, `AUTH_ENCRYPTION_KEY`, and `ADMIN_PASSWORD`.
8. From `backend/`, run `npm run seed` once. This creates three categories, ten products, and the admin user.
9. Start the server with `npm run dev` and check `GET http://localhost:5001/api/health`.

## Local MongoDB

Set `MONGODB_URI=mongodb://127.0.0.1:27017/sonu_enterprises`, start the local MongoDB service, and run `npm run seed`.

## MongoDB endpoints

- `GET /api/health`
- `GET|POST|PATCH|DELETE /api/mongo/products`
- `GET|POST|PATCH|DELETE /api/mongo/categories`
- `GET|PUT /api/mongo/cart`
- `GET|POST /api/mongo/orders`

Product listing supports `page`, `limit`, `q`, `category`, `brand`, `minPrice`, `maxPrice`, `sort`, and `direction`.

## Troubleshooting

- **IP not whitelisted:** add the current public IP in Atlas Network Access, then wait briefly for the rule to apply.
- **Wrong password:** reset the database user's password and update `.env`; do not use the Atlas login password unless it is also the database user's password.
- **Special characters in URI:** URL-encode the database username and password.
- **DNS/SRV errors:** use a current Node.js version, confirm DNS access, and test the non-SRV connection string from Atlas if your network blocks SRV lookups.
- **Health is `not-configured`:** `MONGODB_URI` is missing or the process was not restarted after editing `.env`.
- **Health is `disconnected`:** inspect the server log for the connection attempt error and verify the Atlas IP allow-list.
