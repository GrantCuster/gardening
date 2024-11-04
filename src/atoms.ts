import AtpAgent from "@atproto/api";
import { atom } from "jotai";

export const modeAtom = atom("editor");
export const activeTextAtom = atom("");
export const activeFileAtom = atom("");

export const isPhoneAtom = atom(false);
export const isNarrowAtom = atom(false);
export const showSidePreviewAtom = atom(true);

export const showPostPickerAtom = atom(false);

export const bumpAtom = atom(0);

export const showBlueskyPreviewAtom = atom(false);

export const agentRefAtom = atom<{ current: AtpAgent | null }>({
  current: null,
});

export const saveBoxAtom = atom({ isSaving: false, isDone: false, message: "Saving post..." });
