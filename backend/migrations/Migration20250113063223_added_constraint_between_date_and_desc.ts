import { Migration } from '@mikro-orm/migrations';

export class Migration20250113063223_added_constraint_between_date_and_desc extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "transaction" add constraint "transaction_transaction_date_string_description_unique" unique ("transaction_date_string", "description");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "transaction" drop constraint "transaction_transaction_date_string_description_unique";`);
  }

}
