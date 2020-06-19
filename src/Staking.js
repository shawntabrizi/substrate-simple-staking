import React, { useEffect, useState } from 'react';
import { Table, Grid, Button } from 'semantic-ui-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useSubstrate } from './substrate-lib';

export default function Main(props) {
  const { api, keyring } = useSubstrate();
  const accounts = keyring.getPairs();
  const [validators, setValidators] = useState([]);

  useEffect(() => {
    let unsubscribeAll = null;

    api.derive.staking.stashes().then(
      stashes => stashes.map(api.derive.accounts.info)
    ).then(promises => {
      Promise.all(promises).then(setValidators);
    }).then(unsub => {
      unsubscribeAll = unsub;
    }).catch(console.error);

    return () => unsubscribeAll && unsubscribeAll();
  }, [api, setValidators]);

  return (
    <Grid.Column>
      <h1>Validators</h1>
      {JSON.stringify(validators[0])}
      <Table celled striped size='small'>
        <Table.Body>{validators && validators.map(account =>
          <Table.Row key={account.accountId}>
            <Table.Cell width={3} textAlign='right'>{account.identity.display}</Table.Cell>
            <Table.Cell width={10}>
              <span style={{ display: 'inline-block', minWidth: '31em' }}>
                {account.accountId.toString()}
              </span>
              <CopyToClipboard text={account.accountId}>
                <Button
                  basic
                  circular
                  compact
                  size='mini'
                  color='blue'
                  icon='copy outline'
                />
              </CopyToClipboard>
            </Table.Cell>
            <Table.Cell width={3}>{account.identity.email}</Table.Cell>
          </Table.Row>
        )}
        </Table.Body>
      </Table>
    </Grid.Column>
  );
}
