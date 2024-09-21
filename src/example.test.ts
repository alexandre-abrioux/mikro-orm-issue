import {
  Entity,
  MikroORM,
  MongoEntityRepository,
  ObjectId,
  PrimaryKey,
  Property,
} from "@mikro-orm/mongodb";

type Devices = { mouse: string; keyboard: string };

@Entity()
class User {
  @PrimaryKey({ type: "ObjectId" })
  _id = new ObjectId();

  @Property({ unique: true })
  email!: string;

  @Property({ type: "json" })
  devices?: Devices;
}

class UserRepository extends MongoEntityRepository<User> {}

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

it("should populate a json property that contains a default value in its prototype at entity creation", async () => {
  const em1 = orm.em.fork();
  const em2 = orm.em.fork();
  const userRepository = new UserRepository(em1, User);

  // create object with prototype containing a default value for the mouse brand
  const devices: Devices = Object.create({
    mouse: "no-brand",
  });
  // set actual values
  devices.mouse = "acme";
  devices.keyboard = "acme";
  userRepository.create({
    email: "test@test.com",
    devices,
  });
  await em1.flush();

  const user2 = await em2.findOneOrFail(User, { email: "test@test.com" });
  expect(user2.devices).toEqual({ mouse: "acme", keyboard: "acme" }); // this fails, property "mouse" is missing
});

it("should populate a json property that contains a default value in its prototype at entity update", async () => {
  const em1 = orm.em.fork();
  const em2 = orm.em.fork();
  const em3 = orm.em.fork();
  const userRepository = new UserRepository(em1, User);

  userRepository.create({
    email: "test@test.com",
    devices: { mouse: "nobrand", keyboard: "nobrand" },
  });
  await em1.flush();

  const user2 = await em2.findOneOrFail(User, { email: "test@test.com" });
  expect(user2.devices).toEqual({ mouse: "nobrand", keyboard: "nobrand" });
  // create object with prototype containing default value
  const devices: Devices = Object.create({
    mouse: "nobrand",
  });
  // set actual values
  devices.mouse = "acme";
  devices.keyboard = "acme";
  user2.devices = devices;
  await em2.flush();

  const user3 = await em3.findOneOrFail(User, { email: "test@test.com" });
  expect(user3.devices).toEqual({ mouse: "acme", keyboard: "acme" }); // this fails, property "mouse" is missing
});
