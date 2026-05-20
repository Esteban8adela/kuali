export function getCrewCount(adults: number, children: number): number {
  return adults + children > 8 ? 4 : 3;
}
