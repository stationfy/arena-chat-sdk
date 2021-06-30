import React from 'react';

import { Container } from './styles';
import { IProfileImage } from './types';

const ProfileImage: React.FC<IProfileImage> = (props) => {
  return <Container {...props} />;
};

export { ProfileImage };
