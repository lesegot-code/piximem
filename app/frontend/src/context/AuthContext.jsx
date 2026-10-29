import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) 
{
    const [user, setUser] = useState(null);

    //load saved user from localStorage on first mount
    useEffect(() => {
        const saved = localStorage.getItem("piximem_user");
        if(saved) setUser(JSON.parse(saved));
    }, []);

    //keeping localStorage in sync, whenever user changes
    useEffect(() => {
        if(user) 
        {
            localStorage.setItem("piximem_user", JSON.stringify(user));
        } 
        else 
        {
            localStorage.removeItem("piximem_user");
        }
    }, [user]);

    function loginUser(userData) 
    {
        setUser(userData);
    }

    function logoutUser() 
    {
        setUser(null);
    }

    return(
        <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() 
{
    return useContext(AuthContext);
}