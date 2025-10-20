// Simple .env loader for frontend
class EnvLoader {
    static async load() {
        if (window.ENV && typeof window.ENV === 'object') {
            console.info('Environment variables already loaded:', window.ENV);
            return;
        }

        try {
            const response = await fetch('.env');
            if (!response.ok) {
                console.info('No .env file found, using defaults');
                return;
            }
            
            const text = await response.text();
            const env = {};
            
            text.split('\n').forEach(line => {
                line = line.trim();
                if (line && !line.startsWith('#')) {
                    const [key, ...valueParts] = line.split('=');
                    if (key && valueParts.length > 0) {
                        env[key.trim()] = valueParts.join('=').trim();
                    }
                }
            });
            
            window.ENV = env;
            console.info('Environment variables loaded from .env:', env);
        } catch (error) {
            console.info('Could not load .env file:', error.message);
        }
    }
}

// Load environment variables when script loads
EnvLoader.load();