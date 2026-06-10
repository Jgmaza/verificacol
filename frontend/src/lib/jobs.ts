export type JobStatus =
  | "queued"
  | "downloading"
  | "transcribing"
  | "done"
  | "error";

export interface JobMetadata {
  url?: string;
  title?: string;
  author?: string;
  description?: string;
  duration?: number;
}

export interface TranscriptionJob {
  id: string;
  url: string;
  status: JobStatus;
  messages: string[];
  transcript?: string;
  metadata?: JobMetadata;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export function isJobTerminal(status: JobStatus): boolean {
  return status === "done" || status === "error";
}
