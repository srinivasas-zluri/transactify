import { Migration } from '@mikro-orm/migrations';

export class Migration20250118194324 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "transaction" add column "inr_amount" numeric(10,0) not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "transaction" drop column "inr_amount";`);
  }

}
