# Basic Student CRUD with Elysia.js + MongoDB
A simple and efficient REST API template designed for managing student records. This boilerplate leverages Elysia.js for building the API and MongoDB for data storage, providing a lightweight, fast solution for performing basic CRUD (Create, Read, Update, Delete) operations on student data. Ideal for quick setups, prototyping, or learning how to integrate MongoDB with modern web frameworks like Elysia.js.

## Features
- 🚀 Superfast server with Elysia.js
- 🗄️ MongoDB integration via MongoClient
- 📦 Environment variable support via dotenv
- 📜 API validation with TypeScript

## Prerequisites
Before you begin, ensure that you have the following installed:

- Bun
- MongoDB account and connection URI

## How to install
1. Clone the project:
git clone https://github.com/Sn0wEmpress/hakim-elysia.git
```bash
git clone https://github.com/Sn0wEmpress/hakim-elysia.git
cd hakim-elysia
```
2. Install dependencies using Bun:
```bash
bun install
```

3. Set up environment variables (server):
   1. Rename .env.example to .env
   2. Open the .env file and replace the placeholders with your MongoDB connection details:
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=<appname>"

## Development
To start the development both client and server run:
```bash
bun run dev
```

## Authors
- นายวีระพัฒน์ ติยะพันธุ์ 67101337 (Do everything)
- นายคุณภคิน กิจวิเศษ 67109363 (Buy chatgpt pro)
