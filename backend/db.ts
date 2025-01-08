import { EntityManager, EntityRepository, MikroORM, Options } from '@mikro-orm/postgresql';
import { User } from './models/user';

export interface DBServices {
  orm: MikroORM;
  em: EntityManager;
  user: EntityRepository<User>;
}

let cache: DBServices;

export async function initORM(options?: Options): Promise<DBServices> {
  if (cache) {
    return cache;
  }

  const orm = await MikroORM.init(options);

  // save to cache before returning
  return cache = {
    orm,
    em: orm.em,
    user: orm.em.getRepository(User),
  };
}