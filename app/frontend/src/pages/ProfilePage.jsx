// Student number: 25143230
import { useEffect, useState } from "react";
import { getUser, updateUser } from "../api";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");

  useEffect(() => {
    async function loadUser() {
      const data = await getUser("6abeef9287a04b0d779e3422"); 
      setUser(data);
      setBio(data.bio || "");
    }
    loadUser();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    await updateUser(user._id, { bio });
    alert("Profile updated!");
  }

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">{user.username}</h2>
        <p className="text-gray-600 mb-4">{bio}</p>
        <form onSubmit={handleSave} className="space-y-4">
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
