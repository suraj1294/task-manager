import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

const baseUrl =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_APP_URL ?? ""
    : window.location.origin;

export const client = hc<AppType>(baseUrl);
