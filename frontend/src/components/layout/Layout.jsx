import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Navbar />
            <main className="container py-6">
                {children}
            </main>
        </div>
    );
};

export default Layout;
