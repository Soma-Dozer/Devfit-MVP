import type { Db } from "./types";
import { localDb } from "./local";

// Single switch point for the persistence backend.
// Today: local JSON file store (zero cloud cost).
// Later: return a DynamoDB-backed adapter implementing the same `Db`
// interface when an AWS account is confirmed (see plan / README).
export function getDb(): Db {
  return localDb;
}

export type { Db } from "./types";
