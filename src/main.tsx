// @ts-nocheck - Temporarily disable TypeScript checking for legacy code compatibility
import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import './index.css'

declare global {
    type unknown = any;

    interface Object {
        [key: string]: any;
    }
}


(window as any).__LEGACY_API_MODE__ = true;

createRoot(document.getElementById("root")!).render(<App/>);
