import React from 'react';
import DevView from '../../theater/DevView';

const Theater = () => {
  // The DevView component is designed to take up the full screen,
  // so we'll provide a container that allows it to do so.
  return (
    <div className="w-screen h-screen">
      <DevView />
    </div>
  );
};

export default Theater;