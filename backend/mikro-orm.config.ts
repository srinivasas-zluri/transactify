import { Options, PostgreSqlDriver } from "@mikro-orm/postgresql";

const config: Options = {
  driver: PostgreSqlDriver,
  entities: ["./models"],
  dbName: "database",
  user: "user",
  password: "password",
  host: "localhost",
  port: 5432,
  debug: true,
};

export default config;
