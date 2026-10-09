import React from 'react';
import PolicyPage from '../components/PolicyPage';
import { CODE_OF_CONDUCT } from '../data/policies';

export default function CodeOfConduct() {
  return <PolicyPage policy={CODE_OF_CONDUCT} />;
}
