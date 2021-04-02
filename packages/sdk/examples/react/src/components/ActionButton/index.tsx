import React from 'react';

import { Container } from './styles';
import { IActionButton } from './types';

const ActionButton: React.FC<IActionButton> = (props) => {
  const { action, iconUrl, size, hideOnMobile } = props;
  return <Container iconUrl={iconUrl} size={size} onClick={action} hideOnMobile={hideOnMobile} />;
};

export { ActionButton };
