import React from 'react';

import { Container } from './styles';
import { ILoader } from './types';

const Loader: React.FC<ILoader> = (props) => {
  return <Container {...props} />;
};

export { Loader };
