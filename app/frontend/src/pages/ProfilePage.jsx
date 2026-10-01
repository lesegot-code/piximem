// Student number: 25143230
import { useState } from "react";

function ProfilePage(){
  const [bio, setBio] = useState("Capturing moments one click at a time");

  function handleEdit(e){
    e.preventDefault();
    if(bio.trim().length < 5){
        alert("Bio must be at least 5 characters");
        return;
    }
    alert("Profile updated(dummy)");
  }

  return(
    <div>
        <h2>Lesego Tebeile</h2>
        <p>{bio}</p>
        <form onSubmit={handleEdit}>
            <input type="text" value={bio} onChange={e => setBio(e.target.value)} />
            <button type="submit">Save</button>
        </form>
    </div>
  );
}

export default ProfilePage;
