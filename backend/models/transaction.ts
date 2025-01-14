import { Entity, PrimaryKey, Property, Unique } from "@mikro-orm/core";

@Entity()
@Unique({ properties: ["transaction_date_string", "description"] })
export class Transaction {
  @PrimaryKey()
  id!: number;

  @Property({ type: "date" })
  transaction_date!: Date;

  @Property({ type: "varchar(11)" })
  transaction_date_string!: string;

  @Property({ type: "numeric(10, 2)" })
  amount!: number;

  @Property({ type: "text" })
  description!: string;

  @Property({ type: "varchar(10)" })
  currency!: string;

  @Property({ type: "boolean", default: false })
  is_deleted = false;
}
