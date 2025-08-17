import React from 'react';
import { ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Simple SVG content for each character (placeholder - you can replace with actual SVG content)
const SVG_CONTENT = {
  'darth-coder': `<svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#000" stroke="#333" stroke-width="2"/>
    <circle cx="35" cy="40" r="5" fill="#ff0000"/>
    <circle cx="65" cy="40" r="5" fill="#ff0000"/>
    <rect x="40" y="55" width="20" height="8" fill="#333" rx="4"/>
  </svg>`,
  'william-shakesbeer': `<svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#8B4513" stroke="#654321" stroke-width="2"/>
    <circle cx="35" cy="40" r="3" fill="#000"/>
    <circle cx="65" cy="40" r="3" fill="#000"/>
    <path d="M35 60 Q50 70 65 60" stroke="#000" stroke-width="2" fill="none"/>
    <rect x="30" y="20" width="40" height="15" fill="#654321" rx="7"/>
  </svg>`,
  'nikola-testla': `<svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#4169E1" stroke="#1E90FF" stroke-width="2"/>
    <circle cx="35" cy="40" r="3" fill="#000"/>
    <circle cx="65" cy="40" r="3" fill="#000"/>
    <path d="M40 60 Q50 65 60 60" stroke="#000" stroke-width="2" fill="none"/>
    <path d="M45 25 L50 15 L55 25 M50 15 L50 30" stroke="#FFD700" stroke-width="2" fill="none"/>
  </svg>`,
  'tony-snark': `<svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#DC143C" stroke="#B22222" stroke-width="2"/>
    <circle cx="35" cy="40" r="3" fill="#000"/>
    <circle cx="65" cy="40" r="3" fill="#000"/>
    <path d="M35 65 Q50 55 65 65" stroke="#000" stroke-width="2" fill="none"/>
    <rect x="40" y="20" width="20" height="10" fill="#FFD700" rx="5"/>
  </svg>`,
};

interface BotAvatarProps {
  botId: string;
  size?: number;
  style?: ViewStyle;
}

export const BotAvatar: React.FC<BotAvatarProps> = ({
  botId,
  size = 32,
  style,
}) => {
  const svgContent = SVG_CONTENT[botId as keyof typeof SVG_CONTENT];

  if (!svgContent) {
    return null;
  }

  return <SvgXml xml={svgContent} width={size} height={size} style={style} />;
};

export const getBotAvatarIds = () => Object.keys(SVG_CONTENT);
