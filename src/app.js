import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.status(200).json("Hello from acquistions!");
});

export default app;
