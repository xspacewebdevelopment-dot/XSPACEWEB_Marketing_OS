import { Inngest } from "inngest";

const eventKey =
  process.env.INNGEST_EVENT_KEY ||
  process.env.INGEST_EVENT_KEY ||
  undefined;

const signingKey =
  process.env.INNGEST_SIGNING_KEY ||
  process.env.INGEST_SINGING_KEY ||
  process.env.INNGEST_SIGN_KEY ||
  undefined;

const isDev = process.env.NODE_ENV !== "production" || process.env.INNGEST_DEV === "1";

export const inngest = new Inngest({
  id: "nexareach-marketing-os",
  name: "NexaReach Marketing OS",
  eventKey,
  signingKey,
  isDev,
});
