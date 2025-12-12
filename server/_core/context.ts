import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Check for DEV_MODE - bypass authentication in local development
  if (process.env.DEV_MODE === "true") {
    user = {
      id: parseInt(process.env.DEV_USER_ID || "1"),
      openId: "dev_" + (process.env.DEV_USER_ID || "1"),
      name: process.env.DEV_USER_NAME || "Developer",
      email: process.env.DEV_USER_EMAIL || "dev@localhost",
      loginMethod: "dev_mode",
      role: "admin" as const, // Give admin role in dev mode
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
