const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

const users = [];
const posts = [];

const requireLogin = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { name, surname, email, password } = req.body;
  const newUser = { id: users.length + 1, name, surname, email, password };
  users.push(newUser);
  res.status(201).redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/feed", requireLogin, (req, res) => {
  const allPosts = posts;
  const postsWithAuthors = allPosts.map((post) => {
    const author = users.find((user) => user.id === post.userId);
    return {
      post,
      author,
    };
  });

  res.status(200).render("feed", { posts: postsWithAuthors });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    req.session.userId = user.id;
    res.status(200).redirect("/create-post");
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/create-post", requireLogin, (req, res) => {
  res.render("create-post");
});

app.post("/posts", requireLogin, (req, res) => {
  const { title, description } = req.body;
  const userId = req.session.userId;
  const newPost = { id: posts.length + 1, title, description, userId };
  posts.push(newPost);
  res.status(201).redirect("/create-post");
});

app.get("/posts", requireLogin, (req, res) => {
  const userPosts = posts.filter((post) => post.userId === req.session.userId);
  res.status(200).render("posts", { userPosts });
});

app.get("/reset", requireLogin, (req, res) => {
  res.render("reset", { message: "" });
});

app.post("/reset", (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(404).send("User not found");
  }

  if (user.password === currentPassword) {
    user.password = newPassword;
    return res.status(200).redirect("/login");
  } else {
    console.log("Incorrect current password");
    return res.status(401).redirect("/reset");
  }
});

app.get("/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
