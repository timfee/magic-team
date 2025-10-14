/**
 * Session-related utility functions
 */

interface SessionWithSettings {
  settings?: { votesPerUser?: number } | null;
}

/**
 * Calculate the maximum possible votes for a session
 * @param session - The session object with settings
 * @param userCount - The number of users in the session
 * @returns The maximum possible votes, or undefined if no limit is set
 */
export const calculateMaxPossibleVotes = (
  session: SessionWithSettings,
  userCount: number,
): number | undefined => {
  if (session.settings?.votesPerUser) {
    return session.settings.votesPerUser * userCount;
  }
  return undefined;
};

/**
 * Generate a user-friendly join code from a session ID
 * @param sessionId - The full session ID
 * @returns A 6-character uppercase code
 */
export const generateJoinCode = (sessionId: string): string => {
  if (!sessionId) return "";
  return sessionId.slice(-6).toUpperCase();
};
