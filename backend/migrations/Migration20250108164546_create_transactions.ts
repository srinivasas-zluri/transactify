import { Migration } from '@mikro-orm/migrations';

export class Migration20250108164546_create_transactions extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "transaction" ("id" serial primary key, "transaction_date" date not null, "amount" numeric(14,2) not null, "description" text not null, "currency" varchar(255) not null, "is_deleted" boolean not null default false);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "transaction" cascade;`);
  }

}
