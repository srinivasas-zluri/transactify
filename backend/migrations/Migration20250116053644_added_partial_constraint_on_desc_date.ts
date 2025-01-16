import { Migration } from '@mikro-orm/migrations';

export class Migration20250116053644_added_partial_constraint_on_desc_date extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "transaction" drop constraint "transaction_transaction_date_string_description_unique";`);

    this.addSql(`create unique index transaction_date_string_description_index_on_not_delete on transaction (transaction_date_string, description) where is_deleted = false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "transaction_date_string_description_index";`);

    this.addSql(`alter table "transaction" drop constraint "transaction_date_string_description_index_on_not_delete";`);
  }

}
