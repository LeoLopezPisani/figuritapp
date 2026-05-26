// src/constants/scanner.ts

export const OCR_DICTIONARY: Record<string, string> = {
  // --- NORMALIZATIONS (Códigos que suelen ser confundidos por el OCR) ---
  NEX: "MEX", // México
  BSA: "RSA", // Sudáfrica
  KOB: "KOR", // Corea del Sur
  OAN: "CAN", // Canadá
  OAT: "QAT", // Qatar
  BBA: "BRA", // Brasil
  MAB: "MAR", // Marruecos
  NAR: "MAR",
  NAB: "MAR",
  SOO: "SCO", // Escocia
  PAB: "PAR", // Paraguay
  TUB: "TUR", // Turquía
  GEB: "GER", // Alemania
  OUW: "CUW", // Curazao
  OIV: "CIV", // Costa de Marfil
  EOU: "ECU", // Ecuador
  EGU: "ECU",
  NEO: "NED", // Países Bajos
  EGV: "EGY", // Egypt
  IBN: "IRN", // Irán
  ESR: "ESP", // España
  OPV: "CPV", // Cabo Verde
  UBU: "URU", // Uruguay
  FBA: "FRA", // Francia
  IRO: "IRQ", // Irak
  IBO: "IRQ",
  IBQ: "IRQ",
  NOB: "NOR", // Noruega
  ABG: "ARG", // Argentina
  AEG: "ARG",
  AOT: "AUT", // Austria
  JOB: "JOR", // Jordania
  POB: "POR", // Portugal
  OOD: "COD", // República Democrática del Congo
  UZR: "UZB", // Uzbekistán
  OOL: "COL", // Colombia
  ORO: "CRO", // Croacia
  CBO: "CRO",
  OBO: "CRO",
  GRA: "GHA", // Ghana
  RAN: "PAN", // Panamá

  // --- BLACKLIST (Falsos positivos del álbum) ---
  CUP: "IGNORE",
  FIF: "IGNORE",
  ROR: "IGNORE",
};

export const STICKER_REGEX = /\b[A-Z]{3}\s*(?:[1-9]|1[0-9]|20)\b/g;
