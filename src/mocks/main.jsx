// Dev-only entry that wires the kit shell to this game's registry + presets.
// Nothing here ships in a production build (served only via mocks.html).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MockWorkbench } from './MockWorkbench.jsx';
import { mockScreens } from './registry.jsx';
import { metaPresets } from './presets.js';
import '../index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MockWorkbench
      registry={mockScreens}
      presets={metaPresets}
      branding={{ title: 'MOCK LAB', subtitle: 'Experiments for Bamboo Slicer.' }}
    />
  </StrictMode>,
);
