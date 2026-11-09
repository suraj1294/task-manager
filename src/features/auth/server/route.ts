import { Hono } from "hono";
import { AppwriteException, ID } from "node-appwrite";
import { deleteCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";

import { createAdminClient } from "@/lib/appwrite";
import { sessionMiddleware } from "@/lib/session-middleware";

import { AUTH_COOKIE } from "../constants";
import { loginSchema, registerSchema } from "../schemas";

const app = new Hono()
  .get(
    "/current",
    sessionMiddleware,
    (c) => {
      const user = c.get("user");

      return c.json({ data: user });
    }
  )
  .post(
    "/login",
    zValidator("json", loginSchema),
    async (c) => {
      const { email, password } = c.req.valid("json");

      const { account } = await createAdminClient();

      try {
        const session = await account.createEmailPasswordSession(
          email,
          password,
        );

        setCookie(c, AUTH_COOKIE, session.secret, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 30,
        });

        return c.json({ success: true });
      } catch (error) {
        if (
          error instanceof AppwriteException &&
          (error.type === "user_invalid_credentials" || error.code === 401)
        ) {
          return c.json({ error: "Invalid credentials" }, 401);
        }

        throw error;
      }
    }
  )
  .post(
    "/register",
    zValidator("json", registerSchema),
    async (c) => {
      const { name, email, password } = c.req.valid("json");

      const { account } = await createAdminClient();

      try {
        await account.create(
          ID.unique(),
          email,
          password,
          name,
        );
      } catch (error) {
        if (
          error instanceof AppwriteException &&
          (error.type === "user_already_exists" || error.code === 409)
        ) {
          return c.json({ error: "Email already in use" }, 409);
        }

        throw error;
      }

      const session = await account.createEmailPasswordSession(
        email,
        password,
      );

      setCookie(c, AUTH_COOKIE, session.secret, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30,
      });

      return c.json({ success: true });
    }
  )
  .post("/logout", sessionMiddleware, async (c) => {
    const account = c.get("account");

    deleteCookie(c, AUTH_COOKIE);
    await account.deleteSession("current");

    return c.json({ success: true });
  });

export default app;
