import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {
  AnalysisPatch,
  Db,
  Link,
  NewLinkInput,
  Submission,
  SubmissionInput,
} from "./types";

// Single-file JSON store under .data/ (gitignored). Dev / single-instance
// only — writes are serialized through a promise chain to avoid races.
// Swap this for a DynamoDB adapter (same Db interface) for production.

interface Shape {
  links: Record<string, Link>;
  submissions: Record<string, Submission>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let writeChain: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<Shape> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Shape>;
    return { links: parsed.links ?? {}, submissions: parsed.submissions ?? {} };
  } catch {
    return { links: {}, submissions: {} };
  }
}

async function writeAll(data: Shape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

/** Serialize a read-modify-write so concurrent requests don't clobber. */
function mutate<T>(fn: (data: Shape) => Promise<T> | T): Promise<T> {
  const next = writeChain.then(async () => {
    const data = await readAll();
    const result = await fn(data);
    await writeAll(data);
    return result;
  });
  // keep the chain alive even if this op rejects
  writeChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function id(bytes: number): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export const localDb: Db = {
  async createLink(input: NewLinkInput): Promise<Link> {
    return mutate((data) => {
      const link: Link = {
        id: id(12),
        ownerToken: input.ownerToken,
        positionLabel: input.positionLabel.trim() || "개발자",
        createdAt: new Date().toISOString(),
        status: "awaiting",
      };
      data.links[link.id] = link;
      return link;
    });
  },

  async getLink(linkId: string): Promise<Link | null> {
    const data = await readAll();
    return data.links[linkId] ?? null;
  },

  async listLinksByOwner(ownerToken: string): Promise<Link[]> {
    const data = await readAll();
    return Object.values(data.links)
      .filter((l) => l.ownerToken === ownerToken)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async saveSubmission(
    linkId: string,
    input: SubmissionInput,
  ): Promise<Submission> {
    return mutate((data) => {
      const submission: Submission = {
        linkId,
        name: input.name.trim(),
        email: input.email.trim(),
        position: input.position.trim(),
        claims: input.claims.trim(),
        githubUrl: input.githubUrl.trim(),
        submittedAt: new Date().toISOString(),
        analysisStatus: "pending",
        analysis: null,
        analysisError: null,
      };
      data.submissions[linkId] = submission;
      const link = data.links[linkId];
      if (link) link.status = "submitted";
      return submission;
    });
  },

  async getSubmission(linkId: string): Promise<Submission | null> {
    const data = await readAll();
    return data.submissions[linkId] ?? null;
  },

  async updateAnalysis(linkId: string, patch: AnalysisPatch): Promise<void> {
    await mutate((data) => {
      const sub = data.submissions[linkId];
      if (!sub) return;
      sub.analysisStatus = patch.analysisStatus;
      if (patch.analysis !== undefined) sub.analysis = patch.analysis;
      if (patch.analysisError !== undefined)
        sub.analysisError = patch.analysisError;
    });
  },
};
