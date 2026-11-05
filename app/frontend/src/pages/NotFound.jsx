// Student number: 25143230
import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="card max-w-md w-full text-center space-y-3">
                <img src="/favicon.svg" alt="Pixel Memory logo" className="w-16 h-16 mx-auto" />
                <h1 className="font-heading text-2xl text-ink">Pixel Memory</h1>
                <p className="text-muted">This page doesn't exist.</p>
                {/* "/" sends logged-in users on to /home */}
                <Link to="/" className="btn-primary">Go back</Link>
            </div>
        </div>
    );
}

export default NotFound;
