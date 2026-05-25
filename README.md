# Ranch Manager API

This project provides a simple REST API for tracking animals, birth events and weight logs on a ranch. It is designed to be deployed on **Railway** but can run locally as well.

## Features

- **Animals**: Create and list animals with metadata such as tag number, sex, date of birth, birth weight, parent IDs, bloodline and pen.
- **Births**: Record birth events including location, whether the birth was assisted, complications and photos.
- **Weight logs**: Record and fetch weight measurements over time for each animal.
- **Database schema**: Automatically initialises PostgreSQL tables on startup.

## API Endpoints

All endpoints return JSON. Replace `:id` with the appropriate numeric ID.

| Method | Path            | Description                                          |
|-------:|-----------------|------------------------------------------------------|
| GET    | `/health`       | Returns `{"status":"ok"}` to indicate server health |
| POST   | `/animals`      | Create a new animal record                           |
| GET    | `/animals`      | List all animals                                     |
| GET    | `/animals/:id`  | Get a specific animal with births and weight logs    |
| POST   | `/births`       | Record a birth event                                 |
| GET    | `/births`       | List all birth events                                |
| POST   | `/weights`      | Record a weight log                                  |
| GET    | `/weights`      | List weight logs (optionally filter by `animalId`)   |

### Sample Request Bodies

Create an animal:

```json
{
  "tag": "FW-2026-014",
  "sex": "female",
  "dob": "2026-05-24",
  "birthWeight": 6.4,
  "motherId": null,
  "fatherId": null,
  "bloodline": "Highland",
  "pen": "North Pasture",
  "notes": "Healthy, standing within 20 mins"
}
```

Record a birth:

```json
{
  "animalId": 1,
  "birthDate": "2026-05-24",
  "location": "North Pasture",
  "assisted": false,
  "complications": null,
  "photos": null
}
```

Record a weight log:

```json
{
  "animalId": 1,
  "weight": 7.2,
  "recordedAt": "2026-05-30T10:00:00Z",
  "method": "scale",
  "notes": "Healthy weight gain"
}
```

## Development

1. Copy `.env.example` to `.env` and set `DATABASE_URL` with your PostgreSQL connection string and `PORT` if you need a different port.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the server:
   ```sh
   npm start
   ```
4. The API will be available at `http://localhost:3000`.

## Deployment on Railway

1. Create a new project in [Railway](https://railway.app/) and add a **PostgreSQL** database.
2. Add a new **GitHub repository** service pointing to this project or use the Railway GitHub integration. Railway will install dependencies and run `npm start` by default.
3. In the Railway project settings, define an environment variable named `DATABASE_URL` using the connection string from the Railway PostgreSQL resource.
4. Optionally set `PORT` if you need to change the default port. Railway automatically binds the application port to its own internal port.
5. Deploy the project. Railway will build your Node.js app and provide a public URL for your API.

## License

This project is provided under the MIT License. See the `LICENSE` file for details.