import { Injectable } from '@nestjs/common';

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
}

@Injectable()
export class AiService {
  private minimaxApiKey: string;
  private deepseekApiKey: string;
  private minimaxBaseUrl = 'https://api.minimax.chat/v1';

  constructor() {
    this.minimaxApiKey = process.env.MINIMAX_API_KEY || '';
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY || '';
  }

  async classifyNews(
    title: string,
    summary: string,
  ): Promise<'AI' | 'frontend'> {
    const prompt = `判断以下新闻属于哪个分类（AI或前端技术）：

标题：${title}
内容：${summary}

只返回：AI 或 前端`;

    try {
      return await this.classifyWithDeepSeek(prompt);
    } catch {
      return await this.classifyWithMinimax(prompt);
    }
  }

  private async classifyWithDeepSeek(
    prompt: string,
  ): Promise<'AI' | 'frontend'> {
    if (!this.deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    return content.includes('前端') ? 'frontend' : 'AI';
  }

  private async classifyWithMinimax(
    prompt: string,
  ): Promise<'AI' | 'frontend'> {
    if (!this.minimaxApiKey) {
      throw new Error('MINIMAX_API_KEY not configured');
    }

    const response = await fetch(
      `${this.minimaxBaseUrl}/text/chatcompletion_v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.minimaxApiKey}`,
        },
        body: JSON.stringify({
          model: 'MiniMax-M2.7',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 10,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Minimax API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    return content.includes('前端') ? 'frontend' : 'AI';
  }

  async searchNews(channel: 'AI' | 'frontend'): Promise<NewsItem[]> {
    const prompt = this.buildPrompt(channel);

    // 优先使用DeepSeek，失败则用MiniMax
    try {
      return await this.searchWithDeepSeek(prompt);
    } catch (error) {
      console.warn('DeepSeek failed, trying MiniMax:', error);
      return await this.searchWithMinimax(prompt);
    }
  }

  private buildPrompt(channel: 'AI' | 'frontend'): string {
    return `You are a news aggregator. Return the latest 10 hottest ${channel} technology news items as JSON.

IMPORTANT: Output ONLY the JSON object below. No markdown, no explanation, no other text.

{
  "news": [
    {
      "title": "Article Title",
      "summary": "Brief summary in Chinese",
      "url": "https://real-url-to-article",
      "source": "Source site name",
      "publishedAt": "YYYY-MM-DD"
    }
  ]
}`;
  }

  private async searchWithMinimax(prompt: string): Promise<NewsItem[]> {
    if (!this.minimaxApiKey) {
      throw new Error('MINIMAX_API_KEY not configured');
    }

    const response = await fetch(
      `${this.minimaxBaseUrl}/text/chatcompletion_v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.minimaxApiKey}`,
        },
        body: JSON.stringify({
          model: 'MiniMax-M2.7',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4096,
          mask_sensitive_info: false,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Minimax API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return this.parseJsonResponse(content);
  }

  private async searchWithDeepSeek(prompt: string): Promise<NewsItem[]> {
    // 支持DeepSeek API Key或放在MINIMAX_API_KEY中的DeepSeek格式key
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.MINIMAX_API_KEY;

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return this.parseJsonResponse(content);
  }

  private parseJsonResponse(content: string): NewsItem[] {
    if (!content) {
      return [];
    }

    const trimmed = content.trim();

    // 1. Extract JSON from markdown code blocks
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;

    // 2. Try parsing the extracted text directly
    try {
      return this.extractNewsArray(JSON.parse(jsonText));
    } catch {
      // fall through to regex extraction
    }

    // 3. Try to find and parse a JSON object
    const objMatch = jsonText.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return this.extractNewsArray(JSON.parse(objMatch[0]));
      } catch {
        // fall through
      }
    }

    // 4. Try to find and parse a JSON array
    const arrMatch = jsonText.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        const parsed = JSON.parse(arrMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // fall through
      }
    }

    console.error(
      'Failed to parse AI response, raw content (first 500 chars):',
      trimmed.slice(0, 500),
    );
    return [];
  }

  private extractNewsArray(parsed: unknown): NewsItem[] {
    if (Array.isArray(parsed)) {
      return parsed as NewsItem[];
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, unknown>;
      for (const key of ['news', 'data', 'items', 'articles', 'results']) {
        if (Array.isArray(obj[key])) {
          return obj[key] as NewsItem[];
        }
      }
    }
    return [];
  }
}
