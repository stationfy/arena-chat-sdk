import { createGlobalStyle } from 'styled-components';
import { normalize } from 'styled-normalize';
import { theme } from './theme';

export const GlobalStyle = createGlobalStyle`
    ${normalize}

    html{
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: "Haas Grot Text R Web", "Helvetica Neue", Helvetica, Arial, sans-serif;
        font-weight: 400;
        letter-spacing: 1px;
        background-color: ${theme.colors.lightBlue};

        #root{
             width: 100%;
            }
    }

    body{
        display:flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        width: 100%;
        max-width: 500px;


    }


`;
