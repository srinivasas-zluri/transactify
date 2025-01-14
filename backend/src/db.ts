import {
  EntityManager,
  EntityRepository,
  MikroORM,
  Options,
} from "@mikro-orm/postgresql";
import { Transaction } from "~/models/transaction";

export interface DBServices {
  orm: MikroORM;
  em: EntityManager;
  transaction: EntityRepository<Transaction>;
}

let cache: DBServices;

export async function initORM(options?: Options): Promise<DBServices> {
  // if (cache) {
  //   return cache;
  // }

  const orm = await MikroORM.init(options);

  // save to cache before returning
  return (cache = {
    orm,
    em: orm.em.fork(),
    transaction: orm.em.getRepository(Transaction),
  });
}
