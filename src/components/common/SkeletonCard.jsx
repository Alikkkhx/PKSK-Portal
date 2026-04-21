import React from 'react';

export const SkeletonCard = () => (
  <div className="glass-card skeleton-card">
    <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: '12px' }} />
    <div className="skeleton" style={{ height: '60px', width: '100%', marginBottom: '12px' }} />
    <div className="skeleton" style={{ height: '20px', width: '40%' }} />
  </div>
);
