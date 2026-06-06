import React from 'react';

export const MidnightCafeCover: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className="w-full h-full object-cover" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="300" height="400" fill="#0F0F0F"/>
    <path d="M70 120 C70 120 100 80 150 120 C200 160 230 120 230 120" stroke="#737373" strokeWidth="2"/>
    <rect x="90" y="180" width="120" height="100" fill="#1A1A1A" stroke="#FAFAFA" strokeWidth="2"/>
    <path d="M210 200 C230 200 230 230 210 230" stroke="#FAFAFA" strokeWidth="2"/>
    <circle cx="150" cy="230" r="15" fill="#FF3D00"/>
    <text x="150" y="360" fontFamily="sans-serif" fontWeight="900" fontSize="14" fill="#FAFAFA" textAnchor="middle" letterSpacing="4">KAFE TENGAH MALAM</text>
  </svg>
);
