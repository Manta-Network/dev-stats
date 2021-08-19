import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import * as Realm from 'realm-web';
import {
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis
} from 'recharts';

const realmApp = new Realm.App({ id: 'benchmark-vrsnt' });

function App() {
  const [user, setUser] = useState(undefined);
  const [benchmarks, setBenchmarks] = useState({});
  useEffect(() => {
    realmApp.logIn(Realm.Credentials.anonymous())
      .then(
        async (user) => {
          setUser(user);
        })
      .catch(error => { console.error('login failure', error); });
  }, []);
  useEffect(() => {
    if (!!user) {
      const client = user.mongoClient('mongodb-atlas');
      const db = client.db('Manta-Network');
      db.collection('Manta').find()
        .then(all => all.reduce((aA, aI) => (
          {
            ...aA,
            [aI.pallet]: all.filter(pfI => pfI.pallet === aI.pallet).reduce((pA, pI) => (
              {
                ...pA,
                [pI.extrinsic]: all.filter(efI => efI.extrinsic === pI.extrinsic && efI.pallet === pI.pallet).map(x => ({
                  time: x.actual.time,
                  unit: x.actual.unit,
                  machine: x.machine,
                  repo: x.repo,
                  sha: x.sha.slice(0, 7),
                  observed: x.observed, // todo: replace with commit time, when available
                }))
              }
            ), {})
          }
        ), {}))
        .then(setBenchmarks);
    }
  }, [user]);

  return (
    <Container>
      {
        Object.keys(benchmarks).map(pallet => (
          <div key={pallet}>
            <h2>{pallet}</h2>
            {
              Object.keys(benchmarks[pallet]).map(extrinsic => (
                <Row key={extrinsic}>
                  <h3>{extrinsic}</h3>
                  <Col>
                    <LineChart width={600} height={400} data={benchmarks[pallet][extrinsic]}>
                      <Line type="monotone" dataKey="time" stroke="#8884d8" />
                      <CartesianGrid stroke="#ccc" />
                      <XAxis dataKey="sha" />
                      <YAxis />
                    </LineChart>
                  </Col>
                  <Col>
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>sha</th>
                          <th>time</th>
                          <th>machine</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          benchmarks[pallet][extrinsic].map(benchmark => (
                            <tr key={benchmark.sha}>
                              <td>
                                <a href={`https://github.com/${benchmark.repo}/commit/${benchmark.sha}`}>
                                  {benchmark.sha}
                                </a>
                              </td>
                              <td>{benchmark.time} {benchmark.unit}</td>
                              <td>{benchmark.machine}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              ))
            }
          </div>
        ))
      }
    </Container>
  );
}

export default App;

//const filteredBenchmarks = benchmarks.map(x => ({ time: x.actual.time, sha: x.sha.slice(0, 7) }));
/*
*/
