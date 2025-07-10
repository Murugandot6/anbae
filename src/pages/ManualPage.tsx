import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ManualPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Anbae - Manual</title>
        <meta name="description" content="Anbae application manual and guide." />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <h1 className="text-4xl font-bold mb-6">Manual Page</h1>
        <p className="text-lg text-center mb-8 max-w-prose">
          This is where the application manual and detailed instructions will be displayed.
          You can add sections, images, and more information here to guide users.
        </p>
        <Button onClick={() => navigate('/')}>Go Back Home</Button>
      </div>
    </>
  );
};

export default ManualPage;