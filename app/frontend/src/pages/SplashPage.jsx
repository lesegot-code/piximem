// Student number: 25143230
import { useState } from "react";

function SplashPage(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    function handleSignup(e){
        e.preventDefault();
        if(!email.includes("@")){
            alert("Invalid email");
            return;
        }
        if(password !== confirm){
            alert("Passwords do not match");
            return;
        }
        alert("Signup successful(dummy)");
    }

    return(
        <div>
            <h1>Pixel Memory</h1>
            <form onSubmit={handleSignup}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm Password" />
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
}

export default SplashPage;
