import { Link, useLocation } from 'react-router-dom';
import { Briefcase, FileText, Home, PlusCircle, List, BrainCircuit, LogOut, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

const Navbar = () => {
    const location = useLocation();
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: Home },
        { name: 'Upload Resume', path: '/upload', icon: FileText },
        { name: 'Search Jobs', path: '/jobs', icon: Briefcase },
        { name: 'Add Job', path: '/add-job', icon: PlusCircle },
        { name: 'Applications', path: '/applications', icon: List },
        { name: 'CareerPilot', path: '/careerpilot', icon: BrainCircuit },
    ];

    if (!user) return null; // Don't show navbar if not logged in

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center">
                    <Link to="/" className="mr-6 flex items-center space-x-2">
                        <Briefcase className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">
                            CareerPilot
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    location.pathname === item.path ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </span>
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {user.full_name || user.email}
                    </span>
                    <Button variant="ghost" size="sm" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
