export { default as hsLookupRouter } from "./routes.js";
export { classifyGoods, explainCoverage } from "./classify.js";
export { DISCLAIMER, DUTY_NOTE, catalogStats, getIndex } from "./catalog.js";
export {
  searchHs,
  lookupByCode,
  listChapters,
  listByChapter,
  childrenOf,
} from "./search.js";
export type {
  HsEntry,
  HsHit,
  HsChapter,
  ClassifyRequest,
  ClassifyResult,
  PrimaryRecommendation,
  RuledOutLine,
  DeskVerdict,
  AmbiguityInfo,
  CompareLine,
  ChaHandoffRequest,
  TradeFlow,
  NeoDeskPrecedentInfo,
  ClientActionPack,
  DeskAuthenticity,
  NeoDeskCargoLine,
} from "./types.js";
export { getNeoDeskPrecedents, matchNeoDeskPrecedents } from "./neo-desk-precedents.js";
export { listNeoDeskCargo, buildClientActionPack } from "./client-pack.js";
