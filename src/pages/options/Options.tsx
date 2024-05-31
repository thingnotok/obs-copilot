import {
  Flex,
  Container,
  Heading,
  Text,
  Link,
  Divider,
} from '@chakra-ui/react';
import { ObsidianConnectOptions } from './components/Connect';
import { ClipNoteOptions } from './components/ClipNote';
import styles from './Options.module.scss';

const Options = () => {
  return (
    <Container className={styles.options} maxW={'56rem'} mt={'1rem'}>
      <Flex direction={'row'}>
        <Flex direction={'column'} w={'16rem'}>
          <Heading>Obsidian Copilot</Heading>
        </Flex>
        <Flex direction={'column'} w={'40rem'} gap={2}>
          <ObsidianConnectOptions />

          <Divider />

          <ClipNoteOptions />
        </Flex>
      </Flex>
    </Container>
  );
};

export default Options;
