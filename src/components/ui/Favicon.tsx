import React, { useEffect } from 'react';

const Favicon: React.FC = () => {
  useEffect(() => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Background - blue gear
      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, 2 * Math.PI);
      ctx.fillStyle = '#3949AB';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FF0000';
      ctx.stroke();
      
      // Inner white circle
      ctx.beginPath();
      ctx.arc(32, 32, 18, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
      
      // Person silhouette
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(32, 24, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(26, 30);
      ctx.quadraticCurveTo(32, 45, 38, 30);
      ctx.fill();
      
      // Red star
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.moveTo(45, 20);
      ctx.lineTo(47, 25);
      ctx.lineTo(52, 25);
      ctx.lineTo(48, 29);
      ctx.lineTo(50, 34);
      ctx.lineTo(45, 31);
      ctx.lineTo(40, 34);
      ctx.lineTo(42, 29);
      ctx.lineTo(38, 25);
      ctx.lineTo(43, 25);
      ctx.closePath();
      ctx.fill();
      
      // Convert canvas to favicon
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.setAttribute('type', 'image/x-icon');
      link.setAttribute('rel', 'shortcut icon');
      link.setAttribute('href', canvas.toDataURL('image/x-icon'));
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, []);

  return null;
};

export default Favicon;
