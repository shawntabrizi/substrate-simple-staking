import React, { useEffect, useState } from 'react';
import { Table, Grid, Button, Checkbox } from 'semantic-ui-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useSubstrate } from './substrate-lib';

export default function Main(props) {
  const { api, keyring } = useSubstrate();
  const accounts = keyring.getPairs();
  const [stashes, setStashes] = useState({});
  const [individualPoints, setIndividualPoints] = useState({})
  const [totalPoints, setTotalPoints] = useState(0);

  const [validators, setValidators] = useState([]);
  const [nextElected, setNextElected] = useState([]);


  useEffect(() => {
    let unsubscribeAll = null;

    api.derive.staking.stashes().then(
      stashes => stashes.map(api.derive.accounts.info)
    ).then(promises => {
      Promise.all(promises).then(
        stashes => {
          // Convert array of objects to a lookup dictionary based on accountId
          let lookup = stashes.reduce((acc, cur) => {
            acc[cur.accountId] = cur;
            return acc;
          }, {});
          setStashes(lookup)
        }
      );
    }).then(unsub => {
      unsubscribeAll = unsub;
    }).catch(console.error);

    return () => unsubscribeAll && unsubscribeAll();
  }, [api, setStashes]);

  useEffect(() => {
    let unsubscribeAll = null;

    if (validators) {
      api.derive.staking.currentPoints(
        points => {
          setTotalPoints(points.total);
          setIndividualPoints(Object.fromEntries(points.individual));
        }
      ).then(unsub => {
        unsubscribeAll = unsub;
      }).catch(console.error);
    }

    return () => unsubscribeAll && unsubscribeAll();
  }, [api, setTotalPoints]);

  useEffect(() => {
    let unsubscribeAll = null;

    if (validators) {
      api.derive.staking.validators(
        validators => {
          setValidators(validators.validators);
          setNextElected(validators.nextElected);
        }
      ).then(unsub => {
        unsubscribeAll = unsub;
      }).catch(console.error);
    }

    return () => unsubscribeAll && unsubscribeAll();
  }, [api, setTotalPoints]);

  return (
    <Grid.Column>
      <h1>Validators</h1>
      <Table sortable celled striped size='small' fixed>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Selected</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>AccountId</Table.HeaderCell>
            <Table.HeaderCell>Identity</Table.HeaderCell>
            <Table.HeaderCell>Points (Total: {totalPoints.toString()})</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>{stashes && Object.keys(stashes).map(id => {
          let account = stashes[id];

          return (
            <Table.Row key={account.accountId}>
              <Table.Cell width={1}>
                <Checkbox slider />
              </Table.Cell>
              <Table.Cell width={1}>
                {validators.includes(id) ? 'Validator' : ''}
                {nextElected.includes(id) ? 'Next Up' : ''}
              </Table.Cell>
              <Table.Cell width={6}>
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
              <Table.Cell width={2}>{JSON.stringify(account.identity)}</Table.Cell>
              <Table.Cell width={2}>{individualPoints[id] ? individualPoints[id].toString() : ''}</Table.Cell>
            </Table.Row>
          )
        })}
        </Table.Body>
      </Table>
    </Grid.Column>
  );
}
