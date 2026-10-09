import React from 'react';
import PolicyPage from '../components/PolicyPage';
import { LICENSE_POLICY } from '../data/policies';

export default function LicensePolicy() {
  return <PolicyPage policy={LICENSE_POLICY} />;
}
