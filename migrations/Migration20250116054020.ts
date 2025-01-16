import { Migration } from '@mikro-orm/migrations';

export class Migration20250116054020 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop table if exists "users" cascade;`);

    this.addSql(`alter table "transaction" drop constraint "transaction_transaction_date_string_description_unique";`);

    this.addSql(`create unique index transaction_date_string_description_index_on_not_delete on transaction (transaction_date_string, description) where is_deleted = false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "users" ("name" varchar(100) null, "deleted" bool null default false);`);
    this.addSql(`CREATE UNIQUE INDEX unique_email_not_deleted ON public.users USING btree (name) WHERE (deleted = false);`);

    this.addSql(`drop index "transaction_date_string_description_index";`);

    this.addSql(`alter table "transaction" add constraint "transaction_transaction_date_string_description_unique" unique ("transaction_date_string", "description");`);
  }

}
