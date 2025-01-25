import { DBServices, initORM } from "~/db";
import ormConfig from "../mikro-orm.test-config";
import { User } from "~/models/user";

describe("DB Connection check", () => {
  let db: DBServices;

  beforeAll(async () => {
    db = await initORM(ormConfig);
    const migrator = db.orm.getMigrator();

    const migrationNeeded = await migrator.checkMigrationNeeded();
    console.log({ migrationNeeded });

    await db.orm.getMigrator().up();
    console.log("Migrations run successfully");
    console.log(db.orm.config.get("dbName"));
  });

  afterAll(async () => {
    await db.orm.close();
  });

  it("should be able to connect to the database", async () => {
    const user = new User();
    user.name = "Test User";
    user.email = "test@gmail.com";
    await db.em.persistAndFlush(user);
    const users = await db.em.find(User, {});
    expect(users).toContainEqual(user);
  });
});