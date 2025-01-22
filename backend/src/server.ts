import { MikroORM } from "@mikro-orm/postgresql";
import mikroOrmConfig from "./mikro-orm.config";
import app, { startApp } from "./app";
import cors from "cors";

const PORT = process.env.PORT || 3000;

// handle cors to localhost:5173  using cors lib
app.use(cors({ origin: "http://localhost:5173" }));

app.listen(PORT, async () => {
  await startApp(mikroOrmConfig);
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();
  console.log(`Server is running on http://localhost:${PORT}`);
});
