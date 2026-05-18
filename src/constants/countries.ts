// src/constants/countries.ts

export interface CountryMeta {
  name: string;
  group: string;
  orderIndex: number;
  total: number;
  specialStickers?: string[];
}

export const COUNTRY_METADATA: Record<string, CountryMeta> = {
  FWC: {
    name: "FIFA World Cup",
    group: "Intro",
    orderIndex: 0,
    total: 19,
    specialStickers: ["FWC_00"],
  },
  MEX: { name: "Mexico", group: "Group A", orderIndex: 1, total: 20 },
  RSA: { name: "South Africa", group: "Group A", orderIndex: 2, total: 20 },
  KOR: { name: "South Korea", group: "Group A", orderIndex: 3, total: 20 },
  CZE: { name: "Czech Republic", group: "Group A", orderIndex: 4, total: 20 },
  CAN: { name: "Canada", group: "Group B", orderIndex: 5, total: 20 },
  BIH: {
    name: "Bosnia and Herzegovina",
    group: "Group B",
    orderIndex: 6,
    total: 20,
  },
  QAT: { name: "Qatar", group: "Group B", orderIndex: 7, total: 20 },
  SUI: { name: "Switzerland", group: "Group B", orderIndex: 8, total: 20 },
  BRA: { name: "Brasil", group: "Group C", orderIndex: 9, total: 20 },
  MAR: { name: "Morocco", group: "Group C", orderIndex: 10, total: 20 },
  HAI: { name: "Haiti", group: "Group C", orderIndex: 11, total: 20 },
  SCO: { name: "Scotland", group: "Group C", orderIndex: 12, total: 20 },
  USA: { name: "United States", group: "Group D", orderIndex: 13, total: 20 },
  PAR: { name: "Paraguay", group: "Group D", orderIndex: 14, total: 20 },
  AUS: { name: "Australia", group: "Group D", orderIndex: 15, total: 20 },
  TUR: { name: "Turkey", group: "Group D", orderIndex: 16, total: 20 },
  GER: { name: "Germany", group: "Group E", orderIndex: 17, total: 20 },
  CUW: { name: "Curacao", group: "Group E", orderIndex: 18, total: 20 },
  CIV: { name: "Ivory Coast", group: "Group E", orderIndex: 19, total: 20 },
  ECA: { name: "Ecuador", group: "Group E", orderIndex: 20, total: 20 },
  NED: { name: "Netherlands", group: "Group F", orderIndex: 21, total: 20 },
  JPN: { name: "Japan", group: "Group F", orderIndex: 22, total: 20 },
  TUN: { name: "Tunisia", group: "Group F", orderIndex: 23, total: 20 },
  SWE: { name: "Sweden", group: "Group F", orderIndex: 24, total: 20 },
  BEL: { name: "Belgium", group: "Group G", orderIndex: 25, total: 20 },
  EGY: { name: "Egypt", group: "Group G", orderIndex: 26, total: 20 },
  IRN: { name: "Iran", group: "Group G", orderIndex: 27, total: 20 },
  NZL: { name: "New Zealand", group: "Group G", orderIndex: 28, total: 20 },
  ESP: { name: "Spain", group: "Group H", orderIndex: 29, total: 20 },
  CPV: { name: "Cape Verde", group: "Group H", orderIndex: 30, total: 20 },
  KSA: { name: "Saudi Arabia", group: "Group H", orderIndex: 31, total: 20 },
  URU: { name: "Uruguay", group: "Group H", orderIndex: 32, total: 20 },
  FRA: { name: "France", group: "Group I", orderIndex: 33, total: 20 },
  SEN: { name: "Senegal", group: "Group I", orderIndex: 34, total: 20 },
  IRQ: { name: "Iraq", group: "Group I", orderIndex: 35, total: 20 },
  NOR: { name: "Norway", group: "Group I", orderIndex: 36, total: 20 },
  ARG: { name: "Argentina", group: "Group J", orderIndex: 37, total: 20 },
  DZA: { name: "Algeria", group: "Group J", orderIndex: 38, total: 20 },
  AUT: { name: "Austria", group: "Group J", orderIndex: 39, total: 20 },
  JOR: { name: "Jordan", group: "Group J", orderIndex: 40, total: 20 },
  POR: { name: "Portugal", group: "Group K", orderIndex: 41, total: 20 },
  COD: { name: "DR Congo", group: "Group K", orderIndex: 42, total: 20 },
  UZB: { name: "Uzbekistan", group: "Group K", orderIndex: 43, total: 20 },
  COL: { name: "Colombia", group: "Group K", orderIndex: 44, total: 20 },
  ENG: { name: "England", group: "Group L", orderIndex: 45, total: 20 },
  CRO: { name: "Croatia", group: "Group L", orderIndex: 46, total: 20 },
  GHA: { name: "Ghana", group: "Group L", orderIndex: 47, total: 20 },
  PAN: { name: "Panama", group: "Group L", orderIndex: 48, total: 20 },
};
