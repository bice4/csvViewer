import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';

//theme
import "primereact/resources/themes/lara-dark-indigo/theme.css";
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <PrimeReactProvider >
            <App />
        </PrimeReactProvider>
    </React.StrictMode>
);