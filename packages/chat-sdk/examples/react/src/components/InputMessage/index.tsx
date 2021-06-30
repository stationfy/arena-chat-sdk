import React, { useCallback, useEffect, useRef } from 'react';

import { Container } from './styles';
import { IInputMessage } from './types';

const InputMessage: React.FC<IInputMessage> = (props) => {
  const { setValue, value, disabled } = props;

  const contentRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(
    (e) => {
      setValue(e.currentTarget.innerText);
    },
    [setValue],
  );

  useEffect(() => {
    if (value === '') {
      if (contentRef.current !== null) {
        contentRef.current.innerText = '';
      }
    }
  }, [value]);

  return <Container tabIndex={1} onInput={handleInput} contentEditable={!disabled} ref={contentRef} />;
};

export { InputMessage };
