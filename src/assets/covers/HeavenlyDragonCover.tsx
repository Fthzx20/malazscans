import React from 'react';

export const HeavenlyDragonCover: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className="w-full h-full object-cover" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="300" height="400" fill="#0F0F0F"/>
    <path d="M150 50 L270 250 L150 350 L300 150 Z" fill="#222222"/>
    <path d="M150 50 L30 250 L150 350 Z" fill="#1A1A1A"/>
    <circle cx="150" cy="200" r="40" stroke="#FF3D00" strokeWidth="2"/>
    <text x="150" y="370" fontFamily="sans-serif" fontWeight="900" fontSize="14" fill="#FAFAFA" textAnchor="middle" letterSpacing="4">NAGA SURGAWI</text>
  </svg>
);
