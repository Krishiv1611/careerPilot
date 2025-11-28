import Navbar from './Navbar';
import APIKeyModal from '../settings/APIKeyModal';
import { useState } from 'react';

const Layout = ({ children }) => {
    const [showKeyModal, setShowKeyModal] = useState(false);

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Navbar onOpenSettings={() => setShowKeyModal(true)} />
            <main className="container py-6">
                {children}
            </main>
            <APIKeyModal open={showKeyModal} onOpenChange={setShowKeyModal} />
        </div>
    );
};

export default Layout;
