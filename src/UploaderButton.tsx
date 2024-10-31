import { useState } from "react";
import axios from "axios";
import { useAtom } from "jotai";
import { bumpAtom } from "./atoms";

export function UploaderButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [bump, setBump] = useAtom(bumpAtom);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
      } catch (error) {
        // @ts-ignore
        setUploadStatus(`Error uploading file: ${error.message}`);
      }
      setIsUploading(false);

      try {
        setIsUploading(true);

        let endpoint = "";
        switch (file.type) {
          case "image/jpeg":
          case "image/png":
            endpoint = "api/upload/image";
            break;
          case "image/gif":
            endpoint = "api/upload/gif";
            break;
          case "video/mp4":
            endpoint = "api/upload/video";
            break;
          case "audio/mpeg":
            endpoint = "api/upload/audio";
            break;
          default:
            console.error("Unsupported file type:", file.type);
        }
        console.log("Uploading file to:", endpoint);
        await axios.post(endpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setTimeout(() => {
          setBump((prev) => prev + 1);
        }, 2000);
        console.log("File uploaded successfully.");
        setIsUploading(false);
      } catch (error) {
        console.error("Error uploading file:", error);
        setIsUploading(false);
      }
    }
  }

  return (
    <div className="px-3">
      {isUploading ? (
        <div
          className="block px-3 py-1 hover:underline text-sm focus:outline-none w-full text-center"
          style={{
            color: "var(--bg)",
            backgroundColor: "var(--yellow)",
          }}
        >
          UPLOADING
        </div>
      ) : (
        <label
          className="block px-3 py-1 hover:underline text-sm focus:outline-none w-full text-center"
          style={{
            color: "var(--bg)",
            backgroundColor: "var(--green)",
          }}
        >
          UPLOAD
          <input
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.mp3"
            onChange={handleUpload} />
        </label>
      )}
    </div>
  );
}

