import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import {
  activeFileAtom,
  activeTextAtom,
  isPhoneAtom,
  showPostPickerAtom,
} from "./atoms";

export function PostPicker() {
  const setText = useAtom(activeTextAtom)[1];
  const setActiveFile = useAtom(activeFileAtom)[1];
  const [posts, setPosts] = useState<string[]>([]);
  const setShowPostPicker = useAtom(showPostPickerAtom)[1];
  const [pickIndex, setPickIndex] = useState(0);
  const [previewText, setPreviewText] = useState("");
  const [isPhone] = useAtom(isPhoneAtom);

  useEffect(() => {
    const fetchPosts = async () => {
      const response = await fetch("api/listPosts");
      const text = await response.text();
      setPosts(text.trim().split("\n").reverse());
    };
    fetchPosts();
  }, []);

  const pickIndexRef = useRef(pickIndex);
  pickIndexRef.current = pickIndex;

  useEffect(() => {
    function handleArrowKeys(e: KeyboardEvent) {
      if (e.key === "ArrowUp") {
        setPickIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowDown") {
        setPickIndex((prev) => Math.min(posts.length - 1, prev + 1));
      } else if (e.key === "Enter") {
        const post = posts[pickIndexRef.current];
        fetch(`api/getPost?fileName=${post}`)
          .then((response) => response.text())
          .then((text) => {
            setText(text);
            setShowPostPicker(false);
          });
      } else if (e.key === "Backspace") {
        if (confirm("Delete this post?")) {
          fetch(`api/deletePost`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: posts[pickIndexRef.current],
            }),
          }).then(() => {
            console.log("deleted");
            fetch("api/update");
            setPosts((prev) =>
              prev.filter((_, index) => index !== pickIndexRef.current),
            );
            setPickIndex((prev) => Math.min(prev, posts.length - 1));
          });
        }
      } else if (e.key === "Escape") {
        setShowPostPicker(false);
      }
    }
    window.addEventListener("keydown", handleArrowKeys);
    return () => {
      window.removeEventListener("keydown", handleArrowKeys);
    };
  }, [posts]);

  const previewDelay = 200;
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isPhone && posts) {
        const post = posts[pickIndex];
        if (post) {
          fetch(`api/getPost?fileName=${post}`)
            .then((response) => response.text())
            .then((text) => {
              setPreviewText(text);
            });
        }
      }
    }, previewDelay);
    return () => {
      clearTimeout(timer);
    };
  }, [isPhone, posts, pickIndex]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      onClick={() => setShowPostPicker(false)}
    >
      <div
        className="absolute w-full flex flex-col max-w-[130ch] text-sm border h-[80vh] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ backgroundColor: "var(--bg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1 border-b">POSTS</div>
        <div className="flex-grow overflow-auto flex">
          <div className="w-1/2 overflow-auto py-0.5">
            {posts.map((post, index) => (
              <button
                key={post}
                className={`px-2 py-0.5 block w-full text-left`}
                style={{
                  backgroundColor:
                    pickIndex === index ? "var(--gray)" : "var(--bg)",
                  color: pickIndex === index ? "var(--bg)" : "var(--fg)",
                }}
                onClick={async () => {
                  const response = await fetch(`api/getPost?fileName=${post}`);
                  const text = await response.text();
                  setText(text);
                  setActiveFile(post);
                  setShowPostPicker(false);
                }}
              >
                {post}
              </button>
            ))}
          </div>
          {!isPhone ? (
            <div className="border-l w-1/2 overflow-auto whitespace-pre-wrap px-2 py-1">
              {previewText}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
