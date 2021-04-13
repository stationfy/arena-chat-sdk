import React from 'react';

import { Container } from './styles';
import { IActionButton } from './types';

const ActionButton: React.FC<IActionButton> = (props) => {
  return <Container {...props} />;
};

export { ActionButton };
