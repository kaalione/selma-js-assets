import express from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const app = express();

app.get("/run", (req, res) => {
  const url = req.query.url;
  exec(`node rewrite-to-pdf.js "${url}"`);
  res.send("Running…");
});

const PDF_PATH = path.resolve("./report.pdf");

app.get("/status", (req, res) => {
  res.json({ ready: fs.existsSync(PDF_PATH) });
});

// serve PDFs
app.use("/pdf", express.static(process.cwd()));

// serve index.html
app.use(express.static(path.resolve(".")));

app.listen(3000, () => console.log("Listening on 3000"));