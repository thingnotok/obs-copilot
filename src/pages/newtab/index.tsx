import { createRoot } from 'react-dom/client';
import Newtab from './Newtab';
import './index.scss';
import { ChakraProvider } from '@chakra-ui/react';

const container = document.getElementById('app-container');
const root = createRoot(container!);
root.render(
  <ChakraProvider>
    <Newtab />
  </ChakraProvider>,
);
