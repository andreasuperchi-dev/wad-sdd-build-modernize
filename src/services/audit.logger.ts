export function logCuratorAddDuck(duckName: string, timestamp: Date = new Date()): void {
  console.log(`[curator:add-duck] ts=${timestamp.toISOString()} duck=${duckName}`);
}
