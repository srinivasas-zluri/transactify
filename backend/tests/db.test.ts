import dbConfig from "../mikro-orm.config";

import { initORM, DBServices } from "../db";
import { User } from "../models/user";

describe("Database", () => {
  let db: DBServices;

  beforeAll(async () => {
    db = await initORM(dbConfig);
  });

  afterAll(async () => {
    // console.log(db)
    await db.orm?.close();
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
