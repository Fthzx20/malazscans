import React from 'react';

export const EsV1C1Illustration: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className="w-full max-w-lg mx-auto border border-[#262626] h-80" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="600" height="400" fill="#0F0F0F"/>
    <line x1="100" y1="50" x2="500" y2="350" stroke="#FF3D00" strokeWidth="2" strokeDasharray="10 5"/>
    <circle cx="300" cy="200" r="80" stroke="#FAFAFA" strokeWidth="1"/>
    <text x="30" y="50" fontFamily="monospace" fontSize="12" fill="#737373">INSERT ILLUSTRATION: THE QUANTUM CORE</text>
  </svg>
);
