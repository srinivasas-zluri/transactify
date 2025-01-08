import { Migration } from '@mikro-orm/migrations';

export class Migration20250108020840_create_user extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user" ("id" serial primary key, "name" varchar(255) not null, "email" varchar(255) not null, "created_at" timestamptz not null);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "user" cascade;`);
  }

}
