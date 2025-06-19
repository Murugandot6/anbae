import React from 'react';
import './SkyBackground.css';

const SkyBackground = () => {
  return (
    <div className="sky-background">
      <div className="moon"></div>
      <div className="stars"></div> {/* Re-added element for stars */}
    </div>
  );
};

export default SkyBackground;