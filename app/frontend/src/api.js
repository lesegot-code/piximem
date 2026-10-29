// Student number: u25143230
const BASE_URL = "http://localhost:3000/api";

//helper: check res.ok and parse JSON once
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

// helper: used by profile page
export const buildImageUrl = (filenameOrUrl) =>
{
  if(!filenameOrUrl) return null;
  if(filenameOrUrl.startsWith("http")) return filenameOrUrl;
  return `http://localhost:3000/uploads/${filenameOrUrl}`;
};

//======================= USERS ==========================
export const signup = (user) =>
  request("/signup", { method: "POST", body: JSON.stringify(user) });

export const login = (credentials) =>
  request("/login", { method: "POST", body: JSON.stringify(credentials) });

export const getUser = (id) => request(`/users/${id}`);

// users
export const updateUser = async(id, updates) =>
{
  if(updates.avatar instanceof File)
  {
    const form = new FormData();
    if(updates.username !== undefined) form.append("username", updates.username);
    if(updates.bio !== undefined) form.append("bio", updates.bio);
    form.append("avatar", updates.avatar);

    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: "PUT",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if(!res.ok) throw new Error(data.error || "Failed to update profile");
    return data;
  }

  return request(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
};

export const deleteUser = (id) =>
  request(`/users/${id}`, { method: "DELETE" });

export const getAllUsers = () => request("/users");

//======================= POSTS ==========================
export const getPosts = () => request("/posts");
export const getPost = (id) => request(`/posts/${id}`);
export const createPost = async({ userId, caption, hashtags, image }) =>
{
  const form = new FormData();
  form.append("userId", userId);
  form.append("caption", caption);
  form.append("hashtags", JSON.stringify(hashtags));
  if(image) form.append("image", image);

  const res = await fetch(`${BASE_URL}/posts`, {
    method: "POST",
    body: form
  });

  const data = await res.json().catch(() => ({}));
  if(!res.ok) throw new Error(data.error || "Failed to create post");
  return data;
};

export const updatePost = (id, updates) =>
  request(`/posts/${id}`, { method: "PUT", body: JSON.stringify(updates) });
export const deletePost = (id) =>
  request(`/posts/${id}`, { method: "DELETE" });

export const addComment = (postId, userId, text) =>
  request(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ userId, text }),
  });

export const reportPost = (postId, userId, reason) =>
  request(`/posts/${postId}/report`, {
    method: "POST",
    body: JSON.stringify({ userId, reason }),
  });

//======================= ALBUMS ==========================
export const getAlbums = () => request("/albums");
export const createAlbum = (album) =>
  request("/albums", { method: "POST", body: JSON.stringify(album) });
export const updateAlbum = (id, updates) =>
  request(`/albums/${id}`, { method: "PUT", body: JSON.stringify(updates) });
export const deleteAlbum = (id) =>
  request(`/albums/${id}`, { method: "DELETE" });
export const addPostToAlbum = (albumId, postId) =>
  request(`/albums/${albumId}/posts`, {
    method: "PUT",
    body: JSON.stringify({ postId }),
  });
export const removePostFromAlbum = (albumId, postId) =>
  request(`/albums/${albumId}/posts/${postId}`, { method: "DELETE" });

//======================= FRIENDS ==========================
export const sendFriendRequest = (toUserId, fromUserId) =>
  request(`/friends/${toUserId}/request`, {
    method: "POST",
    body: JSON.stringify({ fromUserId }),
  });

export const acceptFriendRequest = (toUserId, fromUserId) =>
  request(`/friends/${toUserId}/accept`, {
    method: "PUT",
    body: JSON.stringify({ fromUserId }),
  });

export const unfriend = (toUserId, fromUserId) =>
  request(`/friends/${toUserId}/remove`, {
    method: "DELETE",
    body: JSON.stringify({ fromUserId }),
  });

// ==================== COMMENTS ==========================

// helper: fetch all albums that contain a given post
export const getAlbumsForPost = async(postId) =>
{
  const albums = await getAlbums();
  return albums.filter((a) =>
    (a.posts || []).some((p) => p.toString() === postId.toString())
  );
};

// ==================== FRIEND DECLINE ====================
export const declineFriendRequest = (toUserId, fromUserId) =>
  request(`/friends/${toUserId}/decline`, {
    method: "DELETE",
    body: JSON.stringify({ fromUserId }),
  });