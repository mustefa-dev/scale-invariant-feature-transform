
interface Config {
  apiUrl: string;
}

type Environment = 'development' | 'production';

// Determine current environment
const env: Environment = 
  (import.meta.env.MODE as Environment) || 'development';

const configs: Record<Environment, Config> = {
  development: {
    apiUrl: 'http://localhost:5000',
  },
  production: {
    // When deploying to production, update this URL to your deployed backend
    // This could be read from an environment variable during build
    apiUrl: import.meta.env.VITE_API_URL || 'https://your-backend-url.com',
  },
};

const config: Config = configs[env];

export default config;
