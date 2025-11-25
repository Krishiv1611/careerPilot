import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Verify token and get user details
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                } catch (error) {
                    console.error("Token verification failed", error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (email, password) => {
        try {
            console.log("Attempting login for:", email);
            const response = await api.post('/auth/login', new URLSearchParams({
                username: email,
                password: password
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token } = response.data;
            localStorage.setItem('token', access_token);

            // Fetch user details immediately
            console.log("Fetching user details...");
            const userResponse = await api.get('/auth/me');
            console.log("User details fetched:", userResponse.data);
            setUser(userResponse.data);

            // Store user data for API key scoping
            localStorage.setItem('user', JSON.stringify(userResponse.data));

            console.log("Navigating to dashboard...");
            navigate('/');
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return {
                success: false,
                error: error.response?.data?.detail || "Login failed"
            };
        }
    };

    const signup = async (email, password, fullName) => {
        try {
            await api.post('/auth/signup', {
                email,
                password,
                full_name: fullName
            });
            // Auto login after signup
            return await login(email, password);
        } catch (error) {
            console.error("Signup failed", error);
            return {
                success: false,
                error: error.response?.data?.detail || "Signup failed"
            };
        }
    };

    const logout = () => {
        // Clear user-scoped API keys
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
            localStorage.removeItem(`googleApiKey_${user.id}`);
            localStorage.removeItem(`serpApiKey_${user.id}`);
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
