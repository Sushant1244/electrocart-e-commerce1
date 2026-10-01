import React from 'react';

export default function Pages(){
  return (
    <div className="container" role="main">
      <h1>Pages</h1>
      <p>Utility pages and helpful links.</p>
      <ul>
        <li><a href="/about">About Us</a></li>
        <li><a href="/new">New Arrivals</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a href="/">Home</a></li>
      </ul>
    </div>
  );
}
