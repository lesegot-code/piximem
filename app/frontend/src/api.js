// Student number: 25143230
const BASE_URL = "http://localhost:3000/api";

//=======================       USERS      ======================================
//=======================       USERS      ======================================
//=======================       USERS      ======================================
export async function signup(user){
    const res = await fetch(`${BASE_URL}/signup`,{
        method: "POST",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify(user),
    });
    return res.json();
}

export async function login(credentials){
    const res = await fetch(`${BASE_URL}/login`,{
        method: "POST",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });
    return res.json();
}

export async function getUser(id){
    const res = await fetch(`${BASE_URL}/users/${id}`);
    return res.json();
}

export async function updateUser(id, updates){
    const res = await fetch(`${BASE_URL}/users/${id}`,{
        method: "PUT",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify(updates),
    });
    return res.json();
}

//=======================       POSTS      ======================================
//=======================       POSTS      ======================================
//=======================       POSTS      ======================================
export async function getPosts(){
    const res = await fetch(`${BASE_URL}/posts`);
    return res.json();
}

export async function createPost(post){
    const res = await fetch(`${BASE_URL}/posts`,{
        method: "POST",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify(post),
    });
    return res.json();
}

export async function updatePost(id, updates){
    const res = await fetch(`${BASE_URL}/posts/${id}`,{
        method: "PUT",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify(updates),
    });
    return res.json();
}

export async function deletePost(id){
    const res = await fetch(`${BASE_URL}/posts/${id}`,{ method: "DELETE" });
    return res.json();
}

//=======================       ALBUMS      ======================================
//=======================       ALBUMS      ======================================
//=======================       ALBUMS      ======================================
export async function getAlbums(){
    const res = await fetch(`${BASE_URL}/albums`);
    return res.json();
}

export async function createAlbum(album){
    const res = await fetch(`${BASE_URL}/albums`,{
        method: "POST",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify(album),
    });
    return res.json();
}

//=======================       FRIENDS      =====================================
//=======================       FRIENDS      =====================================
//=======================       FRIENDS      =====================================
export async function sendFriendRequest(toUserId, fromUserId){
    const res = await fetch(`${BASE_URL}/friends/${toUserId}/request`,{
        method: "POST",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId }),
    });
    return res.json();
}

export async function acceptFriendRequest(toUserId, fromUserId){
    const res = await fetch(`${BASE_URL}/friends/${toUserId}/accept`,{
        method: "PUT",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId }),
    });
    return res.json();
}

export async function unfriend(toUserId, fromUserId){
    const res = await fetch(`${BASE_URL}/friends/${toUserId}/remove`,{
        method: "DELETE",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId }),
    });
    return res.json();
}
