import { useEffect, useState } from "react";
import { formatBytes } from "./utils";

export const Library = ({ bump }: { bump: number }) => {
  bump; // to silence the unused variable warning
  const [files, setFiles] = useState<
    { Key: string; Size: number; LastModified: string }[]
  >([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("api/list-objects");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setFiles(data);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, [bump]);

  const limited = files.slice(0, 120);
  const grouped = [];
  let lastRoot = "";
  for (let i = 0; i < limited.length; i++) {
    const file = limited[i];
    const root = file.Key.replace("-800.", "").replace("-2000.", "");
    if (root !== lastRoot) {
      grouped.push([file]);
    } else {
      if (file.Key.includes("-800.")) {
        grouped[grouped.length - 1].unshift(file);
      } else {
        grouped[grouped.length - 1].push(file);
      }
    }
    lastRoot = root;
  }

  function isImage(file: { Key: string }) {
    return (
      file.Key.includes(".jpg") ||
      file.Key.includes(".jpeg") ||
      file.Key.includes(".png")
    );
  }

  function isGif(file: { Key: string }) {
    return file.Key.includes(".gif");
  }

  function isVideo(file: { Key: string }) {
    return file.Key.includes(".mp4");
  }

  function isAudio(file: { Key: string }) {
    return file.Key.includes(".mp3");
  }

  return (
    <div className="text-sm">
      <div className="flex flex-col gap-3 pb-3 pt-3">
        {grouped.slice(0, 20).map((group, index) => (
          <div key={index} className="flex flex-col border-b pb-3 px-3">
            {group.map((file, index) => {
              const isMain = !(isImage(file) && !file.Key.includes("-800"));
              return (
                <div key={index} className="full text-sm flex flex-col gap-1">
                  <div className="flex">
                    <div>
                      {isImage(file) && !file.Key.includes("-2000")
                        ? "IMAGE"
                        : null}
                      {isGif(file) ? "GIF" : null}
                      {isVideo(file) ? "VIDEO" : null}
                      {isAudio(file) ? "AUDIO" : null}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {isMain
                        ? "  " + new Date(file.LastModified).toLocaleString()
                        : null}
                    </div>
                  </div>
                  {(isImage(file) && !file.Key.includes("-2000")) ||
                  isGif(file) ? (
                    <div>
                      <img
                        className="my-1"
                        src={`https://grant-uploader.s3.amazonaws.com/${file.Key}`}
                      />
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <div className="whitespace-pre-wrap w-full">
                      {file.Key.includes("-800") ? "800px  " : null}
                      {file.Key.includes("-2000") ? "2000px " : null}
                      {formatBytes(file.Size)}
                    </div>
                    <CopyItem file={file} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export function CopyItem({ file }: { file: { Key: string } }) {
  const [copied, setCopied] = useState(false);

  return copied ? (
    <div style={{ color: "var(--gray)" }}>copied</div>
  ) : (
    <button
      className="underline pl-4"
      style={{ color: "var(--gray)" }}
      onClick={() => {
        navigator.clipboard.writeText(
          `https://grant-uploader.s3.amazonaws.com/${file.Key}`,
        );
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1000);
      }}
    >
      copy
    </button>
  );
}
