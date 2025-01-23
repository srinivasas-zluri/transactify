
import dotenv from "dotenv";

dotenv.config();

const clientURL = process.env.DB_CONN_STRING;
if (!clientURL) { 
  throw new Error("DB_CONN_STRING environment variable is not set");
}

export { clientURL };