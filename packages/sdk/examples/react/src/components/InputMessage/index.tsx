import React from 'react';

import { Container } from './styles';

const InputMessage: React.FC = () => {
  return <Container tabIndex={1} contentEditable={true} placeholder="Type here"></Container>;
};

export { InputMessage };
