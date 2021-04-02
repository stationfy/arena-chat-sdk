import React from 'react';

import { Container } from './styles';
import { IProfileImage } from './types';

const ProfileImage: React.FC<IProfileImage> = (props) => {
  const { imageUrl } = props;

  return <Container imageUrl={imageUrl} />;
};

export { ProfileImage };
