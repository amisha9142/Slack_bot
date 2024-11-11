// server.js

// Load environment variables at the top
require('dotenv').config();

const express = require("express");
const app = require("./src/app");

const port = process.env.PORT || 3000;
const server = express();

// Middleware to parse JSON requests
server.use(express.json());
server.use(app);

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
