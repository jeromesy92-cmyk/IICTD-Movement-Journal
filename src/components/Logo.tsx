import React from 'react';

export const Logo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .spin-slow {
              animation: spin 24s linear infinite;
              transform-origin: 100px 100px;
            }
            .spin-reverse {
              animation: spin 32s linear infinite reverse;
              transform-origin: 100px 100px;
            }
          `}
        </style>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="outerGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Dark Background */}
      <circle cx="100" cy="100" r="98" fill="#00050a" />
      
      {/* Outer Glowing Ring */}
      <circle cx="100" cy="100" r="95" stroke="#0ea5e9" strokeWidth="2" filter="url(#outerGlow)" opacity="0.6" />
      <circle cx="100" cy="100" r="92" stroke="#0ea5e9" strokeWidth="1" opacity="0.4" />

      {/* Inner Globe Area */}
      <mask id="globeMask">
        <circle cx="100" cy="100" r="78" fill="white" />
      </mask>
      
      <g mask="url(#globeMask)">
        <circle cx="100" cy="100" r="78" fill="#001a33" />
        
        {/* Globe Grid/Lines */}
        <g className="spin-slow">
          <circle cx="100" cy="100" r="70" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.2" />
          <ellipse cx="100" cy="100" rx="30" ry="70" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.2" />
          <ellipse cx="100" cy="100" rx="70" ry="30" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.2" />
        </g>
        
        {/* Stylized Continents/Nodes */}
        <path d="M60 60C70 50 90 45 110 55C130 65 145 85 135 105C125 125 105 135 85 125C65 115 55 75 60 60Z" fill="#0ea5e9" opacity="0.08" />
        
        {/* Network Connections */}
        <g opacity="0.4" className="spin-reverse">
          <line x1="60" y1="80" x2="100" y2="55" stroke="#0ea5e9" strokeWidth="1" />
          <line x1="100" y1="55" x2="150" y2="85" stroke="#0ea5e9" strokeWidth="1" />
          <line x1="150" y1="85" x2="120" y2="140" stroke="#0ea5e9" strokeWidth="1" />
          <line x1="120" y1="140" x2="70" y2="130" stroke="#0ea5e9" strokeWidth="1" />
          <line x1="70" y1="130" x2="60" y2="80" stroke="#0ea5e9" strokeWidth="1" />
          <line x1="100" y1="55" x2="120" y2="140" stroke="#0ea5e9" strokeWidth="0.5" />
          
          <circle cx="60" cy="80" r="3" fill="#0ea5e9" filter="url(#glow)" />
          <circle cx="100" cy="55" r="3" fill="#0ea5e9" filter="url(#glow)" />
          <circle cx="150" cy="85" r="3" fill="#0ea5e9" filter="url(#glow)" />
          <circle cx="120" cy="140" r="3" fill="#0ea5e9" filter="url(#glow)" />
          <circle cx="70" cy="130" r="3" fill="#0ea5e9" filter="url(#glow)" />
        </g>
      </g>

      {/* Center Text IICTD */}
      <text 
        x="100" 
        y="118" 
        textAnchor="middle" 
        fill="#38bdf8" 
        style={{ 
          fontSize: '52px', 
          fontWeight: '900', 
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '-3px',
          filter: 'url(#glow)',
          paintOrder: 'stroke',
          stroke: '#0369a1',
          strokeWidth: '1px'
        }}
      >
        IICTD
      </text>

      {/* Circular Text */}
      <path id="textPathTop" d="M 20, 100 a 80,80 0 1,1 160,0" fill="none" />
      <path id="textPathBottom" d="M 20, 100 a 80,80 0 1,0 160,0" fill="none" />
      
      <text fill="#38bdf8" style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
        <textPath xlinkHref="#textPathTop" startOffset="50%" textAnchor="middle">
          INFRASTRUCTURE AND INFORMATION
        </textPath>
      </text>
      
      <text fill="#38bdf8" style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
        <textPath xlinkHref="#textPathBottom" startOffset="50%" textAnchor="middle" side="right">
          COMMUNICATION TECHNOLOGY DEPARTMENT
        </textPath>
      </text>
    </svg>
  );
};

export const LogoFull = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo className="w-14 h-14" />
      <div className="flex flex-col">
        <span className="text-2xl font-black text-white tracking-tighter leading-none">IICTD</span>
        <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest leading-none mt-1">Movement Journal</span>
      </div>
    </div>
  );
};
