import { useAtom } from "jotai";
import { activeFileAtom, activeTextAtom, agentRefAtom } from "./atoms";
import { RichText } from "@atproto/api";
import { AtpAgent } from "@atproto/api";
import { useEffect, useState } from "react";

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

  // TODO own file
  const domain = "https://garden.grantcuster.com";

  async function handlePost() {
    if (!post) {
      return;
    }

    const postIt = await fetch("api/postToBluesky", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ post: post }),
    });

    console.log(postIt);

    console.log("posted");
  }

  useEffect(() => {
    async function main() {
      const firstLine = text.split("\n")[0];
      const title = firstLine.startsWith("#")
        ? firstLine.slice(1).trim()
        : new Date().toLocaleString();

      // Text stripped of images
      let stripped = text
        .replace(/!\[.*\]\(.*\)/g, "")
        .replace(/\*/g, "")
        .replace(/#/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 2)
        .join("\n");

      // Change markdown links to: text (link)
      const markdownLinks = stripped.match(/\[.*\]\(.*\)/g);
      if (markdownLinks) {
        for (const link of markdownLinks) {
          const parts = link.slice(1, -1).split("](");
          if (parts[1].startsWith("http")) {
            stripped = stripped.replace(link, parts[0] + " (" + parts[1] + ")");
          } else {
            stripped = stripped.replace(link, parts[0]);
          }
        }
      }

      const rt = new RichText({
        text: stripped.slice(0, 300),
      });
      await rt.detectFacets(agentRef.current!);

      // match images based on markdown syntax
      const images = text.match(/!\[.*\]\(.*\)/g);
      const firstImage = images
        ? images[0]
        : "https://grant-uploader.s3.amazonaws.com/2024-10-30-10-48-30-2000.jpg";

      let previewImage = firstImage?.split("(")[1].split(")")[0]!;
      if (previewImage.includes(".gif")) {
        previewImage = previewImage.replace(".gif", "-preview.jpg");
      }
      previewImage = previewImage.replace(
        "https://grant-uploader.s3.amazonaws.com/",
        "",
      );

      let post = {
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        embed: {
          $type: "app.bsky.embed.external",
          external: {
            uri: domain + "/" + file.split(".")[0] + "/",
            title: title,
            description: firstImage
              ? firstImage.split("]")[0].slice(2)
              : "Post on Grant's Garden",
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
