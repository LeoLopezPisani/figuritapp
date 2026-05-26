import { Country } from "../services/db";

export interface RemoteTradeData {
  missing: Record<string, string[]>;
  duplicates: Record<string, string[]>;
}

export interface MatchSticker {
  id: string;
  number: string;
}

export interface MatchResult {
  canGive: { code: string; stickers: MatchSticker[] }[];
  canReceive: { code: string; stickers: MatchSticker[] }[];
  totalGive: number;
  totalReceive: number;
}

function compressNumbers(strNumbers: string[]): string {
  if (!strNumbers.length) return "";

  // Pasamos a números reales y ordenamos
  const nums = strNumbers.map((n) => parseInt(n, 10)).sort((a, b) => a - b);

  const ranges: string[] = [];
  let start = nums[0];
  let end = nums[0];

  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === end + 1) {
      end = nums[i]; // Continuamos el rango
    } else {
      // Corte de rango: Guardamos y empezamos uno nuevo
      ranges.push(start === end ? start.toString() : `${start}.${end}`);
      start = nums[i];
      end = nums[i];
    }
  }
  // Guardamos el último
  ranges.push(start === end ? start.toString() : `${start}.${end}`);

  return ranges.join(",");
}

function decompressString(str: string): string[] {
  if (!str) return [];
  const result: string[] = [];
  const parts = str.split(",");

  for (const part of parts) {
    if (part.includes(".")) {
      const [startStr, endStr] = part.split(".");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      for (let i = start; i <= end; i++) {
        result.push(i.toString());
      }
    } else {
      result.push(part);
    }
  }
  return result;
}

export function compressAlbumToQR(albumData: Record<string, Country>): string {
  const missingStr: string[] = [];
  const duplicatesStr: string[] = [];

  Object.entries(albumData).forEach(([code, country]) => {
    const missing = country.stickers
      .filter((s) => s.count === 0)
      .map((s) => s.number);
    const duplicates = country.stickers
      .filter((s) => s.count > 1)
      .map((s) => s.number);

    const compressedMissing = compressNumbers(missing);
    const compressedDuplicates = compressNumbers(duplicates);

    if (compressedMissing) missingStr.push(`${code}:${compressedMissing}`);
    if (compressedDuplicates)
      duplicatesStr.push(`${code}:${compressedDuplicates}`);
  });

  return `M:${missingStr.join("-")}|D:${duplicatesStr.join("-")}`;
}

export function parseQRToTradeData(qrString: string): RemoteTradeData | null {
  try {
    const [missingPart, duplicatesPart] = qrString.split("|");

    if (!missingPart?.startsWith("M:") || !duplicatesPart?.startsWith("D:")) {
      return null;
    }

    const parseSection = (sectionStr: string) => {
      const dataStr = sectionStr.substring(2);
      if (!dataStr) return {};

      const result: Record<string, string[]> = {};
      const countries = dataStr.split("-");

      countries.forEach((c) => {
        const [code, ranges] = c.split(":");
        if (code && ranges) {
          result[code] = decompressString(ranges);
        }
      });
      return result;
    };

    return {
      missing: parseSection(missingPart),
      duplicates: parseSection(duplicatesPart),
    };
  } catch (error) {
    console.error("[Trade] Error parsing QR string:", error);
    return null;
  }
}

export function calculateTradeMatch(
  myAlbum: Record<string, Country>,
  remoteData: RemoteTradeData,
): MatchResult {
  const canGive: { code: string; stickers: MatchSticker[] }[] = [];
  const canReceive: { code: string; stickers: MatchSticker[] }[] = [];
  let totalGive = 0;
  let totalReceive = 0;

  Object.entries(myAlbum).forEach(([code, country]) => {
    // Helper para normalizar el string a número entero (quita ceros a la izquierda)
    const normalize = (numStr: string) => parseInt(numStr, 10).toString();

    // 1. ¿Qué le puedo dar? (Mis repetidas vs Sus faltantes)
    const myDuplicates = country.stickers.filter((s) => s.count > 1);
    const hisMissing = remoteData.missing[code] || [];

    // Macheamos comparando los números normalizados, pero conservamos todo el objeto Sticker
    const matchedGive = myDuplicates.filter((s) =>
      hisMissing.includes(normalize(s.number)),
    );

    if (matchedGive.length > 0) {
      canGive.push({
        code,
        stickers: matchedGive.map((s) => ({ id: s.id, number: s.number })),
      });
      totalGive += matchedGive.length;
    }

    // 2. ¿Qué me sirve de él? (Mis faltantes vs Sus repetidas)
    const myMissing = country.stickers.filter((s) => s.count === 0);
    const hisDuplicates = remoteData.duplicates[code] || [];

    const matchedReceive = myMissing.filter((s) =>
      hisDuplicates.includes(normalize(s.number)),
    );

    if (matchedReceive.length > 0) {
      canReceive.push({
        code,
        stickers: matchedReceive.map((s) => ({ id: s.id, number: s.number })),
      });
      totalReceive += matchedReceive.length;
    }
  });

  return { canGive, canReceive, totalGive, totalReceive };
}

export function encodeTradeReceipt(addIds: string[], subIds: string[]): string {
  // Función interna para agrupar IDs ("ARG_1", "MEX_2") en formato comprimido ("ARG:1-MEX:2")
  const groupByIds = (ids: string[]) => {
    const map: Record<string, string[]> = {};
    ids.forEach((id) => {
      const [code, num] = id.split("_");
      if (!map[code]) map[code] = [];
      map[code].push(num);
    });
    const parts: string[] = [];
    Object.entries(map).forEach(([code, nums]) => {
      parts.push(`${code}:${compressNumbers(nums)}`);
    });
    return parts.join("-");
  };

  // T = Trade | ADD = Lo que el otro suma | SUB = Lo que el otro resta
  return `T:ADD:${groupByIds(addIds)}|SUB:${groupByIds(subIds)}`;
}

export function decodeTradeReceipt(
  qrString: string,
): { addIds: string[]; subIds: string[] } | null {
  if (!qrString.startsWith("T:")) return null; // Si no es un recibo, ignoramos

  try {
    const content = qrString.substring(2);
    const [addPart, subPart] = content.split("|");

    const parsePart = (part: string) => {
      if (!part) return [];
      const dataStr = part.substring(4); // Saca el "ADD:" o "SUB:"
      if (!dataStr) return [];

      const ids: string[] = [];
      const countries = dataStr.split("-");
      countries.forEach((c) => {
        if (!c) return;
        const [code, ranges] = c.split(":");
        const nums = decompressString(ranges);
        nums.forEach((n) => ids.push(`${code}_${n}`));
      });
      return ids;
    };

    return {
      addIds: parsePart(addPart),
      subIds: parsePart(subPart),
    };
  } catch (error) {
    console.error("[Trade] Error parsing receipt:", error);
    return null;
  }
}
