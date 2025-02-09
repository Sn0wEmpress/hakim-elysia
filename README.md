# Basic Student CRUD with Elysia.js + MongoDB + React
A full-stack application for managing student records. The project uses a monorepo structure with React for the frontend and Elysia.js for the backend API. MongoDB is used for data storage, providing a fast and efficient solution for performing basic CRUD (Create, Read, Update, Delete) operations on student data.

## Features
- 🚀 Superfast server with Elysia.js
- ⚛️ Modern React frontend with Tailwind CSS
- 🗄️ MongoDB integration via MongoClient
- 📦 Environment variable support via dotenv
- 📜 Full TypeScript support
- 🏗️ Monorepo structure for better code organization

## Prerequisites
Before you begin, ensure that you have the following installed:

- Bun (for both package management and running the server)
- MongoDB account and connection URI

## Project Structure
```
hakim-elysia/
├── apps/
│   ├── client/          # React frontend
│   └── server/          # Elysia.js backend
├── package.json         # Root workspace configuration
└── README.md
```

## Installation
1. Clone the project:
```bash
git clone https://github.com/Sn0wEmpress/hakim-elysia.git
cd hakim-elysia
```

2. Install dependencies for both client and server:
```bash
bun install
```

3. Set up environment variables:
   1. Navigate to apps/server
   2. Rename .env.example to .env if it doesn't exist
   3. Update the .env file with your MongoDB connection details:
```
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=<appname>"
```

## Development
To start both the client and server in development mode:

```bash
# Start the client (in one terminal)
bun run dev:client

# Start the server (in another terminal)
bun run dev:server
```

The client will be available at http://localhost:5173
The server will be available at http://localhost:3000

## Authors
- นายวีระพัฒน์ ติยะพันธุ์ 67101337 (Full-stack Development)
- นายคุณภคิน กิจวิเศษ 67109363 (Testing)
