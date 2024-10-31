import { useEffect } from "react";
import { useAtom } from "jotai";
import {
  activeFileAtom,
  activeTextAtom
} from "./atoms";

export function Editor() {
  const [text, setText] = useAtom(activeTextAtom);
  const [activeFile, setActiveFile] = useAtom(activeFileAtom);

  useEffect(() => {
    if (text.startsWith("# ")) {
      const title = text
        .split("\n")[0]
        .replace("# ", "")
        .replace(/[: ]/g, "-")
        .replace(/--/g, "-");
      // split date from title
      const date = activeFile.slice(0, 19);
      setActiveFile(`${date}-${title}.md`);
    }
  }, [text, activeFile]);

  return (
    <div className="h-full w-full flex flex-col">
      <textarea
        className="flex-grow w-full resize-none bg-transparent px-3 py-2 focus:outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)} />
      <div className="w-full flex">
        <input
          type="text"
          className="flex-grow px-3 py-2 focus:outline-none bg-transparent border-t border-r"
          value={activeFile}
          onChange={(e) => {
            setActiveFile(e.target.value);
          }} />
        <button
          className="px-3 py-2 border-t focus:outline-none underline"
          style={{ color: "var(--gray)" }}
          onClick={async () => {
            await fetch("api/savePost", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileName: activeFile,
                content: text,
              }),
            });
            fetch("api/update");
          }}
        >
          SAVE
        </button>
      </div>
    </div>
  );
}

