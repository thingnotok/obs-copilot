import {
  ObsCopilotConfig,
  getObsCopilotConfig,
  saveObsCopilotConfig,
} from '@/config';
import {
  Heading,
  Text,
  Switch,
  Grid,
  RadioGroup,
  Stack,
  Radio,
  Textarea,
  Input,
  Link,
} from '@chakra-ui/react';
import LogseqClient from '@pages/logseq/client';

import { Select } from 'chakra-react-select';
import React, { useEffect } from 'react';
import styles from '../Options.module.scss';
import Browser from 'webextension-polyfill';

const client = new LogseqClient();

export const ClipNoteOptions = () => {
  const [init, setInit] = React.useState(false);

  const [logseqConfig, setLogseqConfig] = React.useState<ObsCopilotConfig>();
  const [allPages, setAllPages] = React.useState([]);

  const [clipShortCut, setClipShortCut] = React.useState();

  useEffect(() => {
    if (!init) {
      getObsCopilotConfig().then((config) => {
        setLogseqConfig(config);
        setInit(true);
      });

      // Browser.commands
      //   .getAll()
      //   .then((commands) =>
      //     commands.forEach(
      //       (command) =>
      //         command.name === 'clip' && setClipShortCut(command.shortcut),
      //     ),
      //   );
    }
  });

  const updateConfig = (key: string, value: string) => {
    setLogseqConfig({
      ...logseqConfig,
      [key]: value,
    });
    saveObsCopilotConfig({
      [key]: value,
    });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig(e.target.name, e.target.value || e.target.checked);
  };

  const onClipNoteLocationSelect = (value: string) => {
    updateConfig('clipNoteLocation', value);
  };

  const onClipNoteCustomPageSelect = (value) => {
    updateConfig('clipNoteCustomPage', value.value);
  };

  // const setShortCut = () => {
  //   // window.location = 'chrome://extensions/shortcuts';
  //   // Browser.commands.getAll();
  //   // Browser.commands.update();

  // };

  return (
    <>
      <Heading size={'lg'}>Log and Clip Destination (Journal)</Heading>

      <Grid
        width={'full'}
        gridTemplateColumns={'200px 1fr'}
        alignItems={'center'}
        justifyItems={'left'}
        rowGap={2}
        columnGap={2}
      >
        <Text fontSize={'md'} mb="0">
          Journal Location
        </Text>
        <Input
          name="journalFolder"
          placeholder="Journal Folder"
          onChange={onChange}
          value={logseqConfig?.journalFolder}
        />
      </Grid>
    </>
  );
};
