import { useAtom } from "jotai";
import {
  activeFileAtom,
  activeTextAtom,
  saveBoxAtom,
} from "./atoms";
import { useEffect, useState } from "react";
import { domain } from "./consts";
import { getPreview } from "./hooks";

export function MastodonPreview() {
  const [text] = useAtom(activeTextAtom);
  const [file] = useAtom(activeFileAtom);
  const [post, setPost] = useState<any>(null);
  const [, setSaveBox] = useAtom(saveBoxAtom);

  async function handlePost() {
    if (!post) {
      return;
    }

    setSaveBox({
      isSaving: true,
      isDone: false,
      message: "Posting to Mastodon...",
    });

    const postIt = await fetch("api/postToMastodon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ post: post }),
    });

    setSaveBox({
      isSaving: true,
      isDone: true,
      message: "Posted to Mastodon!",
    });

    console.log("posted");
  }

  useEffect(() => {
    async function main() {
      const { excerpt,  url } = getPreview(
        text,
        file,
      );

      let post = {
        status: ("🌱 " + excerpt).slice(0, 300) + "\n" + url,
        visibility: "public",
      };
      setPost(post);
    }
    main();
  }, [domain, file]);

  return post ? (
    <div className="">
      <div className="px-2">
        <button className="uppercase underline" onClick={handlePost}>
          Post
        </button>
      </div>
      <div className="whitespace-pre-wrap px-2 py-1">{post.text}</div>
      <div className="whitespace-pre-wrap border-t px-2 py-1">
        {JSON.stringify(post, null, 2)}
      </div>
    </div>
  ) : null;
}
