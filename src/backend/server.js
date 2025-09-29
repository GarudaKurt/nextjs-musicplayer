const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Enable CORS + JSON parsing
app.use(cors());
app.use(express.json());

// Create 'uploads' folder if it doesn't exist
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Configure multer for file uploads (retain original filename)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    cb(null, file.originalname); // retain original file name
  },
});
const upload = multer({ storage });

// Initialize SQLite database
const db = new sqlite3.Database("music.db", (err) => {
  if (err) return console.error("DB Error:", err.message);
  console.log("Connected to SQLite database.");
});

// --- SONGS TABLE ---
db.run(
  `CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    artist TEXT NOT NULL,
    filePath TEXT NOT NULL
  )`
);

// --- SCHEDULES TABLE ---
db.run(
  `CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scheduleName TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    playlist TEXT NOT NULL
  )`
);

// --- SCHEDULE LOGS TABLE ---
db.run(
  `CREATE TABLE IF NOT EXISTS schedule_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scheduleId INTEGER NOT NULL,
    scheduleName TEXT NOT NULL,
    startedAt TEXT NOT NULL,
    endedAt TEXT,
    FOREIGN KEY(scheduleId) REFERENCES schedules(id)
  )`
);

// =================== SONG ROUTES =================== //
// (unchanged)
app.post("/uploads", upload.single("songFile"), (req, res) => {
  const { songName, songArtist } = req.body;
  const filePath = req.file ? req.file.originalname : null;

  if (!songName || !songArtist || !filePath) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.run(
    "INSERT INTO songs (name, artist, filePath) VALUES (?, ?, ?)",
    [songName, songArtist, filePath],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "DB insertion failed" });
      }
      res.json({ message: "Music uploaded successfully!", songId: this.lastID });
    }
  );
});

app.get("/songs", (req, res) => {
  db.all("SELECT * FROM songs", (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });

    const formatted = rows.map((row) => ({
      songName: row.name,
      songArtist: row.artist,
      songSrc: `/uploads/files/${row.filePath}`,
      songAvatar: "/images/default-avatar.png",
    }));

    res.json(formatted);
  });
});

app.get("/songs-list", (req, res) => {
  db.all("SELECT * FROM songs", (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });

    const formatted = rows.map((row) => ({
      songName: row.name,
      songArtist: row.artist,
      songSrc: `/uploads/files/${row.filePath}`,
      songAvatar: "/images/default-avatar.png",
    }));

    res.json(formatted);
  });
});

app.use("/uploads/files", express.static(UPLOAD_DIR));

// =================== SCHEDULE ROUTES =================== //
// (unchanged) Get all schedules
app.get("/schedules", (req, res) => {
  db.all("SELECT * FROM schedules", (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });

    const schedules = rows.map((row) => ({
      id: row.id,
      scheduleName: row.scheduleName,
      startDate: row.startDate,
      endDate: row.endDate,
      startTime: row.startTime,
      endTime: row.endTime,
      playlist: JSON.parse(row.playlist || "[]"),
    }));

    res.json(schedules);
  });
});

