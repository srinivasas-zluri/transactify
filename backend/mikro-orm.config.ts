import { Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { User } from "./models/user";

const config: Options = {
  driver: PostgreSqlDriver,
  migrations: {
    path: "./migrations",
  },
  entities: [User],
  dbName: "database",
  user: "user",
  password: "password",
  host: "localhost",
  port: 5432,
  debug: true,
};

export default config;
