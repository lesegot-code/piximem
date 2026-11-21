// Student Number: u25143230
import { Router } from "express";
import { getDB } from "../db.js";
import { HttpError, toId, sameId, includesId, notify } from "../lib/helpers.js";

const router = Router();

async function otherUser(req)
{
  const _id = toId(req.params.id);
  if(!_id) throw new HttpError(400, "That user link isn't valid.");
  if(sameId(_id, req.user._id)) throw new HttpError(400, "You can't do that with your own account.");

  const user = await getDB().collection("users").findOne({ _id });
  if(!user) throw new HttpError(404, "This user doesn't exist anymore.");
  return user;
}

async function makeFriends(db, a, b)
{
  //friend requests are stored on the person who receives them
  await db.collection("users").updateOne(
    { _id: a._id },
    { $pull: { friendRequests: b._id }, $addToSet: { friends: b._id } }
  );
  await db.collection("users").updateOne(
    { _id: b._id },
    { $pull: { friendRequests: a._id }, $addToSet: { friends: a._id } }
  );
}

//send a request to :id
router.post("/:id/request", async(req, res) =>
{
  const db = getDB();
  const me = req.user;
  const other = await otherUser(req);

  if(includesId(me.friends, other._id)) throw new HttpError(400, "You are already friends.");

  //if they already asked me, sending one back just accepts it
  if(includesId(me.friendRequests, other._id))
  {
    await makeFriends(db, me, other);
    await notify(db, other._id, "friend_accepted", `${me.username} accepted your friend request.`, `/profile/${me._id}`);
    return res.json({ friendship: "friends" });
  }

  await db.collection("users").updateOne({ _id: other._id }, { $addToSet: { friendRequests: me._id } });
  await notify(db, other._id, "friend_request", `${me.username} sent you a friend request.`, `/profile/${me._id}`);
  res.json({ friendship: "request-sent" });
});

//accept the request :id sent me
router.post("/:id/accept", async(req, res) =>
{
  const db = getDB();
  const me = req.user;
  const other = await otherUser(req);

  if(!includesId(me.friendRequests, other._id)) throw new HttpError(400, "That friend request no longer exists.");

  await makeFriends(db, me, other);
  await notify(db, other._id, "friend_accepted", `${me.username} accepted your friend request.`, `/profile/${me._id}`);
  res.json({ friendship: "friends" });
});

router.post("/:id/decline", async(req, res) =>
{
  const db = getDB();
  const other = await otherUser(req);

  await db.collection("users").updateOne({ _id: req.user._id }, { $pull: { friendRequests: other._id } });
  res.json({ friendship: "none" });
});

//take back a request I sent
router.post("/:id/cancel", async(req, res) =>
{
  const db = getDB();
  const other = await otherUser(req);

  await db.collection("users").updateOne({ _id: other._id }, { $pull: { friendRequests: req.user._id } });
  res.json({ friendship: "none" });
});

router.delete("/:id", async(req, res) =>
{
  const db = getDB();
  const me = req.user;
  const other = await otherUser(req);

  await db.collection("users").updateOne(
    { _id: me._id },
    { $pull: { friends: other._id, favourites: other._id } }
  );
  await db.collection("users").updateOne(
    { _id: other._id },
    { $pull: { friends: me._id, favourites: me._id } }
  );

  res.json({ friendship: "none" });
});

export default router;
