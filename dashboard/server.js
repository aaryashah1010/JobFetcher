require("dotenv").config();
const path = require("path");
const express = require("express");
const { getAllJobs } = require("../storage/db");

const app = express();
const PORT = process.env.PORT || 4321;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/jobs", (req, res) => {
  const { source, search, since } = req.query;
  try {
    const jobs = getAllJobs({ source, search, since });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load jobs" });
  }
});

app.get("/api/sources", (req, res) => {
  const jobs = getAllJobs();
  const sources = [...new Set(jobs.map((j) => j.source))].sort();
  res.json(sources);
});

app.listen(PORT, () => {
  console.log(`Job dashboard running at http://localhost:${PORT}`);
});
