import ReactMarkdown from "react-markdown";
import { useAtom } from "jotai";
import { activeTextAtom } from "./atoms";

function MarkdownImageWithCaption({ alt, src }: { alt: string; src: string }) {
  return (
    <figure>
      <img src={src} alt={alt} />
      {alt && <figcaption>{alt}</figcaption>}
    </figure>
  );
}

export function Preview() {
  const [text] = useAtom(activeTextAtom);

  return (
    <ReactMarkdown
      className="h-full w-full px-3 py-2 markdown overflow-auto sans-serif"
      components={{
        img: ({ node, ...props }) => <MarkdownImageWithCaption {...props} />,
        p: ({ node, ...props }) => <div {...props} className="my-4" />,
      }}
   >
      {text}
    </ReactMarkdown>
  );
}
