import type { AnalysisResult } from "@/lib/types";

// ──────────────────────────────────────────────────────────────
// Platform persistence contract. The local file store implements
// this; a DynamoDB adapter can implement the same interface later.
// ──────────────────────────────────────────────────────────────

export type AnalysisStatus = "empty" | "pending" | "running" | "done" | "error";

/** An interview invite created by an interviewer. One link = one candidate. */
export interface Link {
  id: string; // unguessable, used in the share URL /submit/{id}
  ownerToken: string; // interviewer identity (cookie-based, no login)
  positionLabel: string; // e.g. "백엔드 엔지니어 (신입)"
  createdAt: string; // ISO
  status: "awaiting" | "submitted"; // has the candidate submitted yet?
}

/** The candidate's submission against a link, plus analysis lifecycle. */
export interface Submission {
  linkId: string;
  name: string;
  email: string;
  position: string; // what the candidate typed they're applying for
  claims: string; // free-text resume / experience claims
  githubUrl: string;
  submittedAt: string; // ISO
  analysisStatus: AnalysisStatus;
  analysis: AnalysisResult | null;
  analysisError: string | null;
}

export interface NewLinkInput {
  ownerToken: string;
  positionLabel: string;
}

export interface SubmissionInput {
  name: string;
  email: string;
  position: string;
  claims: string;
  githubUrl: string;
}

export interface AnalysisPatch {
  analysisStatus: AnalysisStatus;
  analysis?: AnalysisResult | null;
  analysisError?: string | null;
}

export interface Db {
  createLink(input: NewLinkInput): Promise<Link>;
  getLink(id: string): Promise<Link | null>;
  listLinksByOwner(ownerToken: string): Promise<Link[]>;
  saveSubmission(linkId: string, input: SubmissionInput): Promise<Submission>;
  getSubmission(linkId: string): Promise<Submission | null>;
  updateAnalysis(linkId: string, patch: AnalysisPatch): Promise<void>;
}
