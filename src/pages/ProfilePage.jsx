// =============================================
// FILE: src/pages/ProfilePage.jsx
// =============================================
import React from 'react';
import { themeTokens } from '@lib/theme.js';
import Profile from '@features/profile/Profile.jsx';

export default function ProfilePage() {
  const T = React.useMemo(() => themeTokens(), []);

  return <Profile T={T} />;
}
