import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) 
{
    //read the saved user before the first render, so a refresh keeps you logged in
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("piximem_user");
        return saved ? JSON.parse(saved) : null;
    });

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