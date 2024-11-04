import { domain } from "./consts";

export function usePostPreview() {
  return function getPreview(text: string, fileName: string) {
    const firstLine = text.split("\n")[0];
    const title = firstLine.startsWith("#")
      ? firstLine.slice(1).trim() + " - " + new Date().toLocaleString()
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

    let previewImage = firstImage?.split("(")[1].split(")")[0]!;
    if (previewImage.includes(".gif")) {
      previewImage = previewImage.replace(".gif", "-preview.jpg");
    }
    previewImage = previewImage.replace(
      "https://grant-uploader.s3.amazonaws.com/",
      "",
    );

    return {
      excerpt: stripped,
      title: title,
      description: firstImage
        ? firstImage.split("]")[0].slice(2)
        : "Post on Grant's Garden",
      previewImage: previewImage,
      url: domain + "/" + file.split(".")[0] + "/",
    };
  };
}
