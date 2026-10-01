// Student number: 25143230
import { useState } from "react";
import PostPreview from "../components/PostPreview";

const dummyPosts = [
    { id: 1, username: "Lesego", caption: "Beautiful sunset!", hashtags: ["#nature"], likes: 12 },
    { id: 2, username: "Fatso", caption: "My new puppy!", hashtags: ["#cute"], likes: 45 }
];

function HomePage(){
    const [search, setSearch] = useState("");

    const filtered = dummyPosts.filter(p =>
        p.username.toLowerCase().includes(search.toLowerCase()) ||
        p.caption.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <h2>Home Feed</h2>
            <input type="text" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} />
            {filtered.map(post => <PostPreview key={post.id} post={post} />)}
        </div>
    );
}

export default HomePage;
