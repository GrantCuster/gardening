const express = require("express");
const sharp = require("sharp");
const multer = require("multer");
const AWS = require("aws-sdk");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const AtpAgent = require("@atproto/api").AtpAgent;
require("dotenv").config();
const ViteExpress = require("vite-express");

const agent = new AtpAgent({
  service: "https://bsky.social",
});

console.log("process.env.NODE_ENV", process.env.NODE_ENV);

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

// Set up AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const formatDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}-${String(
    now.getHours(),
  ).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(
    now.getSeconds(),
  ).padStart(2, "0")}`;
};

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const formattedDate = formatDate();
    cb(null, formattedDate + path.extname(file.originalname)); // Append the file extension
  },
});
const upload = multer({ storage: storage });

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const smallSize = 800;
const largeSize = 2000;

const resizeImage = (inputPath, outputDir, callback) => {
  const fileName = path.basename(inputPath, path.extname(inputPath));

  // Define output paths
  const smallPath = path.join(outputDir, `${fileName}-${smallSize}.jpg`);
  const largePath = path.join(outputDir, `${fileName}-${largeSize}.jpg`);

  // Resize to small (800px)
  sharp(inputPath)
    .resize(smallSize, smallSize, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFile(smallPath, (err) => {
      if (err) {
        return callback(err);
      }

      // Resize to large (2000px)
      sharp(inputPath)
        .resize(largeSize, largeSize, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .toFile(largePath, (err) => {
          if (err) {
            return callback(err);
          }

          callback(null, {
            small: smallPath,
            large: largePath,
          });
        });
    });
};

const uploadToS3 = (filePath, key, contentType, callback) => {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      return callback(err);
    }
    callback(null, data.Location);
  });
};

app.get("/api/listPosts", (req, res) => {
  // shell command
  exec("ls ../garden/content/posts", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    res.send(stdout);
  });
});

app.get("/api/getPost", (req, res) => {
  const fileName = req.query.fileName;
  // shell command
  exec("cat ../garden/content/posts/" + fileName, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    res.send(stdout);
  });
});

app.post("/api/savePost", (req, res) => {
  const fileName = req.body.fileName;
  const content = req.body.content;
  fs.writeFile("../garden/content/posts/" + fileName, content, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error saving post.");
    }
    res.send("Post saved successfully.");
  });
});

app.post("/api/deletePost", (req, res) => {
  const fileName = req.body.fileName;
  console.log("Deleting post:", fileName);
  fs.unlink("../garden/content/posts/" + fileName, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error deleting post.");
    }
    console.log("Post deleted successfully.");
    res.send("Post deleted successfully.");
  });
});

app.get("/api/update", (_, res) => {
  // shell command
  exec("cd ../garden && npm run build incremental", (error, stdout) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    res.send(stdout);
  });
});

app.post("/api/upload/image", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const outputDir = "uploads/";
  resizeImage(file.path, outputDir, (err, resizedImages) => {
    if (err) {
      console.error("Error resizing image:", err);
      return res.status(500).send("Error resizing image.");
    }

    const { small, large } = resizedImages;
    const fileName = path.basename(file.path, path.extname(file.path));

    // Upload large version
    uploadToS3(
      large,
      `${fileName}-${largeSize}.jpg`,
      "image/jpeg",
      (err, largeLocation) => {
        if (err) {
          console.error("Error uploading large image:", err);
          return res.status(500).send("Error uploading large image.");
        }

        // Upload small version
        uploadToS3(
          small,
          `${fileName}-${smallSize}.jpg`,
          "image/jpeg",
          (err, smallLocation) => {
            if (err) {
              console.error("Error uploading small image:", err);
              return res.status(500).send("Error uploading small image.");
            }

            // Clean up local files
            fs.unlinkSync(file.path);
            fs.unlinkSync(small);
            fs.unlinkSync(large);

            res.send({
              message: "Files uploaded successfully",
              smallImageUrl: smallLocation,
              largeImageUrl: largeLocation,
            });
          },
        );
      },
    );
  });
});

app.post("/api/upload/gif", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const fileName = path.basename(file.path, path.extname(file.path));
  const gifKey = `${fileName}.gif`;
  const jpgKey = `${fileName}-preview.jpg`;

  try {
    // Extract the first frame of the GIF and save it as a JPEG
    const firstFrameBuffer = await sharp(file.path, { pages: 1 })
      .jpeg()
      .toBuffer();

    // Save the JPEG temporarily
    const jpgPath = path.join(path.dirname(file.path), jpgKey);
    fs.writeFileSync(jpgPath, firstFrameBuffer);

    // Upload GIF to S3
    const gifLocation = await new Promise((resolve, reject) => {
      uploadToS3(file.path, gifKey, "image/gif", (err, location) => {
        if (err) return reject(err);
        resolve(location);
      });
    });

    // Upload JPEG to S3
    const jpgLocation = await new Promise((resolve, reject) => {
      uploadToS3(jpgPath, jpgKey, "image/jpeg", (err, location) => {
        if (err) return reject(err);
        resolve(location);
      });
    });

    // Clean up local files
    fs.unlinkSync(file.path);
    fs.unlinkSync(jpgPath);

    res.send({
      message: "Gif and first frame uploaded successfully",
      gifUrl: gifLocation,
      jpgUrl: jpgLocation,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return res.status(500).send("Error processing file.");
  }
});

app.post("/api/upload/video", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const fileName = path.basename(file.path, path.extname(file.path));
  const key = `${fileName}.mp4`;

  uploadToS3(file.path, key, "video/mp4", (err, location) => {
    if (err) {
      console.error("Error uploading video:", err);
      return res.status(500).send("Error uploading video.");
    }

    // Clean up local file
    fs.unlinkSync(file.path);

    res.send({
      message: "Video uploaded successfully",
      videoUrl: location,
    });
  });
});

app.post("/api/upload/audio", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const fileName = path.basename(file.path, path.extname(file.path));
  const key = `${fileName}.mp3`;

  uploadToS3(file.path, key, "audio/mpeg", (err, location) => {
    if (err) {
      console.error("Error uploading audio:", err);
      return res.status(500).send("Error uploading audio.");
    }

    // Clean up local file
    fs.unlinkSync(file.path);

    res.send({
      message: "Audio uploaded successfully",
      audioUrl: location,
    });
  });
});

app.get("/api/list-objects", async (req, res) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const sortedData = data.Contents.sort(
      (a, b) => new Date(b.LastModified) - new Date(a.LastModified),
    );
    res.json(sortedData);
  } catch (err) {
    console.error("Error listing objects:", err);
    res.status(500).send("Error listing objects.");
  }
});

app.post("/api/postToBluesky", async (req, res) => {
  const post = req.body.post;
  try {
    await agent.login({
      identifier: process.env.BLUESKY_IDENTIFIER,
      password: process.env.BLUESKY_PASSWORD,
    });
    const data = await uploadS3FileToAgent(agent, post.embed.external.thumb);

    post.embed.external.thumb = data.blob;

    await agent.post(post);

    res.json({ success: "posted" });
  } catch (error) {
    console.log(error)
    res.status(500).send("Error uploading file to agent.");
  }
});

async function uploadS3FileToAgent(agent, s3Key) {
  try {
    // Download file from S3
    const s3Object = await s3
      .getObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
      })
      .promise();

    // `s3Object.Body` is already a Buffer, so you can use it directly
    const fileBuffer = s3Object.Body;

    // Upload the buffer to your agent (assuming the agent accepts Buffer for blob data)
    const { data } = await agent.uploadBlob(fileBuffer, {
      encoding: "image/jpeg",
    });

    return data; // Response from agent upload
  } catch (error) {
    console.log(error);
    console.error("Error uploading file:", error);
    throw error;
  }
}

app.get("/api/proxy-image/:key", async (req, res) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: req.params.key,
    };

    // Generate a signed URL for the S3 image
    const url = await s3.getSignedUrlPromise("getObject", {
      ...params,
      Expires: 60, // URL expiration time in seconds
    });

    res.redirect(url);
  } catch (error) {
    res.status(500).send("Error generating URL");
  }
});

const port = process.env.NODE_ENV === "production" ? 5050 : 3030;
ViteExpress.config({
  inlineViteConfig: {
    base: "/",
  },
});
ViteExpress.listen(app, port, () => console.log("Server is listening..."));
