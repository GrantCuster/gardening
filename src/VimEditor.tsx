import { useEffect } from "react";
import { useAtom } from "jotai";
import { activeTextAtom } from "./atoms";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { useCodemirror } from "./useCodemirrorVim";

function VimEditor() {
  const [text, setText] = useAtom(activeTextAtom);
  const [ref, view, { Vim }] = useCodemirror(
    text,
    [
      EditorView.updateListener.of((v: ViewUpdate) => {
        if (v.docChanged) {
          const next = v.state.doc.toString();
          setText(next);
        }
      }),
    ],
    true
  );
  Vim.defineEx("write", "w", function() {
    // todo: make backend adapter
    console.log("TODO SAVE", doc.length);
    // todo: use string encoder api
    // const params = new URLSearchParams();
    // params.set("d", comp);
    // history.pushState(null, "", "?" + params.toString());
  });

  // const cycleColor = () => {
  //   const next = (colorIndex + 1) % colors.length;
  //   setColorIndex(next);
  //   setCookie("color", next);
  // };
  // const color = useMemo(() => colors[colorIndex], [colorIndex]);
  useEffect(() => {
    view?.on("vim-mode-change", (e: any) => {
      console.log("vim-mode-change", e);
    });
  }, []);

  // const handleKeyDown = (e: React.KeyboardEvent) => {
  //   // check for insert mode?
  //   console.log("view.cm.state.vim", view.cm.state.vim.mode);
  //   if (e.key === "Escape") {
  //     if (!view.cm.state.vim.insertMode) {
  //       setPreview(false);
  //     }
  //   }
  //   if (e.metaKey) {
  //     if (e.key === "p") {
  //       e.preventDefault();
  //       setPreview(!preview);
  //     }
  //   }
  // };
  // const time = new Date().toLocaleDateString().replace(/\//g, "-");
  return (
    <div
      ref={ref}
      className="h-full resize-none bg-transparent px-3 py-2 focus:outline-none text-sm" />
  );
}

