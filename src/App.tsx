import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import {
  activeFileAtom,
  bumpAtom,
  isNarrowAtom,
  isPhoneAtom,
  modeAtom,
  saveBoxAtom,
  showBlueskyPreviewAtom,
  showMastodonPreviewAtom,
  showPostPickerAtom,
  showSidePreviewAtom,
} from "./atoms";
import { BlueskyPreview } from "./BlueskyPreview";
import { MastodonPreview } from "./MastodonPreview";
import { UploaderButton } from "./UploaderButton";
import { PostPicker } from "./PostPicker";
import { Preview } from "./Preview";
import { Editor } from "./Editor";
import { Library } from "./Library";

function App() {
  const [bump] = useAtom(bumpAtom);
  const [showLibrary, setShowLibrary] = useState(true);
  const [mode, setMode] = useAtom(modeAtom);
  const [isPhone, setIsPhone] = useAtom(isPhoneAtom);
  const [isNarrow, setIsNarrow] = useAtom(isNarrowAtom);
  const [showPreviewChoice, setShowPreviewChoice] =
    useAtom(showSidePreviewAtom);
  const [showPostPicker, setShowPostPicker] = useAtom(showPostPickerAtom);
  const [activeFile, setActiveFile] = useAtom(activeFileAtom);
  const [showBlueskyPreview, setShowBlueskyPreview] = useAtom(
    showBlueskyPreviewAtom,
  );
  const [showMastodonPreview, setShowMastodonPreview] = useAtom(
    showMastodonPreviewAtom,
  );
  const [saveBox, setSaveBox] = useAtom(saveBoxAtom);

  useEffect(() => {
    // format YYYY-MM-DD-HH-MM-SS
    const date = new Date(Date.now());
    const formattedDate = date.toISOString().slice(0, 19).replace(/[:T]/g, "-");
    setActiveFile(formattedDate + ".md");
  }, []);

  useEffect(() => {
    const phoneSize = 500;
    const narrowSize = 1000;
    const handleResize = () => {
      const width = window.innerWidth;
      setIsNarrow(width <= narrowSize);
      setIsPhone(width <= phoneSize);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setIsPhone, setIsNarrow]);

  const showSidePreviewPossible =
    !isPhone && (!isNarrow || (isNarrow && !showLibrary));
  const showSidePreview = showPreviewChoice && showSidePreviewPossible;
  const overlayLibrary = isPhone;

  const showPreviewInEditor = mode !== "editor" && !showSidePreviewPossible;
  const showBlueSkyPreviewInEditor = showBlueskyPreview;
  const showMastodonPreviewInEditor = showMastodonPreview;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <div className="flex justify-between select-none">
        <button
          onClick={() => setShowLibrary(!showLibrary)}
          className="underline px-3 py-1 text-sm focus:outline-none"
          style={{ color: "var(--gray)" }}
        >
          LIBRARY
        </button>

        <div>GARDENING</div>

        {showSidePreviewPossible ? (
          <button
            onClick={() => setShowPreviewChoice(!showPreviewChoice)}
            className="underline px-3 py-1 text-sm focus:outline-none"
            style={{ color: "var(--gray)" }}
          >
            PREVIEW
          </button>
        ) : (
          <div></div>
        )}
      </div>

      <div className="flex-grow flex overflow-hidden">
        {showLibrary ? (
          <div className="w-[320px] flex-shrink-0 flex flex-col overflow-hidden">
            <UploaderButton />
            <div className="flex-grow overflow-auto">
              <Library bump={bump} />
            </div>
          </div>
        ) : null}
        <div
          className="flex w-full mx-auto"
          style={{
            maxWidth: showSidePreview ? "120ch" : "60ch",
          }}
        >
          <div className="text-sm w-full border flex flex-col">
            <div className="flex">
              <button
                onClick={async () => {
                  setShowPostPicker(true);
                }}
                className="underline px-2 py-1 text-sm focus:outline-none"
                style={{ color: "var(--gray)" }}
              >
                OPEN
              </button>
              <button
                onClick={() => setShowPreviewChoice(!showPreviewChoice)}
                className="underline px-2 py-1 text-sm"
                style={{ color: "var(--gray)" }}
              >
                NEW
              </button>

              {!showSidePreviewPossible && (
                <>
                  <button
                    className={`px-2 py-1 uppercase ${mode === "preview" ? "underline" : ""}`}
                    style={{ color: "var(--gray)" }}
                    onClick={() => setMode("editor")}
                  >
                    Editor
                  </button>
                  <button
                    className={`px-2 py-1 uppercase ${mode === "editor" ? "underline" : ""}`}
                    style={{ color: "var(--gray)" }}
                    onClick={() => setMode("preview")}
                  >
                    Preview
                  </button>
                </>
              )}

              <button
                onClick={() => setShowBlueskyPreview(!showBlueskyPreview)}
                className="px-2 py-1 text-sm focus:outline-none"
                style={{
                  color: "var(--gray)",
                  textDecoration: showBlueskyPreview ? "" : "underline",
                }}
              >
                BLUESKY
              </button>

              <button
                onClick={() => setShowMastodonPreview(!showMastodonPreview)}
                className="px-2 py-1 text-sm uppercase focus:outline-none"
                style={{
                  color: "var(--gray)",
                  textDecoration: showMastodonPreview ? "" : "underline",
                }}
              >
                Mastodon
              </button>
 
            </div>
            {showBlueSkyPreviewInEditor ? (
              <BlueskyPreview />
            ) : showMastodonPreviewInEditor ? (
              <MastodonPreview />
            ) : showPreviewInEditor ? (
              <Preview />
            ) : (
              <Editor />
            )}
          </div>
          {showSidePreview && <Preview />}
        </div>
      </div>
      {showPostPicker ? <PostPicker /> : null}
      {saveBox.isSaving ? <SaveBox /> : null}
    </div>
  );
}

export default App;

function SaveBox() {
  const [progress, setProgress] = useState(0);
  const [saveBox, setSaveBox] = useAtom(saveBoxAtom);
  const intervalRef = useRef<number>();

  useEffect(() => {
    setProgress(0);
    intervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev === 90) {
          window.clearInterval(intervalRef.current);
        } else {
          clearInterval(intervalRef.current);
        }
        return prev + 1;
      });
    }, 20);
    return () => {
      window.clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (saveBox.isDone) {
      setProgress(100);
      window.setTimeout(() => {
        setSaveBox({ isSaving: false, isDone: false, message: "" });
      }, 1000);
    }
  }, [saveBox.isDone, setSaveBox]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-10 flex">
      <div
        className="m-auto flex flex-col gap-2 items-center bg-neutral-800 w-full border px-3 py-2"
        style={{ maxWidth: "60ch" }}
      >
        <div className="text-center">{saveBox.message}</div>
        <div
          className="w-full mb-2 relative"
          style={{
            maxWidth: "20ch",
            height: "1.25rem",
            background: "var(--gray)",
          }}
        >
          <div
            className="h-full absolute left-0 top-0"
            style={{
              width: `${progress}%`,
              background: "var(--green)",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}

