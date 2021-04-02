import React from 'react';

import { Container } from './styles';
import { IMessage } from './types';

const Message: React.FC<IMessage> = (props) => {
  const { owner, children } = props;

  return <Container owner={owner}>{children}</Container>;
};

export { Message };
