const mysql = require("mysql");
require("dotenv").config();

const connection = mysql.createConnection({
  host: String(process.env.DB_HOST || "localhost"),
  port: Number(process.env.DB_PORT || 3306),
  user: String(process.env.DB_USER || "root"),
  password: String(process.env.DB_PASSWORD || "root"),
  database: String(process.env.DB_NAME || "boraq_database")
});

module.exports = connection;