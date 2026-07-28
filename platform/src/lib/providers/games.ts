/**
 * Casino game provider adapter (MVP stub).
 * Real integration: launch URL + signed callbacks for debit/credit.
 */

export type LaunchGameInput = {
  userId: string;
  gameExternalId: string;
  returnUrl: string;
};

export type LaunchGameResult = {
  launchUrl: string;
  sessionId: string;
};

export async function launchGame(input: LaunchGameInput): Promise<LaunchGameResult> {
  const sessionId = `gs_${input.userId.slice(0, 8)}_${input.gameExternalId}`;
  const url = `/games/play?session=${encodeURIComponent(sessionId)}&game=${encodeURIComponent(input.gameExternalId)}`;
  return { launchUrl: url, sessionId };
}