app.post("/schedules", (req, res) => {
  const { scheduleName, startDate, endDate, startTime, endTime, playlist } =
    req.body;

  if (!scheduleName || !startDate || !endDate || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing fields" });
  }

  db.run(
    `INSERT INTO schedules (scheduleName, startDate, endDate, startTime, endTime, playlist)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [scheduleName, startDate, endDate, startTime, endTime, JSON.stringify(playlist || [])],
    function (err) {
      if (err) return res.status(500).json({ message: "DB insertion failed" });
      res.json({ message: "Schedule created", scheduleId: this.lastID });
    }
  );
});

app.put("/schedules/:id", (req, res) => {
  const { id } = req.params;
  const { scheduleName, startDate, endDate, startTime, endTime, playlist } =
    req.body;

  db.run(
    `UPDATE schedules 
     SET scheduleName=?, startDate=?, endDate=?, startTime=?, endTime=?, playlist=? 
     WHERE id=?`,
    [scheduleName, startDate, endDate, startTime, endTime, JSON.stringify(playlist || []), id],
    function (err) {
      if (err) return res.status(500).json({ message: "DB update failed" });
      res.json({ message: "Schedule updated" });
    }
  );
});

app.delete("/schedules/:id", (req, res) => {
  const { id } = req.params;
  const { mode } = req.query;

  if (id === "all") {
    db.run("DELETE FROM schedules", [], function (err) {
      if (err) return res.status(500).json({ message: "DB delete failed" });
      res.json({ message: "All schedules deleted" });
    });
  } else {
    db.run("DELETE FROM schedules WHERE id=?", [id], function (err) {
      if (err) return res.status(500).json({ message: "DB delete failed" });
      res.json({ message: `Schedule ${id} deleted (mode=${mode})` });
    });
  }
});

app.get("/schedules/active", (req, res) => {
  const now = new Date(); // Local PC/server time
  console.log(`[Backend][${now.toLocaleString()}] Checking active schedules...`);

  db.all("SELECT * FROM schedules", (err, rows) => {
    if (err) {
      console.error(`[Backend][${now.toLocaleString()}] DB Error:`, err);
      return res.status(500).json({ message: "DB error" });
    }

    const activeSchedules = rows.filter((row) => {
      const [startH, startM, startS] = row.startTime.split(":").map(Number);
      const [endH, endM, endS] = row.endTime.split(":").map(Number);

      const startDateTime = new Date(row.startDate);
      startDateTime.setHours(startH, startM, startS, 0);

      const endDateTime = new Date(row.endDate);
      endDateTime.setHours(endH, endM, endS, 999);

      const isActive = now >= startDateTime && now <= endDateTime;

      console.log(
        `[Backend][${now.toLocaleString()}] Schedule "${row.scheduleName}" (ID: ${row.id}) - Start: ${startDateTime.toLocaleTimeString()} End: ${endDateTime.toLocaleTimeString()} - Active: ${isActive}`
      );

      return isActive;
    });

    if (activeSchedules.length === 0) {
      console.log(`[Backend][${now.toLocaleString()}] No active schedule.`);
      return res.json({ active: false });
    }

    const active = activeSchedules.reduce((prev, curr) => {
      const prevStart = new Date(prev.startDate);
      const [prevH, prevM, prevS] = prev.startTime.split(":").map(Number);
      prevStart.setHours(prevH, prevM, prevS, 0);

      const currStart = new Date(curr.startDate);
      const [currH, currM, currS] = curr.startTime.split(":").map(Number);
      currStart.setHours(currH, currM, currS, 0);

      return currStart > prevStart ? curr : prev;
    });

    // Log schedule start once
    db.get(
      `SELECT * FROM schedule_logs WHERE scheduleId=? AND startedAt >= ?`,
      [active.id, active.startDate],
      (err, row) => {
        if (err) console.error("Error checking logs:", err);
        if (!row) {
          db.run(
            `INSERT INTO schedule_logs (scheduleId, scheduleName, startedAt) VALUES (?, ?, ?)`,
            [active.id, active.scheduleName, now.toISOString()],
            (err) => {
              if (err) console.error("Failed to log schedule:", err);
              else
                console.log(
                  `[Backend][${now.toLocaleString()}] Logged START for schedule "${active.scheduleName}" (ID: ${active.id})`
                );
            }
          );
        }
      }
    );

    // Optional: Log schedule end if now > endDateTime
    activeSchedules.forEach((sched) => {
      const [endH, endM, endS] = sched.endTime.split(":").map(Number);
      const endDT = new Date(sched.endDate);
      endDT.setHours(endH, endM, endS, 999);

      if (now > endDT) {
        console.log(
          `[Backend][${now.toLocaleString()}] Schedule "${sched.scheduleName}" (ID: ${sched.id}) has ENDED`
        );
      }
    });

    res.json({
      active: true,
      schedule: {
        id: active.id,
        scheduleName: active.scheduleName,
        startDate: active.startDate,
        endDate: active.endDate,
        startTime: active.startTime,
        endTime: active.endTime,
        playlist: JSON.parse(active.playlist || "[]"),
      },
    });
  });
});


// =================== START SERVER =================== //
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
