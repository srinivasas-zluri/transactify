import { MikroORM } from "@mikro-orm/postgresql";
import mikroOrmConfig from "./mikro-orm.config";
import app, { startApp } from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await startApp(mikroOrmConfig);
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();
  console.log(`Server is running on http://localhost:${PORT}`);
});