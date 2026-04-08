'use server';

import axios from 'axios';

const API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export async function getStockPrice(symbol: string) {
  try {
    if (!API_KEY) {
      console.warn("FINNHUB_API_KEY is not set.");
      return null;
    }
    const response = await axios.get(`${BASE_URL}/quote`, {
      params: {
        symbol,
        token: API_KEY
      }
    });

    const quote = response.data;
    if (!quote || quote.c === 0) return null;

    return {
      symbol,
      price: quote.c,
      change: quote.dp,
    };
  } catch (error) {
    console.error('Error fetching stock price:', error);
    return null;
  }
}
