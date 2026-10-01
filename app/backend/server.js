// Student number: 25143230
import express from "express";
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ success: true, userId: 1 });
});

app.post("/signup", (req, res) => {
    res.json({ success: true, userId: 1 });
});

app.post("/login", (req, res) => {
    res.json({ success: true, token: "abc123" });
});

app.listen(3000, () => console.log("Backend running on port 3000"));
