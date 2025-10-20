// Configuration management
class Config {
    constructor() {
        // Default values
        this.defaults = {
            host: 'localhost',
            port: '5000',
            apiEndpoint: '/api/records',
            useProxy: true
        };
        
        this.config = this.loadConfig();
    }

    loadConfig() {
        const config = { ...this.defaults };

        // Try to load from .env file (if available)
        if (window.ENV) {
            config.host = window.ENV.API_HOST || config.host;
            config.port = window.ENV.API_PORT || config.port;
            config.apiEndpoint = window.ENV.API_ENDPOINT || config.apiEndpoint;
            config.useProxy = window.ENV.USE_PROXY === 'true' || config.useProxy;
        }

        // Override with URL parameters (for testing)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('host')) config.host = urlParams.get('host');
        if (urlParams.get('port')) config.port = urlParams.get('port');
        if (urlParams.get('endpoint')) config.apiEndpoint = urlParams.get('endpoint');

        // Override with localStorage (for persistence)
        const savedConfig = localStorage.getItem('apiConfig');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                Object.assign(config, parsed);
            } catch (e) {
                console.warn('Failed to parse saved config:', e);
            }
        }

        return config;
    }

    saveConfig() {
        localStorage.setItem('apiConfig', JSON.stringify(this.config));
    }

    get baseUrl() {
        // In Kubernetes, use relative URLs through nginx proxy
        if (this.config.useProxy !== false) {
            return '';
        }
        return `http://${this.config.host}:${this.config.port}`;
    }

    get apiUrl() {
        return `${this.baseUrl}${this.config.apiEndpoint}`;
    }

    get healthUrl() {
        // Use /health proxy endpoint in Kubernetes
        if (this.config.useProxy !== false) {
            return '/health';
        }
        return `${this.baseUrl}/`;
    }

    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        this.saveConfig();
    }

    getConfig() {
        return { ...this.config };
    }
}

// Global config instance
window.appConfig = new Config();