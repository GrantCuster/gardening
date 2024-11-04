import { useAtom } from "jotai";
import { activeFileAtom, activeTextAtom, agentRefAtom, saveBoxAtom } from "./atoms";
import { RichText } from "@atproto/api";
import { AtpAgent } from "@atproto/api";
import { useEffect, useState } from "react";
import { domain } from "./consts";
import { usePostPreview } from "./hooks";

function useAgent() {
  const [agentRef] = useAtom(agentRefAtom);

  async function main() {
    if (!agentRef.current) {
      agentRef.current = new AtpAgent({
        service: "https://bsky.social",
      });
    }
  }

  main();
}

export function BlueskyPreview() {
  useAgent();
  const [agentRef] = useAtom(agentRefAtom);
  const [text] = useAtom(activeTextAtom);
  const [file] = useAtom(activeFileAtom);
  const [post, setPost] = useState<any>(null);
  const getPreview = usePostPreview();
  const [, setSaveBox] = useAtom(saveBoxAtom);

  async function handlePost() {
    if (!post) {
      return;
    }

    setSaveBox({
      isSaving: true,
      isDone: false,
      message: "Posting to Bluesky...",
    });

    const postIt = await fetch("api/postToBluesky", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ post: post }),
    });

    console.log(postIt);
    setSaveBox({
      isSaving: true,
      isDone: true,
      message: "Posted to Bluesky!",
    });

    console.log("posted");
  }

  useEffect(() => {
    async function main() {
      const { excerpt, title, description, previewImage, url } = getPreview(
        text,
        file,
      );

      const rt = new RichText({
        text: ("🌱 " + excerpt).slice(0, 300),
      });
      await rt.detectFacets(agentRef.current!);

      let post = {
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        embed: {
          $type: "app.bsky.embed.external",
          external: {
            uri: url,
            title: title,
            description: description,
            thumb: previewImage,
          },
        },
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
