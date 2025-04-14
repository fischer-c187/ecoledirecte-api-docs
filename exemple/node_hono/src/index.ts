import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import ecoleDirecteRoutes from "./routes/ecoledirecte";

const app = new Hono();

app.use(logger());

app.get("/", (c) => c.text("Hello Hono + TypeScript + pnpm"));
app.route("/ecoledirecte", ecoleDirecteRoutes);
const port = 3000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Listening on http://localhost:${port}`);
});
