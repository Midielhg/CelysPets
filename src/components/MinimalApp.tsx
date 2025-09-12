const MinimalApp = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightblue' }}>
      <h1>🚀 React App is Working!</h1>
      <p>If you can see this, React is rendering correctly.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default MinimalApp;
