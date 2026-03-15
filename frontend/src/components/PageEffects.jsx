import React from 'react';
import GhostCursor from './GhostCursor';
import DarkVeil from './DarkVeil';
import ClickSpark from './ClickSpark';

export default function PageEffects({ children }) {
  return (
    <ClickSpark sparkColor="#fff">
      {/* GhostCursor – interactive trail behind mouse */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <GhostCursor
          trailLength={30}
          inertia={0.3}
          grainIntensity={0.02}
          bloomStrength={0.5}
          bloomRadius={0.8}
          bloomThreshold={0.1}
          brightness={1.2}
          color="#a78bfa" // soft purple
          edgeIntensity={0.3}
        />
      </div>
      {/* DarkVeil – animated background */}
      <div className="fixed inset-0 -z-10">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0.05}
          scanlineIntensity={0.1}
          speed={0.3}
          scanlineFrequency={500}
          warpAmount={0.02}
        />
      </div>
      {/* Page content */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </ClickSpark>
  );
}