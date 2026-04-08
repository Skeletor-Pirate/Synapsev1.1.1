import { zaggle } from './connectors/zaggle';
import { zoho } from './connectors/zoho';
import { dq } from './quality/expectations';
import { query, getClient } from './storage/postgres';
import { analytics } from './analytics/columnar';

export const DataLayer = {
  connectors: {
    zaggle,
    zoho,
  },
  quality: dq,
  storage: {
    query,
    getClient,
  },
  analytics,
};

export default DataLayer;
