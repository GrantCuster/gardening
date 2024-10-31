import { useEffect, useRef, useState } from "react";
import { EditorState, Extension } from "@codemirror/state";
import { vim, getCM, Vim } from "@replit/codemirror-vim";
import { history, defaultKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { classHighlighter } from "@lezer/highlight";
import {
  EditorView,
  drawSelection,
  dropCursor,
  keymap,
  rectangularSelection,
  lineNumbers,
  scrollPastEnd,
} from "@codemirror/view";
import {
  syntaxHighlighting,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";

const theme: Extension = EditorView.baseTheme({
  "&.cm-focused": {
    outline: "none",
  },
});

export const baseExtensions: () => Extension[] = () => [
  vim(),
  keymap.of(defaultKeymap),
  keymap.of([indentWithTab]),
  EditorView.lineWrapping,
  EditorState.allowMultipleSelections.of(true),
  history(),
  drawSelection(),
  dropCursor(),
  rectangularSelection(),
  markdown({
    base: markdownLanguage,
  }),
  theme,
  // lineNumbers(),
  // foldGutter({
  //   markerDOM: (open) => {
  //     const span = document.createElement("span");
  //     span.classList.add(open ? "cm-folded" : "cm-unfolded");
  //     span.textContent = open ? "-" : "+";
  //     return span;
  //   },
  // }),
  // keymap.of(foldKeymap),
  syntaxHighlighting(classHighlighter),
  scrollPastEnd(),
];

export function useCodemirror(
  initialValue: string = "",
  extensions: Extension[] = [],
  nofocus?: boolean,
) {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<typeof EditorView | null>(null);

  useEffect(() => {
    if (!ref.current || view) return;
    let v = new EditorView({
      doc: initialValue,
      extensions: [...baseExtensions(), ...extensions],
      parent: ref.current,
    });
    if (!nofocus) v.focus();
    setView(v);
  }, [ref, view]);

  return [ref, view, { getCM, Vim }];
}
