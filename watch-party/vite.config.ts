import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // For development, use the standard config
    if (mode === 'development') {
        return {
            plugins: [react()],
            define: {
                'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
                'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
            },
            resolve: {
                alias: {
                '@': path.resolve(__dirname, '.'),
                }
            }
        };
    }

    // For production build, create an embeddable library
    return {
        plugins: [react()],
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        build: {
            lib: {
                entry: path.resolve(__dirname, 'embed.tsx'),
                name: 'SyncStream', // This will be the global variable name (window.SyncStream)
                fileName: 'syncstream',
                formats: ['umd'] // Universal Module Definition works everywhere
            },
            rollupOptions: {
                // We don't need to bundle React/Supabase, as they are loaded from the importmap/CDN
                external: ['react', 'react-dom', '@supabase/supabase-js', 'react-player'],
                output: {
                    globals: {
                        'react': 'React',
                        'react-dom': 'ReactDOM',
                        '@supabase/supabase-js': 'supabase',
                        'react-player': 'ReactPlayer'
                    }
                }
            }
        }
    };
});