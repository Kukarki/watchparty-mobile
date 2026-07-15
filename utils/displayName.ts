export function nameFor(
  userId: string,
  realName: string,
  nicknames?: Record<string, string> | null
): string {
  return nicknames?.[userId] ?? realName;
}
