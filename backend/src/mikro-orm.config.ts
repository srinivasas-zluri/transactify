import { Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Transaction } from "~/models/transaction";
import { User } from "~/models/user";
import { clientURL } from "./const";

const config: Options = {
  driver: PostgreSqlDriver,
  migrations: {
    path: "./migrations",
  },
  entities: [User, Transaction],
  // clientUrl: "postgresql://user:password@localhost:5432/database",
  clientUrl: clientURL,
  // dbName: "database",
  // user: "user",
  // password: "password",
  // host: "localhost",
  // port: 5432,
  debug: true,
};

export default config;
