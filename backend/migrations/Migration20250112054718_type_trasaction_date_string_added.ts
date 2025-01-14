import { Migration } from '@mikro-orm/migrations';

export class Migration20250112054718_type_trasaction_date_string_added extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "transaction" add column "transaction_date_string" varchar(255) not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "transaction" drop column "transaction_date_string";`);
  }

}
