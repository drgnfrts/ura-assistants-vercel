// src/env.mjs
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_ASSISTANT_ID: process.env.OPENAI_ASSISTANT_ID,
  },
  /*
   * Environment variables available on the client (and server).
   * Specify your client-side environment variables schema here.
   * You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {},
  /*
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   * You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_ASSISTANT_ID: process.env.OPENAI_ASSISTANT_ID,
  },
});
