// Student number: 25143230


function PostPreview({key, post}) {
    return (
        <div key={key}>
            <h3>{post.username}</h3>
            <p>{post.caption}</p>
            <p>{post.hashtags.join(" ")}</p>
            <p>Likes: {post.likes}</p>
        </div>
    );
}

export default PostPreview;
