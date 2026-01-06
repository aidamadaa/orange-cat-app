import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ShoppingCart, ExternalLink, ShoppingBag, Link as LinkIcon, Check } from 'lucide-react';
import { wrapDeepLink } from '../utils/deepLink';

interface MarkdownMessageProps {
  content: string;
}

// Helper component for the Copy Link Button
const CopyLinkButton = ({ url }: { url: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button 
            onClick={handleCopy}
            className="ml-1 p-0.5 text-gray-400 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 inline-flex items-center justify-center align-middle"
            title="Copy Clean Affiliate Link"
        >
            {copied ? <Check size={12} className="text-green-600" /> : <LinkIcon size={12} />}
        </button>
    );
};

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  return (
    <div className="prose prose-stone prose-sm max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            
            return isInline ? (
              <code className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono text-pink-600 border border-gray-200" {...props}>
                {children}
              </code>
            ) : (
              <div className="relative group my-2">
                <div className="absolute top-0 right-0 bg-gray-200 text-xs text-gray-600 px-2 py-1 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity">
                  {match?.[1] || 'code'}
                </div>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto border border-gray-200 text-gray-800">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1 text-gray-800">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1 text-gray-800">{children}</ol>,
          li: ({ children }) => <li className="text-gray-800">{children}</li>,
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-gray-800">{children}</p>,
          a: ({ href, children }) => {
            // GLOBALLY ENFORCE DEEP-LINK LOCKDOWN
            const finalHref = wrapDeepLink(href || '');

            // Determine Platform for UI Styling
            const isAmazon = finalHref.includes('amazon') || finalHref.includes('amzn.to');
            const isShopee = finalHref.includes('shopee') || finalHref.includes('shope.ee');

            return (
                <span className="inline-flex items-center gap-0.5 group/link">
                    <a 
                    href={finalHref} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`
                        inline-flex items-center gap-1 transition-colors underline underline-offset-2 break-all
                        ${isAmazon ? 'text-amber-600 hover:text-amber-700 font-medium' : 
                        isShopee ? 'text-orange-600 hover:text-orange-700 font-bold' : 
                        'text-blue-600 hover:text-blue-700'}
                    `}
                    >
                    {isAmazon && <ShoppingCart size={12} className="inline-block shrink-0" />}
                    {isShopee && <ShoppingBag size={12} className="inline-block shrink-0" />}
                    {!isAmazon && !isShopee && <ExternalLink size={10} className="inline-block shrink-0 opacity-70" />}
                    {children}
                    </a>
                    {/* Copy Link Button - Hidden until hover */}
                    {(isAmazon || isShopee) && (
                        <span className="opacity-0 group-hover/link:opacity-100 transition-opacity">
                            <CopyLinkButton url={finalHref} />
                        </span>
                    )}
                </span>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-2 bg-gray-50 italic text-gray-600">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 text-gray-900">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3 text-gray-900">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-3 text-gray-900">{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}