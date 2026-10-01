// Student number: 25143230
function PostPage(){
    const post ={
        id: 1,
        username: "Lesego",
        caption: "Sunset at the beach",
        hashtags: ["#sunset", "#nature"],
        comments: [
            { user: "Fatso", text: "Stunning shot!" },
            { user: "Tshego", text: "Where is this?" },
        ],
    };

    return (
        <div>
            <h2>{post.username}</h2>
            <p>{post.caption}</p>
            <p>{post.hashtags.join(" ")}</p>
            <h3>Comments</h3>
            {post.comments.map((c, i) => <p key={i}><strong>{c.user}:</strong>{c.text}</p>)}
        </div>
    );
}

export default PostPage;
