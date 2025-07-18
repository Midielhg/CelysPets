import React from 'react';
import { Link } from 'react-router-dom';

const SimpleTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: 'red', minHeight: '200px' }}>
      <h1 style={{ color: 'white', fontSize: '32px' }}>TEST - This should be visible</h1>
      <p style={{ color: 'white', fontSize: '18px' }}>If you can see this red box, the routing works.</p>
      <Link to="/book" style={{ color: 'yellow', fontSize: '16px' }}>Book Now Link Test</Link>
    </div>
  );
};

export default SimpleTest;
