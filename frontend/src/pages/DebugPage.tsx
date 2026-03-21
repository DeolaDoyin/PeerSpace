import { useEffect, useState } from 'react';
import api from '@/api/axios';

const DebugPage = () => {
    const [status, setStatus] = useState('Initializing...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setStatus('Connecting to Laravel...');
        
        api.get('/api/posts')
            .then(res => {
                setStatus('Success! Connection established.');
                console.log('Data received:', res.data);
            })
            .catch(err => {
                setStatus('Connection Failed.');
                // This will tell us if it's a CORS error, 404, or 500
                setError(err.message + (err.response ? ` (Status: ${err.response.status})` : ' (Network Error)'));
                console.error(err);
            });
    }, []);

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">API Debugger</h1>
            <div className={`p-4 rounded ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                <strong>Status:</strong> {status}
            </div>
            {error && (
                <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded">
                    <strong>Error Detail:</strong> {error}
                    <p className="text-sm mt-2">Check Browser Console (F12) for more info.</p>
                </div>
            )}
        </div>
    );
};

export default DebugPage;