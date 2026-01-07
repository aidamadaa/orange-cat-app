import { AMAZON_AFFILIATE_TAG, SHOPEE_AFFILIATE_ID, SHOPEE_AFFILIATE_USERNAME } from '../constants';

/**
 * DEEP-LINK LOCKDOWN UTILITY
 * Globally enforces affiliate tagging for Amazon and Shopee.
 * Strips competitor parameters and injects Master Tags.
 */
export const wrapDeepLink = (originalUrl: string): string => {
  if (!originalUrl) return '';

  let finalUrl = originalUrl.trim();
  
  // 1. Ensure Protocol
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('mailto:')) {
      finalUrl = `https://${finalUrl}`;
  }

  try {
      let urlObj: URL;
      try {
          urlObj = new URL(finalUrl);
      } catch (e) {
          urlObj = new URL(encodeURI(finalUrl));
      }

      const hostname = urlObj.hostname.toLowerCase();

      const isAmazon = hostname.includes('amazon') || hostname.includes('amzn.to');
      const isShopee = hostname.includes('shopee') || hostname.includes('shope.ee');

      // === AMAZON DEEP-LINK LOCKDOWN ===
      if (isAmazon) {
          if (hostname.includes('amazon')) {
             // Strip Competitor Tags
             const paramsToRemove = [
                 'tag', 'linkCode', 'ref', 'ref_', 'ascsubtag', 
                 'qid', 'sr', 'crid', 'sprefix', 'context', 'psc', 
                 'pf_rd_r', 'pf_rd_p', 'pd_rd_r', 'pd_rd_w', 'pd_rd_wg',
                 'content-id', 'creative', 'creativeASIN', 'smid'
             ];
             paramsToRemove.forEach(p => urlObj.searchParams.delete(p));

             // Inject Master Affiliate Tags
             urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG); // reviewradar88-20
             urlObj.searchParams.set('linkCode', 'll2');
             urlObj.searchParams.set('language', 'en_US');
          }
      }

      // === SHOPEE DEEP-LINK LOCKDOWN ===
      else if (isShopee) {
          // Force MY domain
          if (hostname === 'shopee.com') {
              urlObj.hostname = 'shopee.com.my';
          }

          if (hostname.includes('shopee')) {
              // Strip Competitor Tracking
              const paramsToRemove = [
                  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                  'gclid', 'fbclid', 'af_siteid', 'pid', 'af_click_lookback', 'af_adset_id',
                  'is_from_login', 'smtt', 'sp_atk', 'xptdk', 'ppid'
              ];
              paramsToRemove.forEach(p => urlObj.searchParams.delete(p));

              // Inject Master Affiliate Data
              // Username: myhalalshopadmin
              urlObj.searchParams.set('utm_source', SHOPEE_AFFILIATE_USERNAME);
              
              // Medium: affiliate
              urlObj.searchParams.set('utm_medium', 'affiliate');
              
              // ID: 12372440119
              urlObj.searchParams.set('utm_content', SHOPEE_AFFILIATE_ID);
              
              // Campaign: Stealth Integration
              urlObj.searchParams.set('utm_campaign', 'orangecat_stealth_v3');
          }
      }

      return urlObj.toString();

  } catch (e) {
      return originalUrl;
  }
};
