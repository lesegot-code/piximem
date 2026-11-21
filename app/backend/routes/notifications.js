// Student Number: u25143230
import { Router } from "express";
import { getDB } from "../db.js";
import { toId } from "../lib/helpers.js";

const router = Router();

router.get("/", async(req, res) =>
{
  const list = await getDB().collection("notifications").find({ userId: req.user._id }).toArray();
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    items: list.slice(0, 30),
    unread: list.filter((n) => !n.read).length,
  });
});

router.post("/read-all", async(req, res) =>
{
  await getDB().collection("notifications").updateMany(
    { userId: req.user._id, read: false },
    { $set: { read: true } }
  );
  res.json({ success: true });
});

router.post("/:id/read", async(req, res) =>
{
  const _id = toId(req.params.id);
  if(_id)
  {
    await getDB().collection("notifications").updateOne(
      { _id, userId: req.user._id },
      { $set: { read: true } }
    );
  }
  res.json({ success: true });
});

export default router;
