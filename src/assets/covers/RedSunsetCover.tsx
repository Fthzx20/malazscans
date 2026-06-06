import React from 'react';

export const RedSunsetCover: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className="w-full h-full object-cover" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="300" height="400" fill="#0F0F0F"/>
    <path d="M0 400 L150 180 L300 400 Z" fill="#1A1A1A"/>
    <path d="M80 400 L200 240 L300 400 Z" fill="#262626"/>
    <circle cx="150" cy="160" r="50" fill="#FF3D00"/>
    <line x1="30" y1="50" x2="270" y2="50" stroke="#737373" strokeWidth="2"/>
    <text x="150" y="380" fontFamily="sans-serif" fontWeight="900" fontSize="14" fill="#FAFAFA" textAnchor="middle" letterSpacing="4">SENJA MERAH</text>
  </svg>
);
