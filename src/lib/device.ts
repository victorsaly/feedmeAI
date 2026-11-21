/** "phone" on a phone, "device" on anything else: copy that says where
 *  something is kept should not call a laptop a phone. */
export const DEVICE = /Mobi|Android|iPhone|iPod/i.test(navigator.userAgent) ? 'phone' : 'device'
