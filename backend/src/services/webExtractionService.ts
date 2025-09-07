import axios from 'axios';
import * as cheerio from 'cheerio';
// import puppeteer from 'puppeteer'; // Disabled for lighter build
import { JSDOM } from 'jsdom';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

export interface WebExtractionResult {
  url: string;
  title: string;
  content: string;
  metadata: {
    method: string;
    word_count: number;
    char_count: number;
    processing_time: number;
    domain: string;
    extracted_at: string;
    images?: string[];
    links?: string[];
    headings?: string[];
    author?: string;
    publish_date?: string;
    description?: string;
  };
}

export interface WebExtractionOptions {
  method?: 'jina' | 'cheerio' | 'auto';
  includeImages?: boolean;
  includeLinks?: boolean;
  includeHeadings?: boolean;
  maxContentLength?: number;
  timeout?: number;
}

class WebExtractionService {
  private defaultOptions: WebExtractionOptions = {
    method: 'auto',
    includeImages: false,
    includeLinks: false,
    includeHeadings: true,
    maxContentLength: 50000, // 50KB max content
    timeout: 30000 // 30 seconds
  };

  async extractFromUrl(url: string, options: WebExtractionOptions = {}): Promise<WebExtractionResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    try {
      logger.info('Starting web extraction', { url, options: opts });

      // Validate URL
      const validatedUrl = this.validateAndNormalizeUrl(url);
      const domain = new URL(validatedUrl).hostname;

      // Choose extraction method
      let method = opts.method;
      if (method === 'auto') {
        method = await this.selectBestMethod(validatedUrl);
      }

      let result: WebExtractionResult;

      switch (method) {
        case 'jina':
          result = await this.extractWithJina(validatedUrl, opts);
          break;
        case 'cheerio':
          result = await this.extractWithCheerio(validatedUrl, opts);
          break;
        // case 'puppeteer':
        //   result = await this.extractWithPuppeteer(validatedUrl, opts);
        //   break;
        default:
          throw createError(`Unsupported extraction method: ${method}`, 400);
      }

      // Add processing metadata
      result.metadata.processing_time = Date.now() - startTime;
      result.metadata.domain = domain;
      result.metadata.extracted_at = new Date().toISOString();

      logger.info('Web extraction completed', {
        url: validatedUrl,
        method: result.metadata.method,
        contentLength: result.content.length,
        processingTime: result.metadata.processing_time
      });

      return result;

    } catch (error: any) {
      logger.error('Web extraction failed', { url, error: error.message });
      throw error;
    }
  }

  private validateAndNormalizeUrl(url: string): string {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);
      
      // Security check - block local/private IPs
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname === 'localhost' || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.') ||
          hostname === '127.0.0.1') {
        throw createError('Access to local/private networks is not allowed', 403);
      }

      return urlObj.toString();
    } catch (error) {
      throw createError(`Invalid URL format: ${url}`, 400);
    }
  }

  private async selectBestMethod(url: string): Promise<'jina' | 'cheerio'> {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Use Jina for general web content (fastest and most reliable)
    if (domain.includes('news') || 
        domain.includes('blog') || 
        domain.includes('article') ||
        domain.includes('wikipedia')) {
      return 'jina';
    }

    // Use Cheerio for complex SPAs or dynamic content
    if (domain.includes('app') || 
        url.includes('javascript') ||
        domain.includes('react') ||
        domain.includes('angular')) {
      return 'cheerio';
    }

    // Default to Jina (fastest and free)
    return 'jina';
  }

  private async extractWithJina(url: string, options: WebExtractionOptions): Promise<WebExtractionResult> {
    try {
      logger.info('Using Jina AI Reader for extraction', { url });

      const jinaUrl = `https://r.jina.ai/${url}`;
      const response = await axios.get(jinaUrl, {
        timeout: options.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ExelokaBot/1.0)'
        }
      });

      if (!response.data) {
        throw new Error('No content received from Jina AI');
      }

      // Jina returns clean markdown content
      const content = response.data.toString().trim();
      
      // Extract title from the first line or heading
      const lines = content.split('\n');
      const title = this.extractTitleFromContent(lines);
      
      // Limit content length
      const limitedContent = options.maxContentLength ? 
        content.substring(0, options.maxContentLength) : 
        content;

      return {
        url,
        title,
        content: limitedContent,
        metadata: {
          method: 'jina',
          word_count: this.countWords(limitedContent),
          char_count: limitedContent.length,
          processing_time: 0, // Will be set by caller
          domain: '',
          extracted_at: '',
          description: lines.find((line: string) => line.length > 50 && line.length < 200)?.substring(0, 200)
        }
      };

    } catch (error: any) {
      logger.error('Jina extraction failed', { error: error.message, url });
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw createError('Jina AI service is currently unavailable. Please try again later.', 503);
      } else if (error.response?.status === 404) {
        throw createError('The requested URL could not be found or accessed.', 404);
      } else {
        throw createError(`Jina AI extraction failed: ${error.message}`, 500);
      }
    }
  }

  private async extractWithCheerio(url: string, options: WebExtractionOptions): Promise<WebExtractionResult> {
    try {
      logger.info('Using Cheerio for extraction', { url });

      const response = await axios.get(url, {
        timeout: options.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ExelokaBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);

      // Extract title
      const title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   'Untitled Document';

      // Remove unwanted elements
      $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();

      // Extract main content
      let content = '';
      const contentSelectors = [
        'article', 
        'main', 
        '.content', 
        '.post-content', 
        '.entry-content',
        '.article-content',
        '#content',
        'body'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 100) break; // Found substantial content
        }
      }

      // Fallback to body text if no content found
      if (!content) {
        content = $('body').text().trim();
      }

      // Clean up content
      content = content.replace(/\s+/g, ' ').trim();
      
      // Limit content length
      const limitedContent = options.maxContentLength ? 
        content.substring(0, options.maxContentLength) : 
        content;

      // Extract additional metadata if requested
      const metadata: any = {
        method: 'cheerio',
        word_count: this.countWords(limitedContent),
        char_count: limitedContent.length,
        processing_time: 0,
        domain: '',
        extracted_at: '',
        description: $('meta[name="description"]').attr('content') || 
                    $('meta[property="og:description"]').attr('content'),
        author: $('meta[name="author"]').attr('content') ||
               $('.author').first().text().trim()
      };

      if (options.includeImages) {
        metadata.images = $('img').map((_, img) => $(img).attr('src')).get()
          .filter(src => src && (src.startsWith('http') || src.startsWith('//')))
          .slice(0, 10); // Limit to 10 images
      }

      if (options.includeLinks) {
        metadata.links = $('a[href]').map((_, link) => $(link).attr('href')).get()
          .filter(href => href && (href.startsWith('http') || href.startsWith('//')))
          .slice(0, 20); // Limit to 20 links
      }

      if (options.includeHeadings) {
        metadata.headings = $('h1, h2, h3, h4, h5, h6').map((_, heading) => $(heading).text().trim()).get()
          .filter(text => text.length > 0)
          .slice(0, 10); // Limit to 10 headings
      }

      return {
        url,
        title,
        content: limitedContent,
        metadata
      };

    } catch (error: any) {
      logger.error('Cheerio extraction failed', { error: error.message, url });
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw createError('Unable to connect to the website. Please check the URL and try again.', 503);
      } else if (error.response?.status === 404) {
        throw createError('The requested URL could not be found.', 404);
      } else if (error.response?.status === 403) {
        throw createError('Access to this website is forbidden.', 403);
      } else {
        throw createError(`Web extraction failed: ${error.message}`, 500);
      }
    }
  }

  private async extractWithPuppeteer(url: string, options: WebExtractionOptions): Promise<WebExtractionResult> {
    // Puppeteer disabled for lighter build - fallback to axios/cheerio
    logger.info('Puppeteer not available, falling back to basic extraction', { url });
    return this.extractWithCheerio(url, options);
  }

  private extractTitleFromContent(lines: string[]): string {
    // @ts-ignore
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 200) {
        // Remove markdown headers
        const title = trimmed.replace(/^#+\s*/, '');
        if (title.length > 0) {
          return title;
        }
      }
    }
    return 'Extracted Content';
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  async validateUrl(url: string): Promise<boolean> {
    try {
      this.validateAndNormalizeUrl(url);
      return true;
    } catch {
      return false;
    }
  }

  getSupportedMethods(): string[] {
    return ['jina', 'cheerio', 'auto'];
  }
}

export const webExtractionService = new WebExtractionService();