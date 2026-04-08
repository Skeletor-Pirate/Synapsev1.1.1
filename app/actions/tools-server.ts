'use server';

import axios from 'axios';

/**
 * Tool: Search News (World News API)
 */
export async function search_news(query: string) {
  try {
    const API_KEY = process.env.WORLD_NEWS_API_KEY;
    if (!API_KEY) {
      console.warn("WORLD_NEWS_API_KEY is not set.");
      return { error: "News API key is not configured." };
    }

    const response = await axios.get('https://api.worldnewsapi.com/search-news', {
      params: {
        text: query,
        language: 'en',
        number: 5
      },
      headers: {
        'x-api-key': API_KEY
      }
    });

    return {
      query,
      articles: response.data.news.map((article: any) => ({
        title: article.title,
        url: article.url,
        summary: article.summary,
        sentiment: article.sentiment
      }))
    };
  } catch (error) {
    console.error("Error in search_news:", error);
    return { error: "Failed to fetch news." };
  }
}
