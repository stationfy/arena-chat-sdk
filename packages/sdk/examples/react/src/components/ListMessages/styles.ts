import styled from 'styled-components';

const Container = styled.div`
  height: 100%;
  padding: 0 20px;
  margin-top: 10px;
  overflow-y: auto;
  position: relative;
`;

const ScrollObservable = styled.div`
  position: absolute;
  height: 20px;
  width: 10px;
  z-index: 99;
`;

const LoadPreviousObservable = styled.div`
  height: 10px;
`;

const LoadingArea = styled.div`
  display: flex;
  padding: 30px;
  height: 30px;
  justify-content: center;
  align-items: center;
`;

export { Container, ScrollObservable, LoadPreviousObservable, LoadingArea };
