import {
  Entity,
  MikroORM,
  ObjectId,
  PrimaryKey,
  Property,
} from "@mikro-orm/mongodb";
import { SerializedPrimaryKey } from "@mikro-orm/core";

type Event = {
  name: string;
  date: Date;
};

@Entity()
class User {
  @PrimaryKey({ type: "ObjectId" })
  _id = new ObjectId();

  @SerializedPrimaryKey()
  id!: string;

  @Property({ unique: true })
  email!: string;

  @Property({ type: "json" })
  events: Event[] = [];
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    clientUrl: process.env.MONGO_URL,
    dbName: "jest",
    entities: [User],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("ISODates received by MongoDB driver in JSON properties should not be erased", async () => {
  orm.em.create(User, {
    email: "foo",
    events: [{ name: "creation", date: new Date() }],
  });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: "foo" });
  expect(user.events.length).toBe(1);
  expect(user.events[0].name).toBe("creation");
  expect(user.events[0].date).toBeInstanceOf(Date); // this fails
});
