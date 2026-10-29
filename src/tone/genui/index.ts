// Gerado de toneorg/extension@8a4566efcee8 (packages/genui-react/src/index.ts). Não edite aqui.
// The generated components of the tone, drawn once for every surface: the
// extension's side panel and the web. Each surface passes a GenUIHost that
// decides what a button does; the drawings never reach a store or the server.
export { AssistantMessage, GenUIBlock, library } from "./AssistantMessage";
export { RENDERERS } from "./components";
export { DecisionBoardLoader, DecisionBoardView } from "./DecisionBoard";
export { fitVerdict, recommendedCase, wristWidthMm } from "./fit";
export { brl, shortDate } from "./format";
export {
  type Answer,
  type DecisionAccess,
  type GenUIAction,
  GenUIContext,
  type GenUIHost,
  safeImage,
  useHost,
  type WatchAccess,
} from "./host";
export { Icon, type IconName } from "./Icon";
export { WatchDraftLoader, WatchDraftView } from "./WatchDraft";
export { Fit, REJECT_REASONS, type RejectReason } from "./wrist";
