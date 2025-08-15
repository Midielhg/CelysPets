import React, { useState, useEffect } from 'react';
import type { InstagramPost } from '../services/instagram';
import { instagramService } from '../services/instagram';

interface InstagramFeedProps {
  limit?: number;
  className?: string;
}

const InstagramFeed: React.FC<InstagramFeedProps> = ({ limit = 8, className = '' }) => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const instagramPosts = await instagramService.getPosts(limit);
        setPosts(instagramPosts);
      } catch (err) {
        setError('Failed to load Instagram posts');
        console.error('Instagram feed error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [limit]);

  const formatCaption = (caption: string = '', maxLength: number = 100) => {
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + '...';
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'VIDEO':
        return '▶️';
      case 'CAROUSEL_ALBUM':
        return '📸';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="aspect-square rounded-2xl bg-amber-200/50 animate-pulse flex items-center justify-center">
              <div className="text-amber-400 text-2xl">📷</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-amber-700 mb-4">
          <span className="text-3xl block mb-2">📷</span>
          <p>Unable to load Instagram posts</p>
          <p className="text-sm text-amber-600 mt-2">
            Visit our{' '}
            <a 
              href="https://www.instagram.com/celypets/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-amber-800"
            >
              Instagram page
            </a>{' '}
            directly
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            {/* Post Image/Video */}
            <div className="aspect-square relative">
              <img
                src={post.thumbnail_url || post.media_url}
                alt={formatCaption(post.caption, 50)}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  // Fallback to a gradient background if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.className += ' bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center';
                    parent.innerHTML = '<span class="text-4xl">📷</span>';
                  }
                }}
              />
              
              {/* Media Type Indicator */}
              {getMediaIcon(post.media_type) && (
                <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-sm">
                  {getMediaIcon(post.media_type)}
                </div>
              )}
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center text-white p-4">
                <div className="text-2xl mb-2">❤️</div>
                {post.caption && (
                  <p className="text-sm font-medium">
                    {formatCaption(post.caption, 60)}
                  </p>
                )}
              </div>
            </div>

            {/* Instagram Icon Overlay */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/90 p-2 rounded-full">
                <span className="text-pink-600 text-lg">📷</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default InstagramFeed;
