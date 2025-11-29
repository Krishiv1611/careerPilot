import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";

const APIKeyModal = ({ open, onOpenChange }) => {
    const [googleApiKey, setGoogleApiKey] = useState('');
    const [serpApiKey, setSerpApiKey] = useState('');
    const [tavilyApiKey, setTavilyApiKey] = useState('');

    // Load keys when modal opens
    useEffect(() => {
        if (open) {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.id) {
                const storedGoogleKey = localStorage.getItem(`googleApiKey_${user.id}`);
                const storedSerpKey = localStorage.getItem(`serpApiKey_${user.id}`);
                const storedTavilyKey = localStorage.getItem(`tavilyApiKey_${user.id}`);
                if (storedGoogleKey) setGoogleApiKey(storedGoogleKey);
                if (storedSerpKey) setSerpApiKey(storedSerpKey);
                if (storedTavilyKey) setTavilyApiKey(storedTavilyKey);
            }
        }
    }, [open]);

    const handleSave = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
            if (googleApiKey) {
                localStorage.setItem(`googleApiKey_${user.id}`, googleApiKey);
            } else {
                localStorage.removeItem(`googleApiKey_${user.id}`);
            }

            if (serpApiKey) {
                localStorage.setItem(`serpApiKey_${user.id}`, serpApiKey);
            } else {
                localStorage.removeItem(`serpApiKey_${user.id}`);
            }

            if (tavilyApiKey) {
                localStorage.setItem(`tavilyApiKey_${user.id}`, tavilyApiKey);
            } else {
                localStorage.removeItem(`tavilyApiKey_${user.id}`);
            }
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Configure API Keys</DialogTitle>
                    <DialogDescription>
                        Enter your API keys. They are stored locally in your browser.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="google-key" className="text-right">
                            Gemini Key
                        </Label>
                        <Input
                            id="google-key"
                            value={googleApiKey}
                            onChange={(e) => setGoogleApiKey(e.target.value)}
                            className="col-span-3"
                            type="password"
                            placeholder="AIzaSy..."
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="serp-key" className="text-right">
                            SerpAPI Key
                        </Label>
                        <Input
                            id="serp-key"
                            value={serpApiKey}
                            onChange={(e) => setSerpApiKey(e.target.value)}
                            className="col-span-3"
                            type="password"
                            placeholder="Optional..."
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tavily-key" className="text-right">
                            Tavily Key
                        </Label>
                        <Input
                            id="tavily-key"
                            value={tavilyApiKey}
                            onChange={(e) => setTavilyApiKey(e.target.value)}
                            className="col-span-3"
                            type="password"
                            placeholder="Optional..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save Configuration</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default APIKeyModal;
