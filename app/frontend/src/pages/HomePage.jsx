// Student number: 25143230
import{ useEffect, useState } from "react";
import{ getPosts } from "../api";

export default function HomePage(){
    const [posts, setPosts] = useState([]);

    // async function loadPosts(){
    //     const data = await getPosts();
    //     setPosts(data);
    // }

    useEffect(() =>{
        async function loadPosts(){
            const data = await getPosts();
            setPosts(data);
        }
        loadPosts();
    }, []);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold text-primary mb-4">Home Feed</h2>
            <div className="space-y-6">
                {posts.map((post) => (
                    <div key={post._id} className="bg-white shadow rounded-lg p-4">
                        <h3 className="font-semibold text-lg">{post.caption}</h3>
                        <p className="text-gray-600">By User{post.userId}</p>
                        <p className="text-sm text-accent">{post.hashtags?.join(" ")}</p>
                    </div>
                ))}
            </div>
        </div>
  );
}

