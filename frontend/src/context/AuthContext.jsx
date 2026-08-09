import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from './auth-context';
import { apiErrorMessage } from '../app/api-errors';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data);
            } catch {
                setUser(null);
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (email, password) => {
        try {
            await api.post('/auth/login', new URLSearchParams({
                username: email,
                password: password
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const userResponse = await api.get('/auth/me');
            setUser(userResponse.data);
            navigate('/dashboard');
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return {
                success: false,
                error: apiErrorMessage(error)
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
                error: apiErrorMessage(error)
            };
        }
    };

    const logout = async () => {
        await api.post('/auth/logout').catch(() => null);
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
