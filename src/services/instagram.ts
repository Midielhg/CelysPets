// Instagram API Service
export interface InstagramPost {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  permalink: string;
  timestamp: string;
}

export interface InstagramApiResponse {
  data: InstagramPost[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

class InstagramService {
  private accessToken: string | null = null;
  private userId: string | null = null;
  
  constructor() {
    // In production, these should be stored securely
    this.accessToken = process.env.REACT_APP_INSTAGRAM_ACCESS_TOKEN || null;
    this.userId = process.env.REACT_APP_INSTAGRAM_USER_ID || null;
  }

  /**
   * Get Instagram posts using Instagram Basic Display API
   */
  async getPosts(limit: number = 8): Promise<InstagramPost[]> {
    if (!this.accessToken || !this.userId) {
      console.warn('Instagram API credentials not configured');
      return this.getMockPosts();
    }

    try {
      const fields = 'id,media_type,media_url,thumbnail_url,caption,permalink,timestamp';
      const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }
      
      const data: InstagramApiResponse = await response.json();
      return data.data || [];
      
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      // Fallback to mock data if API fails
      return this.getMockPosts();
    }
  }

  /**
   * Get long-lived access token (this should be done server-side in production)
   */
  async exchangeToken(shortLivedToken: string): Promise<string | null> {
    try {
      const clientSecret = process.env.REACT_APP_INSTAGRAM_CLIENT_SECRET;
      const url = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`;
      
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();
      
      return data.access_token || null;
    } catch (error) {
      console.error('Error exchanging Instagram token:', error);
      return null;
    }
  }

  /**
   * Refresh long-lived access token
   */
  async refreshToken(): Promise<string | null> {
    if (!this.accessToken) return null;
    
    try {
      const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${this.accessToken}`;
      
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();
      
      return data.access_token || null;
    } catch (error) {
      console.error('Error refreshing Instagram token:', error);
      return null;
    }
  }

  /**
   * Mock data for development/fallback
   */
  private getMockPosts(): InstagramPost[] {
    return [
      {
        id: '1',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop',
        caption: 'Beautiful Golden Retriever after a full service grooming session! ✨🐕 #PetGrooming #Miami #CelysPets',
        permalink: 'https://www.instagram.com/p/example1/',
        timestamp: '2024-08-13T10:00:00+0000'
      },
      {
        id: '2',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop',
        caption: 'Persian cat enjoying a gentle de-shedding treatment 🐱💆‍♀️ #CatGrooming #PersianCat #MobileGrooming',
        permalink: 'https://www.instagram.com/p/example2/',
        timestamp: '2024-08-12T14:30:00+0000'
      },
      {
        id: '3',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1616190264687-b7ebf7aa447a?w=400&h=400&fit=crop',
        caption: 'Poodle looking fabulous with our special hypoallergenic shampoo! 🐩✨ #PoodleGrooming #SpecialShampoo',
        permalink: 'https://www.instagram.com/p/example3/',
        timestamp: '2024-08-11T16:45:00+0000'
      },
      {
        id: '4',
        media_type: 'VIDEO',
        media_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
        caption: 'Behind the scenes at Cely\'s Mobile Grooming! 🚐 #BehindTheScenes #MobileGrooming #Miami',
        permalink: 'https://www.instagram.com/p/example4/',
        timestamp: '2024-08-10T12:00:00+0000'
      },
      {
        id: '5',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop',
        caption: 'Dental care is so important! Fresh breath and healthy teeth 🦷✨ #DentalCare #PetHealth',
        permalink: 'https://www.instagram.com/p/example5/',
        timestamp: '2024-08-09T11:15:00+0000'
      },
      {
        id: '6',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop',
        caption: 'Happy customer review! 5 stars ⭐⭐⭐⭐⭐ #HappyCustomer #Review #CelysPets',
        permalink: 'https://www.instagram.com/p/example6/',
        timestamp: '2024-08-08T09:30:00+0000'
      },
      {
        id: '7',
        media_type: 'CAROUSEL_ALBUM',
        media_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
        caption: 'Pro tip: Regular brushing prevents matting! 💡 #GroomingTips #PetCare #Advice',
        permalink: 'https://www.instagram.com/p/example7/',
        timestamp: '2024-08-07T15:20:00+0000'
      },
      {
        id: '8',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop',
        caption: 'Amazing before and after transformation! 🔄❤️ #BeforeAndAfter #Transformation #PetGrooming',
        permalink: 'https://www.instagram.com/p/example8/',
        timestamp: '2024-08-06T13:45:00+0000'
      }
    ];
  }
}

export const instagramService = new InstagramService();
