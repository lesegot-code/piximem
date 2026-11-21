// Student Number: u25143230
import { removeUpload } from "./upload.js";

export async function deleteAlbum(db, albumId)
{
  await db.collection("albums").deleteOne({ _id: albumId });
  await db.collection("activities").deleteMany({ albumId });
}

//deletes a post, its comments (stored inside it) and every reference to it
export async function deletePost(db, post, outcome = "post_deleted")
{
  const postId = post._id;

  await db.collection("posts").deleteOne({ _id: postId });
  removeUpload(post.image);

  //an album whose only post was this one is removed too
  const albums = await db.collection("albums").find({ posts: postId }).toArray();
  for(const album of albums)
  {
    if(album.posts.length === 1)
    {
      await deleteAlbum(db, album._id);
    }
    else
    {
      await db.collection("albums").updateOne({ _id: album._id }, { $pull: { posts: postId } });
    }
  }

  //drop the post from "added to album" activity
  await db.collection("activities").updateMany({ postIds: postId }, { $pull: { postIds: postId } });
  await db.collection("activities").deleteMany({ type: "album_added", postIds: { $size: 0 } });

  //open reports on this post are closed
  await db.collection("reports").updateMany(
    { postId, outcome: "open" },
    { $set: { outcome, resolvedAt: new Date() } }
  );

  return albums.filter((a) => a.posts.length === 1).length;
}

//removes an account and everything that belongs to it
export async function deleteUser(db, user)
{
  const userId = user._id;

  const posts = await db.collection("posts").find({ userId }).toArray();
  for(const post of posts) await deletePost(db, post);

  const albums = await db.collection("albums").find({ userId }).toArray();
  for(const album of albums) await deleteAlbum(db, album._id);

  //their comments on other people's posts
  await db.collection("posts").updateMany(
    { "comments.userId": userId },
    { $pull: { comments: { userId } } }
  );

  await db.collection("users").updateMany(
    {},
    { $pull: { friends: userId, friendRequests: userId, favourites: userId } }
  );

  await db.collection("sessions").deleteMany({ userId });
  await db.collection("notifications").deleteMany({ userId });
  await db.collection("activities").deleteMany({ userId });
  await db.collection("users").deleteOne({ _id: userId });
  removeUpload(user.avatar);
}
