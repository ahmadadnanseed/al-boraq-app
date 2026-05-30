const mysql = require("mysql");
require("dotenv").config(); // لضمان الاستقرار في قراءة المتغيرات

const connection = mysql.createConnection({
  host: String(process.env.DB_HOST || "localhost"),
  port: Number(process.env.DB_PORT || 3306),
  user: String(process.env.DB_USER || "root"),
  password: String(process.env.DB_PASSWORD || "root"), // تحويل صريح لنص لضمان قراءة كلمة المرور "root"
  database: String(process.env.DB_NAME || "boraq_database")
});

module.exports = connection;