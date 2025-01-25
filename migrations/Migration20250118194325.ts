
import { Migration } from '@mikro-orm/migrations';

export class Migration20250118194324 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "transaction" alter column "amount" type numeric(14, 2);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "transaction" drop column "inr_amount";`);
  }

}