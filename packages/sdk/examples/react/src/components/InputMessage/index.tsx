import React, { useEffect, useRef } from 'react';

import { Container } from './styles';
import { IInputMessage } from './types';

const InputMessage: React.FC<IInputMessage> = (props) => {
  const { onInput, value } = props;

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value === '') {
      if (contentRef.current !== null) {
        contentRef.current.innerText = '';
      }
    }
  }, [value]);

  return <Container tabIndex={1} onInput={onInput} contentEditable={true} ref={contentRef} />;
};

export { InputMessage };
