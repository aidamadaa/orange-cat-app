import { AMAZON_AFFILIATE_TAG, SHOPEE_AFFILIATE_ID, SHOPEE_AFFILIATE_USERNAME } from '../constants';

/**
 * DEEP-LINK LOCKDOWN UTILITY
 * Globally enforces affiliate tagging for Amazon and Shopee.
 * Strips competitor parameters and injects Master Tags.
 */
export const wrapDeepLink = (originalUrl: string): string => {
  if (!originalUrl) return '';

  let finalUrl = originalUrl.trim();
  
  // 1. Ensure Protocol to prevent invalid URL errors
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('mailto:')) {
      finalUrl = `https://${finalUrl}`;
  }

  try {
      let urlObj: URL;
      try {
          urlObj = new URL(finalUrl);
      } catch (e) {
          // Handle potential partial encoding issues
          urlObj = new URL(encodeURI(finalUrl));
      }

      const hostname = urlObj.hostname.toLowerCase();

      //Options for strict checking
      const isAmazon = hostname.includes('amazon') || hostname.includes('amzn.to');
      const isShopee = hostname.includes('shopee') || hostname.includes('shope.ee');

      // === AMAZON DEEP-LINK LOCKDOWN ===
      if (isAmazon) {
          // We can only process full amazon links, not shortened amzn.to (client-side limitation)
          if (hostname.includes('amazon')) {
             // 1. Strip Competitor Tags & Junk Parameters
             const paramsToRemove = [
                 'tag', 'linkCode', 'ref', 'ref_', 'ascsubtag', 
                 'qid', 'sr', 'crid', 'sprefix', 'context', 'psc', 
                 'pf_rd_r', 'pf_rd_p', 'pd_rd_r', 'pd_rd_w', 'pd_rd_wg',
                 'content-id', 'creative', 'creativeASIN', 'smid'
             ];
             paramsToRemove.forEach(p => urlObj.searchParams.delete(p));

             // 2. Inject Master Affiliate Tags
             urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
             urlObj.searchParams.set('linkCode', 'll2'); // Standard Text Link Code
             urlObj.searchParams.set('language', 'en_US');
          }
      }

      // === SHOPEE DEEP-LINK LOCKDOWN ===
      else if (isShopee) {
          // 1. Force Malaysia Domain (Context: RM, MyHalalShop)
          if (hostname === 'shopee.com') {
              urlObj.hostname = 'shopee.com.my';
          }

          if (hostname.includes('shopee')) {
              // 2. Strip Competitor/Junk Tracking
              const paramsToRemove = [
                  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                  'gclid', 'fbclid', 'af_siteid', 'pid', 'af_click_lookback', 'af_adset_id',
                  'is_from_login', 'smtt', 'sp_atk', 'xptdk', 'ppid'
              ];
              paramsToRemove.forEach(p => urlObj.searchParams.delete(p));

              // 3. Inject Master Affiliate Data (Universal Link Strategy)
              
              // Username -> utm_source (Standard practice if AMS link not available)
              if (SHOPEE_AFFILIATE_USERNAME) {
                  urlObj.searchParams.set('utm_source', SHOPEE_AFFILIATE_USERNAME);
              } else {
                  urlObj.searchParams.set('utm_source', 'affiliate');
              }
              
              // Affiliate Medium
              urlObj.searchParams.set('utm_medium', 'affiliate');
              
              // Affiliate ID -> utm_content
              if (SHOPEE_AFFILIATE_ID) {
                  urlObj.searchParams.set('utm_content', SHOPEE_AFFILIATE_ID);
              }
              
              // Campaign Tracking to identify App Traffic
              urlObj.searchParams.set('utm_campaign', 'orangecat_lockdown');
          }
      }

      return urlObj.toString();

  } catch (e) {
      // If URL parsing fails (e.g. malformed), return original to prevent crash
      // console.warn("DeepLink Wrap Failed:", e);
      return originalUrl;
  }
};