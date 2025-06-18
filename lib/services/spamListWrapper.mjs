/**
 * This is a wrapper module for @covalenthq/goldrush-enhanced-spam-lists
 * It helps avoid ESM/CommonJS compatibility issues
 */
import {
  isERC20Spam,
  Networks,
  Confidence,
} from "@covalenthq/goldrush-enhanced-spam-lists";

export { isERC20Spam, Networks, Confidence };
