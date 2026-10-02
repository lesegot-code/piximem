// Student number: 25143230
export default function SplashPage(){
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-primary to-accent">
        <div className="bg-white shadow-lg rounded-lg p-8 w-96">
            <h1 className="text-3xl font-bold text-center text-primary mb-6">Pixel Memory</h1>
            <form className="space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button className="w-full bg-primary text-white py-2 rounded hover:bg-blue-700 transition"> Sign Up </button>
            </form>
        </div>
    </div>
  );
}
