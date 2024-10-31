// ESM React hook for codemirror with vim and markdown
import build from "build";
import { useEffect, useRef, useState } from "react";

import { Extension } from "@codemirror/state";

const bundle = await build({
  dependencies: {
    "@codemirror/view": "6.28.4",
    "@codemirror/state": "6.4.1",
    "@codemirror/commands": "^6",
    "@codemirror/language": "^6",
    "@codemirror/lang-markdown": "^6",
    "@codemirror/lang-yaml": "^6",
    "@codemirror/lang-javascript": "^6",
    "@replit/codemirror-vim": "^6",
    "@lezer/highlight": "^1.2",
  },
  source: `
    export {
      EditorView,
      crosshairCursor,
      drawSelection,
      dropCursor,
      highlightActiveLine,
      highlightActiveLineGutter,
      highlightSpecialChars,
      keymap,
      rectangularSelection,
      lineNumbers,
      scrollPastEnd,
    } from "@codemirror/view";
    export { EditorState, Prec } from "@codemirror/state";
    export { vim, getCM, Vim } from "@replit/codemirror-vim";
    export {
      history,
      defaultKeymap,
      indentWithTab,
    } from "@codemirror/commands";
    export { markdown, markdownLanguage } from "@codemirror/lang-markdown";
    export { yamlFrontmatter, yaml } from "@codemirror/lang-yaml";
    export {
      syntaxHighlighting,
      foldGutter,
      foldKeymap,
      indentOnInput,
      HighlightStyle,
      StreamLanguage,
    } from "@codemirror/language";
    export { classHighlighter } from "@lezer/highlight";
    export { styleTags, tags } from "@lezer/highlight";
    // export { javascript } from "@codemirror/lang-javascript";
  `,
});

const {
  EditorView,
  EditorState,
  Prec,
  vim,
  getCM,
  Vim,
  keymap,
  defaultKeymap,
  indentWithTab,
  history,
  drawSelection,
  dropCursor,
  rectangularSelection,
  markdown,
  markdownLanguage,
  yamlFrontmatter,
  yaml,
  lineNumbers,
  syntaxHighlighting,
  classHighlighter,
  foldGutter,
  foldKeymap,
  indentOnInput,
  HighlightStyle,
  StreamLanguage,
  scrollPastEnd,
  // javascript,
  // styleTags,
  tags,
} = await import(bundle.url + "?bundle-deps");

export { EditorView, Prec };

const theme: Extension = EditorView.baseTheme({
  "&.cm-focused": {
    outline: "none",
  },
});

// TODO: NOT WORKING markdown highlighting
const frontmatterLanguage = StreamLanguage.define({
  token: (stream) => {
    if (stream.match(/^---/)) {
      stream.skipToEnd();
      return "heading meta"; // "escape";
      // return "meta"; // Highlight YAML delimiters as meta
    }
    if (stream.match(/:.*/)) {
      stream.skipToEnd();
      return "attribute"; // Highlight YAML key-value pairs
    }
    stream.next();
    return null;
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
  yamlFrontmatter({ content: markdown() }),
  markdown({
    base: markdownLanguage,
    // extensions: [yamlFrontmatter({ content: markdown() })],
    // codeLanguages: [ // javascript(), ],
  }),
  theme,
  lineNumbers(),
  foldGutter({
    markerDOM: open => {
      const span = document.createElement("span");
      span.classList.add(open ? "cm-folded" : "cm-unfolded");
      span.textContent = open ? "-" : "+";
      // span.textContent = open ? "▾" : "▸";
      // "▾" : // "▸" : // "▼" : "▶";
      return span;
    },
  }),
  keymap.of(foldKeymap),
  syntaxHighlighting(classHighlighter),
  scrollPastEnd(),
];

export function useCodemirror(initialValue: string = "", extensions: Extension[] = [], nofocus?: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<typeof EditorView | null>(null);

  useEffect(() => {
    if (!ref.current || view) return;
    let v = new EditorView({
      doc: initialValue,
      extensions: [
        ...extensions,
        ...baseExtensions(),
      ],
      parent: ref.current,
    });
    if (!nofocus) v.focus();
    setView(v);
  }, [ref, view]);

  return [ref, view, { getCM, Vim }];
}
