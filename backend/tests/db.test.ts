import dbConfig from "../mikro-orm.config";

import { initORM, DBServices } from "../db";
import { User } from "../models/user";

describe("Database", () => {
  let orm: DBServices;

  beforeAll(async () => {
    orm = await initORM(dbConfig);
  });

  afterAll(async () => {
    await orm.orm?.close();
  });

  it("should be able to connect to the database", async () => {
    const user = new User();
    user.name = "Test User";
    user.email = "test@gmail.com";
    await orm.em.persistAndFlush(user);
    const users = await orm.em.find(User, {});
    expect(users).toContainEqual(user);
  });
});
