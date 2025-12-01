import { Link, useLocation } from 'react-router-dom';
import { Briefcase, FileText, Home, PlusCircle, List, BrainCircuit, LogOut, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

import { Key } from 'lucide-react';

const Navbar = ({ onOpenSettings }) => {
    const location = useLocation();
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Upload Resume', path: '/upload', icon: FileText },
        { name: 'Search Jobs', path: '/jobs', icon: Briefcase },
        { name: 'Add Job', path: '/add-job', icon: PlusCircle },
        { name: 'Applications', path: '/applications', icon: List },
        { name: 'CareerPilot', path: '/careerpilot', icon: BrainCircuit },
    ];

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
            <div className="flex h-16 items-center justify-between px-6 w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                            <img src="/favicon.svg" alt="CareerPilot Logo" className="h-8 w-8" />
                        </div>
                        <span className="hidden font-bold sm:inline-block text-lg tracking-tight">
                            CareerPilot
                        </span>
                    </Link>

                    {user && (
                        <nav className="hidden md:flex items-center space-x-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                        location.pathname === item.path
                                            ? "bg-white/10 text-white shadow-sm"
                                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </span>
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <span className="hidden md:flex text-sm text-muted-foreground items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                <User className="h-3 w-3" />
                                {user.full_name || user.email}
                            </span>
                            <Button variant="ghost" size="sm" onClick={onOpenSettings} className="hidden sm:flex">
                                <Key className="mr-2 h-4 w-4" />
                                Keys
                            </Button>
                            <Button variant="ghost" size="sm" onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login">
                                <Button variant="ghost" className="text-muted-foreground hover:text-white">
                                    Log In
                                </Button>
                            </Link>
                            <Link to="/signup">
                                <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
