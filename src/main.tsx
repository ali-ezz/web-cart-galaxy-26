
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Make sure to always use the null check when getting the root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found! Make sure there's a div with id='root' in your HTML.");
}

const root = createRoot(rootElement);
root.render(<App />);
