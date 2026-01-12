export interface GitStatus {
  id: number;
  projectId: number;
  repoPath: string;
  currentBranch?: string;
  uncommittedChanges: string[];
  aheadCount: number;
  behindCount: number;
  lastChecked?: string;
}
