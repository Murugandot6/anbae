import React from 'react';

const VideoBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden z-[-1]">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-1/2 left-1/2 w-full h-full object-cover transform -translate-x-1/2 -translate-y-1/2"
      >
        {/* Replace 'your-video.mp4' with the actual path to your video file. */}
        {/* You can also add multiple <source> tags for different video formats (e.g., .webm, .ogg) for broader browser compatibility. */}
        <source src="/videos/my-background-video.mp4" type="video/mp4" /> {/* Updated path example */}
        Your browser does not support the video tag.
      </video>
      {/* Optional: Add an overlay for better text readability */}
      <div className="absolute inset-0 bg-black opacity-20"></div>
    </div>
  );
};

export default VideoBackground;