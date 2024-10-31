import ReactMarkdown from "react-markdown";
import { useAtom } from "jotai";
import { activeTextAtom } from "./atoms";

export function Preview() {
  const [text] = useAtom(activeTextAtom);

  return (
    <ReactMarkdown className="h-full w-full px-3 py-2 markdown overflow-auto sans-serif">
      {text}
    </ReactMarkdown>
  );
}

