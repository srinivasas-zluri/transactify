import { Migration } from '@mikro-orm/migrations';

export class Migration20250111172701_added_transaction_date_string_field extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "transaction" add column "transaction_date_string" date not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "transaction" drop column "transaction_date_string";`);
  }

}
