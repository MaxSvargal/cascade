import React, { useEffect, useState } from 'react';

// Static star field with pre-calculated positions to avoid SSR/client mismatch
const generateStaticStarField = () => {
  // Increased pattern dimensions for better full-page coverage
  const patternWidth = 2400;
  const patternHeight = 1800;
  
  // Expanded star field with more stars distributed across the larger pattern
  const stars = [
    // Static stars (no animation) - distributed across the full pattern
    { x: 73, y: 45, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 156, y: 167, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 89, y: 278, radius: 0.9, color: '#00B8FF', opacity: 0.5 },
    { x: 345, y: 67, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 198, y: 45, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 289, y: 178, radius: 0.6, color: '#FFFFFF', opacity: 0.4 },
    { x: 356, y: 156, radius: 0.9, color: '#00B8FF', opacity: 0.3 },
    { x: 245, y: 234, radius: 0.6, color: '#FFFFFF', opacity: 0.5 },
    { x: 323, y: 98, radius: 0.8, color: '#00E599', opacity: 0.3 },
    { x: 298, y: 267, radius: 0.9, color: '#00B8FF', opacity: 0.4 },
    { x: 180, y: 130, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 190, y: 160, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 170, y: 180, radius: 0.9, color: '#00B8FF', opacity: 0.4 },
    { x: 820, y: 320, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 790, y: 310, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 770, y: 330, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 650, y: 200, radius: 0.9, color: '#00B8FF', opacity: 0.4 },
    { x: 550, y: 500, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 350, y: 300, radius: 0.9, color: '#00B8FF', opacity: 0.4 },
    { x: 150, y: 450, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 50, y: 350, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 500, y: 100, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 750, y: 150, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 400, y: 750, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 900, y: 500, radius: 0.9, color: '#00B8FF', opacity: 0.4 },
    { x: 200, y: 600, radius: 0.8, color: '#00E599', opacity: 0.3 },
    { x: 1000, y: 300, radius: 0.6, color: '#FFFFFF', opacity: 0.4 },
    { x: 600, y: 800, radius: 0.8, color: '#00E599', opacity: 0.3 },
    { x: 100, y: 700, radius: 0.6, color: '#FFFFFF', opacity: 0.4 },
    { x: 1100, y: 100, radius: 0.9, color: '#00B8FF', opacity: 0.3 },
    
    // Extended coverage - right side of pattern
    { x: 1300, y: 200, radius: 0.7, color: '#FFFFFF', opacity: 0.3 },
    { x: 1450, y: 350, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 1600, y: 150, radius: 0.6, color: '#00B8FF', opacity: 0.3 },
    { x: 1750, y: 400, radius: 0.9, color: '#FFFFFF', opacity: 0.4 },
    { x: 1850, y: 250, radius: 0.7, color: '#00E599', opacity: 0.3 },
    { x: 1950, y: 500, radius: 0.8, color: '#00B8FF', opacity: 0.4 },
    { x: 2100, y: 100, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 2200, y: 300, radius: 0.9, color: '#00E599', opacity: 0.4 },
    { x: 2300, y: 450, radius: 0.7, color: '#00B8FF', opacity: 0.3 },
    
    // Extended coverage - bottom area of pattern
    { x: 300, y: 1000, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 500, y: 1100, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 700, y: 1200, radius: 0.9, color: '#00B8FF', opacity: 0.4 },
    { x: 900, y: 1300, radius: 0.7, color: '#FFFFFF', opacity: 0.3 },
    { x: 1100, y: 1400, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 1300, y: 1500, radius: 0.6, color: '#00B8FF', opacity: 0.3 },
    { x: 1500, y: 1600, radius: 0.9, color: '#FFFFFF', opacity: 0.4 },
    { x: 1700, y: 1700, radius: 0.7, color: '#00E599', opacity: 0.3 },
    { x: 1900, y: 1200, radius: 0.8, color: '#00B8FF', opacity: 0.4 },
    { x: 2100, y: 1400, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    
    // Middle area coverage
    { x: 1200, y: 600, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 1400, y: 700, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 1600, y: 800, radius: 0.9, color: '#00B8FF', opacity: 0.4 },
    { x: 1800, y: 900, radius: 0.7, color: '#FFFFFF', opacity: 0.3 },
    { x: 2000, y: 1000, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 800, y: 1000, radius: 0.6, color: '#00B8FF', opacity: 0.3 },
    { x: 1000, y: 1100, radius: 0.9, color: '#FFFFFF', opacity: 0.4 },
    { x: 1200, y: 1200, radius: 0.7, color: '#00E599', opacity: 0.3 },
    
    // Additional scattered stars for natural distribution
    { x: 450, y: 650, radius: 0.6, color: '#FFFFFF', opacity: 0.3 },
    { x: 850, y: 750, radius: 0.8, color: '#00E599', opacity: 0.4 },
    { x: 1250, y: 850, radius: 0.7, color: '#00B8FF', opacity: 0.3 },
    { x: 1650, y: 950, radius: 0.9, color: '#FFFFFF', opacity: 0.4 },
    { x: 2050, y: 650, radius: 0.6, color: '#00E599', opacity: 0.3 },
    { x: 250, y: 950, radius: 0.8, color: '#00B8FF', opacity: 0.4 },
    { x: 750, y: 1050, radius: 0.7, color: '#FFFFFF', opacity: 0.3 },
    { x: 1150, y: 1150, radius: 0.9, color: '#00E599', opacity: 0.4 },
    { x: 1550, y: 1250, radius: 0.6, color: '#00B8FF', opacity: 0.3 },
    { x: 1950, y: 1350, radius: 0.8, color: '#FFFFFF', opacity: 0.4 },
    
    // Flickering stars with varied timings and patterns - distributed across full pattern
    { x: 234, y: 89, radius: 0.9, color: '#00B8FF', opacity: 0.4, flicker: 'a' },
    { x: 312, y: 234, radius: 0.8, color: '#00E599', opacity: 0.3, flicker: 'b' },
    { x: 267, y: 123, radius: 0.8, color: '#00E599', opacity: 0.5, flicker: 'c' },
    { x: 123, y: 198, radius: 0.9, color: '#00B8FF', opacity: 0.3, flicker: 'd' },
    { x: 45, y: 134, radius: 0.9, color: '#00B8FF', opacity: 0.4, flicker: 'e' },
    { x: 167, y: 267, radius: 0.8, color: '#00E599', opacity: 0.3, flicker: 'f' },
    { x: 134, y: 89, radius: 0.8, color: '#00E599', opacity: 0.4, flicker: 'g' },
    { x: 67, y: 189, radius: 0.9, color: '#00B8FF', opacity: 0.4, flicker: 'h' },
    { x: 178, y: 145, radius: 0.6, color: '#FFFFFF', opacity: 0.3, flicker: 'i' },
    { x: 112, y: 67, radius: 0.8, color: '#00E599', opacity: 0.4, flicker: 'j' },
    { x: 220, y: 170, radius: 0.9, color: '#00B8FF', opacity: 0.4, flicker: 'k' },
    { x: 210, y: 140, radius: 0.8, color: '#00E599', opacity: 0.4, flicker: 'l' },
    { x: 780, y: 280, radius: 0.9, color: '#00B8FF', opacity: 0.4, flicker: 'm' },
    { x: 810, y: 290, radius: 0.9, color: '#00B8FF', opacity: 0.4, flicker: 'n' },
    { x: 450, y: 400, radius: 0.8, color: '#00E599', opacity: 0.3, flicker: 'o' },
    { x: 750, y: 600, radius: 0.8, color: '#00E599', opacity: 0.4, flicker: 'p' },
    { x: 950, y: 150, radius: 0.8, color: '#00E599', opacity: 0.4, flicker: 'q' },
    { x: 850, y: 750, radius: 0.9, color: '#00B8FF', opacity: 0.3, flicker: 'r' },
    { x: 1050, y: 550, radius: 0.6, color: '#FFFFFF', opacity: 0.4, flicker: 's' },
    { x: 380, y: 120, radius: 0.8, color: '#00E599', opacity: 0.4, flicker: 't' },
    
    // Additional flickering stars in extended areas
    { x: 1400, y: 500, radius: 0.8, color: '#00E599', opacity: 0.4, flicker: 'a' },
    { x: 1600, y: 700, radius: 0.9, color: '#00B8FF', opacity: 0.3, flicker: 'b' },
    { x: 1800, y: 300, radius: 0.7, color: '#FFFFFF', opacity: 0.4, flicker: 'c' },
    { x: 2000, y: 800, radius: 0.8, color: '#00E599', opacity: 0.3, flicker: 'd' },
    { x: 2200, y: 600, radius: 0.6, color: '#00B8FF', opacity: 0.4, flicker: 'e' },
    { x: 1300, y: 1000, radius: 0.9, color: '#FFFFFF', opacity: 0.3, flicker: 'f' },
    { x: 1500, y: 1200, radius: 0.8, color: '#00E599', opacity: 0.4, flicker: 'g' },
    { x: 1700, y: 1400, radius: 0.7, color: '#00B8FF', opacity: 0.3, flicker: 'h' },
    { x: 1900, y: 1600, radius: 0.8, color: '#FFFFFF', opacity: 0.4, flicker: 'i' },
    { x: 2100, y: 1300, radius: 0.6, color: '#00E599', opacity: 0.3, flicker: 'j' },
    
    // Hero stars (distributed across the pattern for better coverage)
    { x: 400, y: 200, radius: 1.2, color: '#00E599', opacity: 0.6, isHero: true },
    { x: 700, y: 400, radius: 1.4, color: '#00B8FF', opacity: 0.7, isHero: true },
    { x: 300, y: 600, radius: 1.3, color: '#00E599', opacity: 0.5, isHero: true },
    { x: 900, y: 250, radius: 1.2, color: '#00B8FF', opacity: 0.6, isHero: true },
    { x: 1500, y: 300, radius: 1.3, color: '#00E599', opacity: 0.6, isHero: true },
    { x: 1800, y: 600, radius: 1.2, color: '#00B8FF', opacity: 0.7, isHero: true },
    { x: 2000, y: 400, radius: 1.4, color: '#FFFFFF', opacity: 0.5, isHero: true },
    { x: 1200, y: 1000, radius: 1.3, color: '#00E599', opacity: 0.6, isHero: true },
    { x: 1600, y: 1200, radius: 1.2, color: '#00B8FF', opacity: 0.7, isHero: true },
    { x: 800, y: 1400, radius: 1.4, color: '#FFFFFF', opacity: 0.5, isHero: true },
  ];
  
  return { stars, patternWidth, patternHeight };
};

// Generate stars once outside the component to prevent regeneration
const STAR_FIELD = generateStaticStarField();

export default function AnimatedHeaderBackground() {
  const { stars, patternWidth, patternHeight } = STAR_FIELD;
  
  // Scroll-based animation state
  const [scrollY, setScrollY] = useState(0);
  
  // Track scroll position for cosmic scene animation
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Calculate transform values based on scroll
  // Zoom out: scale decreases as user scrolls down (much more dramatic)
  // Move up: translateY becomes more negative as user scrolls down (faster)
  const scrollProgress = Math.min(scrollY / 3500, 1); // Normalize scroll to 0-1 over 1500px (faster response)
  const scaleValue = 1.2 - (scrollProgress * 0.8); // Scale from 1 to 0.02 (almost invisible)
  const translateYValue = -(scrollProgress * 200); // Move up by 400px max (faster upward movement)
  
  return (
    <>
      {/* Global styles that work without JavaScript */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Sun Animations */
          @keyframes sun-pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.08; }
            50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.15; }
          }
          
          @keyframes sun-corona {
            0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.15; }
            25% { transform: translate(-50%, -50%) scale(1.03) rotate(45deg); opacity: 0.2; }
            50% { transform: translate(-50%, -50%) scale(0.97) rotate(90deg); opacity: 0.1; }
            75% { transform: translate(-50%, -50%) scale(1.02) rotate(135deg); opacity: 0.18; }
          }
          
          @keyframes sun-core {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.25; }
            33% { transform: translate(-50%, -50%) scale(1.06); opacity: 0.35; }
            66% { transform: translate(-50%, -50%) scale(0.94); opacity: 0.2; }
          }
          
          @keyframes sun-inner {
            0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.35; }
            20% { transform: translate(-50%, -50%) scale(1.08) rotate(72deg); opacity: 0.45; }
            40% { transform: translate(-50%, -50%) scale(0.92) rotate(144deg); opacity: 0.25; }
            60% { transform: translate(-50%, -50%) scale(1.05) rotate(216deg); opacity: 0.4; }
            80% { transform: translate(-50%, -50%) scale(0.95) rotate(288deg); opacity: 0.3; }
          }
          
          @keyframes sun-surface {
            0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
            25% { transform: translate(-50%, -50%) scale(1.03) rotate(90deg); }
            50% { transform: translate(-50%, -50%) scale(0.97) rotate(180deg); }
            75% { transform: translate(-50%, -50%) scale(1.02) rotate(270deg); }
          }

          @keyframes sun-flare-1 {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg) scaleY(1); opacity: 0.2; }
            25% { transform: translate(-50%, -50%) rotate(15deg) scaleY(1.5); opacity: 0.35; }
            50% { transform: translate(-50%, -50%) rotate(30deg) scaleY(0.8); opacity: 0.15; }
            75% { transform: translate(-50%, -50%) rotate(45deg) scaleY(1.2); opacity: 0.25; }
          }

          @keyframes sun-flare-2 {
            0%, 100% { transform: translate(-50%, -50%) rotate(90deg) scaleX(1); opacity: 0.15; }
            33% { transform: translate(-50%, -50%) rotate(105deg) scaleX(1.4); opacity: 0.25; }
            66% { transform: translate(-50%, -50%) rotate(120deg) scaleX(0.7); opacity: 0.1; }
          }

          /* Star Flickering - Quick opacity spikes with varied timings */
          @keyframes star-flicker-a {
            0%, 85%, 100% { opacity: 0.4; }
            87%, 89% { opacity: 0.9; }
          }
          
          @keyframes star-flicker-b {
            0%, 70%, 100% { opacity: 0.3; }
            72%, 74% { opacity: 0.8; }
          }
          
          @keyframes star-flicker-c {
            0%, 60%, 100% { opacity: 0.5; }
            62%, 63% { opacity: 1.0; }
          }
          
          @keyframes star-flicker-d {
            0%, 45%, 100% { opacity: 0.3; }
            47%, 49% { opacity: 0.85; }
          }
          
          @keyframes star-flicker-e {
            0%, 30%, 100% { opacity: 0.4; }
            32%, 34% { opacity: 0.95; }
          }
          
          @keyframes star-flicker-f {
            0%, 75%, 100% { opacity: 0.3; }
            77%, 78% { opacity: 0.9; }
          }
          
          @keyframes star-flicker-g {
            0%, 55%, 100% { opacity: 0.4; }
            57%, 59% { opacity: 0.8; }
          }
          
          @keyframes star-flicker-h {
            0%, 40%, 100% { opacity: 0.4; }
            42%, 44% { opacity: 1.0; }
          }
          
          @keyframes star-flicker-i {
            0%, 65%, 100% { opacity: 0.3; }
            67%, 68% { opacity: 0.75; }
          }
          
          @keyframes star-flicker-j {
            0%, 20%, 100% { opacity: 0.4; }
            22%, 24% { opacity: 0.9; }
          }
          
          @keyframes star-flicker-k {
            0%, 80%, 100% { opacity: 0.4; }
            82%, 84% { opacity: 0.85; }
          }
          
          @keyframes star-flicker-l {
            0%, 35%, 100% { opacity: 0.4; }
            37%, 38% { opacity: 0.95; }
          }
          
          @keyframes star-flicker-m {
            0%, 50%, 100% { opacity: 0.4; }
            52%, 54% { opacity: 0.8; }
          }
          
          @keyframes star-flicker-n {
            0%, 25%, 100% { opacity: 0.4; }
            27%, 29% { opacity: 1.0; }
          }
          
          @keyframes star-flicker-o {
            0%, 90%, 100% { opacity: 0.3; }
            92%, 93% { opacity: 0.75; }
          }
          
          @keyframes star-flicker-p {
            0%, 15%, 100% { opacity: 0.4; }
            17%, 19% { opacity: 0.9; }
          }
          
          @keyframes star-flicker-q {
            0%, 95%, 100% { opacity: 0.4; }
            97%, 98% { opacity: 0.85; }
          }
          
          @keyframes star-flicker-r {
            0%, 10%, 100% { opacity: 0.3; }
            12%, 14% { opacity: 0.8; }
          }
          
          @keyframes star-flicker-s {
            0%, 68%, 100% { opacity: 0.4; }
            70%, 72% { opacity: 0.9; }
          }
          
          @keyframes star-flicker-t {
            0%, 38%, 100% { opacity: 0.4; }
            40%, 41% { opacity: 1.0; }
          }
          
          /* Atmospheric breathing */
          @keyframes breathe {
            0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1.1); }
            50% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.9); }
          }
          
          /* Animation classes */
          .animate-sun-pulse { 
            animation: sun-pulse 10s ease-in-out infinite;
            opacity: 0.08;
            transform: translate(-50%, -50%) scale(1);
          }
          .animate-sun-corona { 
            animation: sun-corona 14s ease-in-out infinite;
            opacity: 0.15;
            transform: translate(-50%, -50%) scale(1);
          }
          .animate-sun-core { 
            animation: sun-core 8s ease-in-out infinite;
            opacity: 0.25;
            transform: translate(-50%, -50%) scale(1);
          }
          .animate-sun-inner { 
            animation: sun-inner 6s ease-in-out infinite;
            opacity: 0.35;
            transform: translate(-50%, -50%) scale(1);
          }
          .animate-sun-surface { 
            animation: sun-surface 15s linear infinite;
            transform: translate(-50%, -50%) scale(1);
          }
          .animate-sun-flare-1 { 
            animation: sun-flare-1 4s ease-in-out infinite;
            opacity: 0.2;
            transform: translate(-50%, -50%) rotate(0deg) scaleY(1);
          }
          .animate-sun-flare-2 { 
            animation: sun-flare-2 5s ease-in-out infinite;
            opacity: 0.15;
            transform: translate(-50%, -50%) rotate(90deg) scaleX(1);
          }
          .animate-star-twinkle-a { 
            animation: star-flicker-a 7.3s linear infinite;
            animation-delay: 0.2s;
          }
          .animate-star-twinkle-b { 
            animation: star-flicker-b 5.7s linear infinite;
            animation-delay: 1.1s;
          }
          .animate-star-twinkle-c { 
            animation: star-flicker-c 8.9s linear infinite;
            animation-delay: 2.3s;
          }
          .animate-star-twinkle-d { 
            animation: star-flicker-d 6.1s linear infinite;
            animation-delay: 0.7s;
          }
          .animate-star-twinkle-e { 
            animation: star-flicker-e 9.4s linear infinite;
            animation-delay: 3.2s;
          }
          .animate-star-twinkle-f { 
            animation: star-flicker-f 4.8s linear infinite;
            animation-delay: 1.9s;
          }
          .animate-star-twinkle-g { 
            animation: star-flicker-g 7.6s linear infinite;
            animation-delay: 0.4s;
          }
          .animate-star-twinkle-h { 
            animation: star-flicker-h 5.2s linear infinite;
            animation-delay: 2.8s;
          }
          .animate-star-twinkle-i { 
            animation: star-flicker-i 8.1s linear infinite;
            animation-delay: 1.5s;
          }
          .animate-star-twinkle-j { 
            animation: star-flicker-j 6.7s linear infinite;
            animation-delay: 0.9s;
          }
          .animate-star-twinkle-k { 
            animation: star-flicker-k 9.8s linear infinite;
            animation-delay: 3.6s;
          }
          .animate-star-twinkle-l { 
            animation: star-flicker-l 4.3s linear infinite;
            animation-delay: 2.1s;
          }
          .animate-star-twinkle-m { 
            animation: star-flicker-m 7.9s linear infinite;
            animation-delay: 0.6s;
          }
          .animate-star-twinkle-n { 
            animation: star-flicker-n 5.5s linear infinite;
            animation-delay: 2.7s;
          }
          .animate-star-twinkle-o { 
            animation: star-flicker-o 8.4s linear infinite;
            animation-delay: 1.3s;
          }
          .animate-star-twinkle-p { 
            animation: star-flicker-p 6.9s linear infinite;
            animation-delay: 3.8s;
          }
          .animate-star-twinkle-q { 
            animation: star-flicker-q 4.6s linear infinite;
            animation-delay: 0.8s;
          }
          .animate-star-twinkle-r { 
            animation: star-flicker-r 9.1s linear infinite;
            animation-delay: 2.4s;
          }
          .animate-star-twinkle-s { 
            animation: star-flicker-s 5.9s linear infinite;
            animation-delay: 1.7s;
          }
          .animate-star-twinkle-t { 
            animation: star-flicker-t 7.2s linear infinite;
            animation-delay: 3.1s;
          }

          /* Performance optimizations */
          .cosmic-scene {
            will-change: transform;
          }
          
          /* Star field optimizations */
          svg {
            will-change: auto;
            contain: layout style paint;
          }
          
          circle {
            will-change: opacity;
          }

          /* Media query for reduced motion preference */
          @media (prefers-reduced-motion: reduce) {
            .animate-sun-pulse,
            .animate-sun-corona,
            .animate-sun-core,
            .animate-sun-inner,
            .animate-sun-surface,
            .animate-sun-flare-1,
            .animate-sun-flare-2,
            .animate-star-twinkle-a,
            .animate-star-twinkle-b,
            .animate-star-twinkle-c,
            .animate-star-twinkle-d,
            .animate-star-twinkle-e,
            .animate-star-twinkle-f,
            .animate-star-twinkle-g,
            .animate-star-twinkle-h,
            .animate-star-twinkle-i,
            .animate-star-twinkle-j,
            .animate-star-twinkle-k,
            .animate-star-twinkle-l,
            .animate-star-twinkle-m,
            .animate-star-twinkle-n,
            .animate-star-twinkle-o,
            .animate-star-twinkle-p,
            .animate-star-twinkle-q,
            .animate-star-twinkle-r,
            .animate-star-twinkle-s,
            .animate-star-twinkle-t {
              animation: none;
            }
            
            /* Static fallback opacity values */
            .animate-sun-pulse { opacity: 0.05; }
            .animate-sun-corona { opacity: 0.1; }
            .animate-sun-core { opacity: 0.2; }
            .animate-sun-inner { opacity: 0.3; }
            .animate-sun-flare-1 { opacity: 0.15; }
            .animate-sun-flare-2 { opacity: 0.1; }
          }
        `
      }} />
      
      <div className="w-full h-full" style={{ contain: 'layout style paint' }}>
        {/* Algorithmic Star Field Background */}
        <div className="absolute inset-0 bg-black">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Dynamically generated star pattern */}
              <pattern 
                id="starField" 
                x="0" 
                y="0" 
                width={patternWidth} 
                height={patternHeight} 
                patternUnits="userSpaceOnUse"
              >
                <g opacity="0.9">
                  {stars.map((star, index) => (
                    <circle
                      key={index}
                      cx={star.x}
                      cy={star.y}
                      r={star.radius}
                      fill={star.color}
                      opacity={star.opacity}
                      className={star.flicker ? `animate-star-twinkle-${star.flicker}` : ''}
                      style={{
                        filter: star.isHero 
                          ? `drop-shadow(0 0 ${star.radius * 2}px ${star.color})` 
                          : undefined
                      }}
                    />
                  ))}
                  
                  {/* Add subtle nebula-like background elements distributed across the larger pattern */}
                  <ellipse
                    cx={patternWidth * 0.2}
                    cy={patternHeight * 0.3}
                    rx="120"
                    ry="80"
                    fill="#00E599"
                    opacity="0.03"
                    style={{ filter: 'blur(40px)' }}
                  />
                  <ellipse
                    cx={patternWidth * 0.6}
                    cy={patternHeight * 0.5}
                    rx="100"
                    ry="60"
                    fill="#00B8FF"
                    opacity="0.02"
                    style={{ filter: 'blur(35px)' }}
                  />
                  <ellipse
                    cx={patternWidth * 0.4}
                    cy={patternHeight * 0.15}
                    rx="80"
                    ry="50"
                    fill="#FFFFFF"
                    opacity="0.015"
                    style={{ filter: 'blur(30px)' }}
                  />
                  <ellipse
                    cx={patternWidth * 0.8}
                    cy={patternHeight * 0.7}
                    rx="110"
                    ry="70"
                    fill="#00E599"
                    opacity="0.025"
                    style={{ filter: 'blur(45px)' }}
                  />
                  <ellipse
                    cx={patternWidth * 0.3}
                    cy={patternHeight * 0.8}
                    rx="90"
                    ry="55"
                    fill="#00B8FF"
                    opacity="0.02"
                    style={{ filter: 'blur(38px)' }}
                  />
                  <ellipse
                    cx={patternWidth * 0.75}
                    cy={patternHeight * 0.25}
                    rx="75"
                    ry="45"
                    fill="#FFFFFF"
                    opacity="0.018"
                    style={{ filter: 'blur(32px)' }}
                  />
                </g>
              </pattern>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#starField)" />
          </svg>
        </div>

        {/* Cosmic Scene - Planet and Sun */}
        <div 
          className="absolute inset-0 cosmic-scene"
          style={{
            transform: `scale(${scaleValue}) translateY(${translateYValue}px)`
          }}
        >
          {/* Central Pivot Point - All cosmic elements positioned relative to this */}
          <div className="absolute" 
               style={{
                 left: '73%',
                 top: '85%',
                 transform: 'translate(-50%, -50%)'
               }}>
            
            <div className="absolute" 
                 style={{
                   left: '-330px',
                   top: '-230px',
                   transform: 'translate(-50%, -50%)'
                 }}>
            {/* Sun - Rising behind planet from bottom-left */}
            <div className="absolute" 
                 style={{
                   width: '1600px',
                   height: '800px',
                   left: '450px',
                   top: '100px',
                   transform: 'translate(-50%, -50%)'
                 }}>
              <div className="absolute inset-0 bg-[#00E599] rounded-full animate-sun-pulse" 
                   style={{ filter: 'blur(180px)' }}>
              </div>
            </div>
            
            {/* Sun Outer Corona */}
            <div className="absolute" 
                 style={{
                   width: '640px',
                   height: '640px',
                   left: '80px',
                   top: '140px',
                   transform: 'translate(-50%, -50%)'
                 }}>
              <div className="absolute inset-0 bg-[#00E599] rounded-full animate-sun-corona" 
                   style={{ filter: 'blur(100px)' }}>
              </div>
            </div>
            
            {/* Sun Core - Brighter center */}
            <div className="absolute" 
                 style={{
                   width: '320px',
                   height: '500px',
                   left: '200px',
                   top: '180px',
                   transform: 'translate(-50%, -50%)'
                 }}>
              <div className="absolute inset-0 bg-[#00E599] rounded-full animate-sun-core" 
                   style={{ filter: 'blur(60px)' }}>
              </div>
            </div>
            
            {/* Sun Inner Core */}
            <div className="absolute" 
                 style={{
                   width: '180px',
                   height: '160px',
                   left: '96px',
                   top: '50px',
                   transform: 'translate(-50%, -50%)'
                 }}>
              <div className="absolute inset-0 bg-[#00E599] rounded-full animate-sun-inner" 
                   style={{ filter: 'blur(20px)' }}>
              </div>
            </div>
            
            {/* Sun Surface - Solid core */}
            <div className="absolute w-16 h-16 bg-[#00E599] rounded-full animate-sun-surface" 
                 style={{
                   filter: 'drop-shadow(0 0 60px #00E599) drop-shadow(0 0 120px #00E599) drop-shadow(0 0 180px #00E599)',
                   left: '20px',
                   top: '-14px',
                   transform: 'translate(-50%, -50%)'
                 }}>
            </div>

            {/* Sun Flares */}
            <div className="absolute w-4 h-24 bg-[#00E599] rounded-full animate-sun-flare-1" 
                 style={{
                   filter: 'blur(14px)',
                   left: '0px',
                   top: '0px',
                   transform: 'translate(-50%, -50%)'
                 }}>
            </div>
            
            <div className="absolute w-24 h-4 bg-[#00E599] rounded-full animate-sun-flare-2" 
                 style={{
                   filter: 'blur(8px)',
                   left: '20px',
                   top: '-20px',
                   transform: 'translate(-50%, -50%)'
                 }}>
            </div>
            </div>

            {/* First layer - Atmosphere (mostly static with very subtle breathing) */}
            <div className="absolute" 
                 style={{
                   width: '1200px',
                   height: '1200px',
                   left: '760px',
                   top: '710px',
                   transform: 'translate(-50%, -50%)'
                 }}>
              <div className="absolute inset-0 bg-black rounded-full" 
                   style={{ 
                     filter: 'blur(25px)',
                     animation: 'breathe 10s ease-in-out infinite'
                   }}>
              </div>
            </div>
            
            {/* Second layer - Shadow edge (small subtle edge effect) */}
            <div className="absolute" 
                 style={{
                   width: '900px',
                   height: '900px',
                   left: '20px',
                   top: '18px',
                   transform: 'translate(-50%, -50%)'
                 }}>
              <div className="absolute inset-0 bg-black rounded-full opacity-15" 
                   style={{ filter: 'blur(4px)' }}>
              </div>
            </div>
            
            {/* Third layer - The Planet (solid, static) */}
            <div className="absolute" 
                 style={{
                   width: '800px',
                   height: '800px',
                   left: '0px',
                   top: '0px',
                   transform: 'translate(-50%, -50%)'
                 }}>
              <div className="absolute inset-0 bg-black rounded-full opacity-100">
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 