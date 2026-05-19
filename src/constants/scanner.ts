// src/constants/scanner.ts

export const OCR_DICTIONARY: Record<string, string> = {
  // --- NORMALIZATIONS (Códigos que suelen ser confundidos por el OCR) ---
  OAT: "QAT", // Qatar
  IRO: "IRQ", // Irak
  EOU: "ECU", // Ecuador
  EGU: "ECU",
  URO: "URU", // Uruguay
  ORU: "URU",
  ORO: "URU",

  // --- BLACKLIST (Falsos positivos del álbum) ---
  CUP: "IGNORE",
  FIF: "IGNORE",
};

export const STICKER_REGEX = /\b[A-Z]{3}\s*(?:[1-9]|1[0-9]|20)\b/g;
