const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const bodyParser = require("body-parser");
const dotenv = require("dotenv").config();
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

/**
 * GET /
 * HOME
 */
router.get("", async (req, res) => {
  try {
    const locals = {
      title: "NodeJs Blog",
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };

    let perPage = 10;
    let page = req.query.page || 1;

    const data = await Post.aggregate([{ $sort: { createdAt: -1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    // Count is deprecated - please use countDocuments
    // const count = await Post.count();
    const count = await Post.countDocuments({});
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render("index", {
      locals,
      data,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: "/",
    });
  } catch (error) {
    console.log(error);
  }
});

// router.get('', async (req, res) => {
//   const locals = {
//     title: "NodeJs Blog",
//     description: "Simple Blog created with NodeJs, Express & MongoDb."
//   }

//   try {
//     const data = await Post.find();
//     res.render('index', { locals, data });
//   } catch (error) {
//     console.log(error);
//   }

// });

/**
 * GET /
 * Post :id
 */
router.get("/post/:id", async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await Post.findById({ _id: slug });

    const locals = {
      title: data.title,
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };

    res.render("post", {
      locals,
      data,
      currentRoute: `/post/${slug}`,
    });
  } catch (error) {
    console.log(error);
  }
});

/**
 * POST /
 * Post - searchTerm
 */
router.post("/search", async (req, res) => {
  try {
    const locals = {
      title: "Seach",
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };

    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

    const data = await Post.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, "i") } },
        { body: { $regex: new RegExp(searchNoSpecialChar, "i") } },
      ],
    });

    res.render("search", {
      data,
      locals,
      currentRoute: "/",
    });
  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /
 * About
 */
router.get("/about", (req, res) => {
  res.render("about", {
    currentRoute: "/about",
  });
});

router.get("/generate-image", (req, res) => {
  res.render("generate-image", {
    // currentRoute: "/generate-image",
    prompt: "",
    imageUrl: null,
    error: null,
  });
});

router.post("/generate-image", async (req, res) => {
  const prompt = req.body.prompt;
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    if (response.data && response.data.data.length > 0) {
      res.render("generate-image", {
        prompt: prompt,
        imageUrl: response.data.data[0].url,
        error: null,
      });
    } else {
      throw new Error("No image was generated.");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    let userFriendlyError = "Failed to generate image. with";
    if (error.response && error.response.data && error.response.data.error) {
      userFriendlyError += " Reason: " + error.response.data.error.message;
    }
    res.render("generate-image", {
      prompt: prompt,
      imageUrl: null,
      error: userFriendlyError,
    });
  }
});

// router.post("/generate-image", async (req, res) => {
//   console.log("Received POST request with body:", req.body);
//   const prompt = req.body.prompt;
//   console.log("Sending request to API with prompt:", prompt);

//   try {
//     const response = await openai.images.generate({
//       model: "dall-e-3",
//       prompt: prompt,
//       n: 1,
//       size: "1024x1024",
//     });

//     // console.log("Response:", response);
//     if (response.data && response.data.data.length > 0) {
//       res.render("generate-image", {
//         imageUrl: response.data.data[0].url,
//         error: null,
//       });
//     } else {
//       throw new Error("No image was generated.");
//     }
//   } catch (error) {
//     console.error("Error generating image:", error);
//     let userFriendlyError = "Failed to generate image.";
//     if (
//       error.response &&
//       error.response.error &&
//       error.response.error.message
//     ) {
//       userFriendlyError += " Reason: " + error.response.error.message;
//     }
//     res.render("generate-image", {
//       imageUrl: null,
//       error: userFriendlyError,
//     });
//   }
// });

// router.post("/generate-image", async (req, res) => {
//   const prompt = req.body.prompt;
//   try {
//     const response = await openai.createImage({
//       model: "text-to-image-002", // This is an example model; use the correct model for your needs.
//       prompt: prompt,
//       n: 1,
//       size: "1024x1024",
//     });

//     if (response.data && response.data.data.length > 0) {
//       // Extracting URL of the first generated image
//       res.render("generate-image", { imageUrl: response.data.data[0].url });
//     } else {
//       throw new Error("No image was generated.");
//     }
//   } catch (error) {
//     console.error("Error generating image:", error);
//     res.render("generate-image", {
//       imageUrl: null,
//       error: "Failed to generate image.",
//     });
//   }
// });

// router.post("/generate-image", async (req, res) => {
//   const prompt = req.body.prompt;
//   try {
//     // Call the AI image generation API (assuming API details and setup)
//     const response = await res.post(
//       "API_URL",
//       {
//         prompt: prompt,
//       },
//       {
//         headers: { Authorization: `Bearer ${process.env.API_KEY}` },
//       }
//     );

//     // Assume the API returns a URL to the generated image
//     res.render("generate-image", { imageUrl: response.data.imageUrl });
//   } catch (error) {
//     console.error("Error generating image:", error);
//     res.render("generate-image", { imageUrl: null });
//   }
// });

// function insertPostData () {
//   Post.insertMany([
//     {
//       title: "Building APIs with Node.js",
//       body: "Learn how to use Node.js to build RESTful APIs using frameworks like Express.js"
//     },
//     {
//       title: "Deployment of Node.js applications",
//       body: "Understand the different ways to deploy your Node.js applications, including on-premises, cloud, and container environments..."
//     },
//     {
//       title: "Authentication and Authorization in Node.js",
//       body: "Learn how to add authentication and authorization to your Node.js web applications using Passport.js or other authentication libraries."
//     },
//     {
//       title: "Understand how to work with MongoDB and Mongoose",
//       body: "Understand how to work with MongoDB and Mongoose, an Object Data Modeling (ODM) library, in Node.js applications."
//     },
//     {
//       title: "build real-time, event-driven applications in Node.js",
//       body: "Socket.io: Learn how to use Socket.io to build real-time, event-driven applications in Node.js."
//     },
//     {
//       title: "Discover how to use Express.js",
//       body: "Discover how to use Express.js, a popular Node.js web framework, to build web applications."
//     },
//     {
//       title: "Asynchronous Programming with Node.js",
//       body: "Asynchronous Programming with Node.js: Explore the asynchronous nature of Node.js and how it allows for non-blocking I/O operations."
//     },
//     {
//       title: "Learn the basics of Node.js and its architecture",
//       body: "Learn the basics of Node.js and its architecture, how it works, and why it is popular among developers."
//     },
//     {
//       title: "NodeJs Limiting Network Traffic",
//       body: "Learn how to limit netowrk traffic."
//     },
//     {
//       title: "Learn Morgan - HTTP Request logger for NodeJs",
//       body: "Learn Morgan."
//     },
//   ])
// }

// insertPostData();

module.exports = router;
