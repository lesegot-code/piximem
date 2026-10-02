// Student number: 25143230

export default function PostPage() {
  const post = {
    username: "Lesego",
    caption: "Sunset at the beach",
    hashtags: ["#sunset", "#nature"],
    comments: [
      { user: "Fatso", text: "Stunning shot!" },
      { user: "Tshego", text: "Where is this?" },
    ],
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-primary">{post.username}</h2>
        <p className="mt-2">{post.caption}</p>
        <p className="text-sm text-accent">{post.hashtags.join(" ")}</p>

        <h3 className="mt-4 font-semibold">Comments</h3>
        <div className="space-y-2 mt-2">
          {post.comments.map((c, i) => (
            <p key={i} className="text-gray-700">
              <strong>{c.user}:</strong> {c.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
