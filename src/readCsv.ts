export type ReplayRow = {
  id: number;
  tier: string;
  p1: string;
  p2: string;
  score: string;
  date: string;
  dateMs: number | null;
  link: string;
  team1: string;
  team2: string;
  turns: string;
  winner: string;
};

function parseReplayTimestamp(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    if (trimmed.length === 10) return Number(trimmed) * 1000;
    if (trimmed.length === 13) return Number(trimmed);
    return null;
  }

  const parsedTimestamp = Date.parse(trimmed);
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : null;
}

export async function fetchCSV(filePath: string): Promise<ReplayRow[]> {
  try {
    const response = await fetch(filePath);
    const csvText = await response.text();
    const lines = csvText.split("\r\n");
    const data: ReplayRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length < 10) continue;
      const p1 = values[1];
      const p2 = values[2];
      const winner = values[9];
      const loser = p1 === winner ? p2 : p1;
      let score = values[3];
      if (p1 !== winner) {
        score = score.split("-").reverse().join(" - ");
      }
      const team1 = values[6];
      const team2 = values[7];
      const winningTeam = p1 === winner ? team1 : team2;
      const losingTeam = p1 === winner ? team2 : team1;
      const date = values[4];
      const dateMs = parseReplayTimestamp(date);
      const row: ReplayRow = {
        id: i,
        tier: values[0],
        p1: winner,
        p2: loser,
        score: score,
        date,
        dateMs,
        link: values[5],
        team1: winningTeam,
        team2: losingTeam,
        turns: values[8],
        winner: values[9],
      };
      data.push(row);
    }
    data.sort((a, b) => {
      if (a.dateMs === null && b.dateMs === null) return 0;
      if (a.dateMs === null) return 1;
      if (b.dateMs === null) return -1;
      return b.dateMs - a.dateMs;
    });
    return data;
  } catch (error) {
    console.error("Error fetching or parsing CSV:", error);
    return [];
  }
}
