import React from 'react';
import BombForm from './BombForm';
import './App.css';

function App() {
  return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BombForm />
        </div>
      </div>
  );
}

export default App;