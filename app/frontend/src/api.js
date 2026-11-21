// Student number: u25143230
//every call goes to /api on the same origin (vite forwards it to the backend), so the session cookie is sent

//one helper for every JSON request: checks res.ok and throws the server's message
async function request(path, { method = "GET", body, form } = {})
{
  const options = { method, credentials: "same-origin", headers: {} };

  if(form)
  {
    options.body = form; //the browser sets the multipart header itself
  }
  else if(body !== undefined)
  {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let res;
  try
  {
    res = await fetch(`/api${path}`, options);
  }
  catch
  {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if(!res.ok)
  {
    const error = new Error(data.error || "Something went wrong. Please try again.");
    error.status = res.status;
    throw error;
  }
  return data;
}

//builds a query string, skipping empty values
function query(params)
{
  const qs = new URLSearchParams();
  for(const [key, value] of Object.entries(params))
  {
    if(value !== undefined && value !== null && value !== "") qs.set(key, value);
  }
  const text = qs.toString();
  return text ? `?${text}` : "";
}

function toForm(fields)
{
  const form = new FormData();
  for(const [key, value] of Object.entries(fields))
  {
    if(value === undefined || value === null) continue;
    form.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
  }
  return form;
}

//======================= AUTH ===========================
export const signup = (fields) => request("/auth/signup", { method: "POST", body: fields });
export const login = (credentials) => request("/auth/login", { method: "POST", body: credentials });
export const logout = () => request("/auth/logout", { method: "POST" });
export const getMe = () => request("/auth/me");

//======================= USERS ==========================
export const getProfile = (id) => request(`/users/${id}/profile`);
export const updateUser = (id, fields) => request(`/users/${id}`, { method: "PUT", form: toForm(fields) });
export const deleteUser = (id) => request(`/users/${id}`, { method: "DELETE" });
export const toggleFavourite = (id) => request(`/users/${id}/favourite`, { method: "POST" });
export const requestVerification = () => request("/users/me/verification", { method: "POST" });
export const getMyAlbums = () => request("/users/me/albums");

//======================= FRIENDS ========================
export const sendFriendRequest = (id) => request(`/friends/${id}/request`, { method: "POST" });
export const acceptFriendRequest = (id) => request(`/friends/${id}/accept`, { method: "POST" });
export const declineFriendRequest = (id) => request(`/friends/${id}/decline`, { method: "POST" });
export const cancelFriendRequest = (id) => request(`/friends/${id}/cancel`, { method: "POST" });
export const unfriend = (id) => request(`/friends/${id}`, { method: "DELETE" });

//======================= FEED / SEARCH ==================
export const getFeed = (params) => request(`/feed${query(params)}`);
export const getTrendingHashtags = () => request("/feed/hashtags");
export const search = (q) => request(`/search${query({ q })}`);
export const searchSuggestions = (q) => request(`/search/suggest${query({ q })}`);

//======================= POSTS ==========================
export const getPost = (id) => request(`/posts/${id}`);
export const createPost = ({ caption, hashtags, image }) =>
  request("/posts", { method: "POST", form: toForm({ caption, hashtags, image }) });
export const updatePost = (id, fields) => request(`/posts/${id}`, { method: "PUT", body: fields });
export const deletePost = (id, reason) => request(`/posts/${id}`, { method: "DELETE", body: { reason } });
export const addComment = (postId, text) => request(`/posts/${postId}/comments`, { method: "POST", body: { text } });
export const deleteComment = (postId, commentId) =>
  request(`/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
export const reportPost = (postId, reasonId) => request(`/posts/${postId}/report`, { method: "POST", body: { reasonId } });
export const getReasons = () => request("/reasons");

//======================= ALBUMS =========================
export const getAlbum = (id) => request(`/albums/${id}`);
export const createAlbum = (fields) => request("/albums", { method: "POST", body: fields });
export const updateAlbum = (id, fields) => request(`/albums/${id}`, { method: "PUT", body: fields });
export const deleteAlbum = (id) => request(`/albums/${id}`, { method: "DELETE" });
export const addPostsToAlbum = (albumId, postIds) =>
  request(`/albums/${albumId}/posts`, { method: "POST", body: { postIds } });
export const removePostFromAlbum = (albumId, postId) =>
  request(`/albums/${albumId}/posts/${postId}`, { method: "DELETE" });

//======================= NOTIFICATIONS ==================
export const getNotifications = () => request("/notifications");
export const markAllNotificationsRead = () => request("/notifications/read-all", { method: "POST" });
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, { method: "POST" });

//======================= ADMIN ==========================
export const admin = {
  overview: () => request("/admin/overview"),
  reports: () => request("/admin/reports"),
  dismissReports: (postId) => request(`/admin/posts/${postId}/dismiss`, { method: "POST" }),
  users: () => request("/admin/users"),
  setReporting: (userId, blocked) => request(`/admin/users/${userId}/reporting`, { method: "POST", body: { blocked } }),
  posts: () => request("/admin/posts"),
  albums: () => request("/admin/albums"),
  addReason: (label) => request("/admin/reasons", { method: "POST", body: { label } }),
  deleteReason: (id) => request(`/admin/reasons/${id}`, { method: "DELETE" }),
  verifications: () => request("/admin/verifications"),
  reviewVerification: (userId, approve) =>
    request(`/admin/verifications/${userId}`, { method: "POST", body: { approve } }),
};

export const getPeopleSuggestions = () => request("/users/me/suggestions");
