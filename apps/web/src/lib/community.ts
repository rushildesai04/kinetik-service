const CONNECTIONS_KEY = "kinetik_connections";
const LOCATION_KEY = "kinetik_share_location";
const RADIUS_KEY = "kinetik_radius";

export interface CommunityAthlete {
  id: string;
  name: string;
  distance: string;
  injury: string;
  sport: string;
  week: number;
  active: boolean;
}

export const nearbyAthletes: CommunityAthlete[] = [
  { id: "alex", name: "Alex M.", distance: "2.4 mi", injury: "ACL Reconstruction", sport: "Soccer", week: 8, active: true },
  { id: "priya", name: "Priya S.", distance: "4.1 mi", injury: "Patellar Tendinitis", sport: "Running", week: 14, active: false },
  { id: "jordan", name: "Jordan K.", distance: "6.8 mi", injury: "Ankle Sprain", sport: "Basketball", week: 5, active: true },
  { id: "sam", name: "Sam T.", distance: "8.2 mi", injury: "Hamstring Strain", sport: "Track", week: 11, active: true },
];

export function getConnections(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = localStorage.getItem(CONNECTIONS_KEY);
  return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
}

export function toggleConnection(id: string): boolean {
  const connections = getConnections();
  if (connections.has(id)) {
    connections.delete(id);
  } else {
    connections.add(id);
  }
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify([...connections]));
  return connections.has(id);
}

export function getShareLocation(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(LOCATION_KEY);
  return raw === null ? true : raw === "true";
}

export function setShareLocation(value: boolean) {
  localStorage.setItem(LOCATION_KEY, String(value));
}

export function getRadius(): number {
  if (typeof window === "undefined") return 10;
  const raw = localStorage.getItem(RADIUS_KEY);
  return raw ? Number(raw) : 10;
}

export function setRadius(value: number) {
  localStorage.setItem(RADIUS_KEY, String(value));
}

export function filterByRadius(athletes: CommunityAthlete[], radius: number) {
  return athletes.filter((a) => parseFloat(a.distance) <= radius);
}
